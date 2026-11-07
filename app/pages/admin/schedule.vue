<script setup lang="ts">
import { relativeDate, shortDate } from '~/data/admin'
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Jadwal Layanan — LaaTachzan' })
const { data, occupied, capacity, notify } = useAdminData()
const selectedDate = ref(data.value.today)
const offset = ref(0)
const dates = computed(() =>
  Array.from({ length: 7 }, (_, index) =>
    relativeDate(data.value.today, offset.value + index)
  )
)
const selectedProvider = ref('all')
const appointments = computed(() =>
  data.value.bookings.filter(
    (item) =>
      item.date === selectedDate.value &&
      item.status !== 'rejected' &&
      (selectedProvider.value === 'all' ||
        item.provider === selectedProvider.value)
  )
)
const capacityOpen = ref(false)
const form = reactive({
  morning: data.value.capacity.morning,
  afternoon: data.value.capacity.afternoon,
  flexible: data.value.capacity.flexible
})
function resetDate() {
  offset.value = 0
  selectedDate.value = data.value.today
}
function save() {
  if (
    Object.values(form).some(
      (value) => !Number.isInteger(value) || value < 1 || value > 100
    )
  )
    return
  data.value.capacity = { ...form }
  capacityOpen.value = false
  notify('Kapasitas sesi contoh diperbarui.')
}
</script>
<template>
  <div>
    <AdminPageHeading
      eyebrow="OPERASIONAL KLINIK / PENJADWALAN"
      title="Jadwal & Kapasitas Layanan"
      description="Tinjau kunjungan keluarga dan kapasitas tenaga medis per sesi."
    >
      <button class="admin-button secondary" @click="resetDate">
        <UIcon name="i-lucide-calendar" />
        Hari Ini
      </button>
      <button class="admin-button primary" @click="capacityOpen = true">
        <UIcon name="i-lucide-sliders-horizontal" />
        Atur Kapasitas
      </button>
    </AdminPageHeading>
    <section class="admin-card">
      <div class="admin-card-heading">
        <div>
          <h2>Pekan Layanan</h2>
          <p>
            Pilih tanggal untuk melihat permintaan dan kunjungan terkonfirmasi.
          </p>
        </div>
        <div class="admin-inline-actions">
          <button
            class="admin-icon-button"
            aria-label="Pekan sebelumnya"
            :disabled="offset === 0"
            @click="offset -= 7"
          >
            <UIcon name="i-lucide-chevron-left" />
          </button>
          <button
            class="admin-icon-button"
            aria-label="Pekan berikutnya"
            @click="offset += 7"
          >
            <UIcon name="i-lucide-chevron-right" />
          </button>
        </div>
      </div>
      <div class="admin-week-grid">
        <button
          v-for="date in dates"
          :key="date"
          :class="{ active: selectedDate === date }"
          @click="selectedDate = date"
        >
          <small>
            {{
              new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(
                new Date(`${date}T12:00:00`)
              )
            }}
          </small>
          <strong>{{ Number(date.slice(-2)) }}</strong>
          <span>
            {{
              data.bookings.filter(
                (item) => item.date === date && item.status !== 'rejected'
              ).length
            }}
            reservasi
          </span>
        </button>
      </div>
    </section>
    <div class="admin-section-heading">
      <h2>{{ shortDate(selectedDate) }}</h2>
      <label class="admin-field">
        Tenaga medis
        <select v-model="selectedProvider">
          <option value="all">Semua Tenaga Medis</option>
          <option v-for="provider in data.providers" :key="provider.id">
            {{ provider.name }}
          </option>
        </select>
      </label>
    </div>
    <div class="admin-session-grid">
      <section
        v-for="session in [
          { name: 'Pagi', time: '06.00–08.00 WIB', icon: 'i-lucide-sun' },
          { name: 'Sore', time: '16.00–17.00 WIB', icon: 'i-lucide-sunset' },
          {
            name: 'Fleksibel',
            time: 'Sesuai kesepakatan',
            icon: 'i-lucide-calendar-clock'
          }
        ]"
        :key="session.name"
        class="admin-card"
      >
        <div class="admin-split">
          <span class="admin-warm-icon"><UIcon :name="session.icon" /></span>
          <AdminBadge
            :status="
              occupied(selectedDate, session.name) >= capacity(session.name)
                ? 'error'
                : 'active'
            "
            :label="`${occupied(selectedDate, session.name)} / ${capacity(session.name)} anak`"
          />
        </div>
        <h2 class="admin-session-title">Sesi {{ session.name }}</h2>
        <p class="admin-hint">{{ session.time }}</p>
        <progress
          class="admin-progress"
          :value="occupied(selectedDate, session.name)"
          :max="capacity(session.name)"
        />
        <div
          v-if="appointments.some((item) => item.session === session.name)"
          class="admin-appointment-list"
        >
          <NuxtLink
            v-for="booking in appointments.filter(
              (item) => item.session === session.name
            )"
            :key="booking.id"
            :to="{ path: '/admin/bookings', query: { selected: booking.id } }"
          >
            <strong>{{ booking.patient }}</strong>
            <code>{{ booking.id }}</code>
            <small>{{ booking.provider }} · {{ booking.count }} anak</small>
            <AdminBadge :status="booking.status" />
          </NuxtLink>
        </div>
        <AdminEmpty
          v-else
          title="Belum ada kunjungan"
          description="Reservasi untuk sesi ini akan muncul di sini."
        />
      </section>
    </div>
    <div class="admin-alert warm">
      <UIcon name="i-lucide-info" />
      <p>
        Rentang sesi merupakan preferensi layanan. Pengajuan baru belum
        mengurangi kuota terkonfirmasi sampai disetujui klinik. Jadwal usulan
        perlu persetujuan wali.
      </p>
    </div>
    <AdminModal v-model="capacityOpen" title="Atur kapasitas sesi">
      <form class="admin-form" @submit.prevent="save">
        <label
          v-for="item in [
            { key: 'morning', label: 'Sesi Pagi' },
            { key: 'afternoon', label: 'Sesi Sore' },
            { key: 'flexible', label: 'Sesi Fleksibel' }
          ]"
          :key="item.key"
          class="admin-field"
        >
          {{ item.label }} (anak per hari)
          <input
            v-model.number="form[item.key as keyof typeof form]"
            type="number"
            min="1"
            max="100"
            required
          />
        </label>
        <button class="admin-button primary" type="submit">
          Simpan Kapasitas
        </button>
      </form>
    </AdminModal>
  </div>
</template>
