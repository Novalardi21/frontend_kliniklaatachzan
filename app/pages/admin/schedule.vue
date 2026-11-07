<script setup lang="ts">
import { relativeDate, shortDate } from '~/data/admin'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Jadwal Layanan — LaaTachzan' })

function jakartaToday() {
  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts()
  return ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join('-')
}

const today = useState('schedule-today', jakartaToday)
const weekStart = ref(today.value)
const selectedDate = ref(today.value)
const dates = computed(() =>
  Array.from({ length: 7 }, (_, index) => relativeDate(weekStart.value, index))
)
const { data, status, refresh } = useFetch('/api/admin/schedule', {
  query: { start: weekStart },
  server: false
})
const selectedProvider = ref('all')
const dailyBookings = computed(() =>
  (data.value?.bookings ?? []).filter((item) => item.date === selectedDate.value)
)
const sessions = computed(() =>
  (data.value?.sessions ?? []).map((session) => {
    const bookings = dailyBookings.value.filter((item) => item.sessionId === session.id)
    return {
      ...session,
      occupied: bookings
        .filter((item) => item.status === 'confirmed' || item.status === 'completed')
        .reduce((total, item) => total + item.children.length, 0),
      appointments: bookings.filter(
        (item) => selectedProvider.value === 'all' || item.providerId === selectedProvider.value
      ),
      icon: session.id === 'morning' ? 'i-lucide-sun'
        : session.id === 'afternoon' ? 'i-lucide-sunset' : 'i-lucide-calendar-clock',
      time: session.startTime && session.endTime
        ? [session.startTime, session.endTime].join('–') + ' WIB'
        : 'Sesuai kesepakatan'
    }
  })
)
const providerNames = computed(() =>
  new Map(data.value?.providers.map((provider) => [provider.id, provider.name]))
)
const capacityOpen = ref(false)
const form = ref<{ id: string; name: string; capacity: number; original: number }[]>([])
const saving = ref(false)
const saveError = ref('')

function moveWeek(days: number) {
  weekStart.value = relativeDate(weekStart.value, days)
  selectedDate.value = weekStart.value
}

function resetDate() {
  today.value = jakartaToday()
  weekStart.value = today.value
  selectedDate.value = today.value
}

function editCapacity() {
  saveError.value = ''
  form.value = (data.value?.sessions ?? []).map(({ id, name, capacity }) => ({
    id, name, capacity, original: capacity
  }))
  capacityOpen.value = true
}

async function save() {
  if (saving.value) return
  saveError.value = ''
  const changes = form.value.filter((item) => item.capacity !== item.original)
  if (!changes.length) {
    capacityOpen.value = false
    return
  }
  saving.value = true
  try {
    await $fetch('/api/admin/schedule-capacity', {
      method: 'PUT',
      body: Object.fromEntries(changes.map((item) => [item.id, item.capacity]))
    })
    capacityOpen.value = false
    await refresh()
  } catch (error) {
    saveError.value = (error as { data?: { data?: { message?: string } } }).data?.data
      ?.message ?? 'Kapasitas belum dapat disimpan.'
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <div>
    <AdminPageHeading
      eyebrow="OPERASIONAL KLINIK / PENJADWALAN"
      title="Jadwal & Kapasitas Layanan"
      description="Tinjau kunjungan keluarga dan kuota layanan per sesi."
    >
      <button class="admin-button secondary" @click="resetDate">
        <UIcon name="i-lucide-calendar" />
        Hari Ini
      </button>
      <button class="admin-button primary" :disabled="status !== 'success' || !sessions.length" @click="editCapacity">
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
            @click="moveWeek(-7)"
          >
            <UIcon name="i-lucide-chevron-left" />
          </button>
          <button
            class="admin-icon-button"
            aria-label="Pekan berikutnya"
            @click="moveWeek(7)"
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
          :aria-pressed="selectedDate === date"
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
          <span v-if="status === 'success'">
            {{
              (data?.bookings ?? []).filter(
                (item) => item.date === date
              ).length
            }}
            reservasi
          </span>
        </button>
      </div>
    </section>
    <p v-if="status === 'pending' || status === 'idle'" class="admin-alert" role="status">
      Memuat jadwal layanan…
    </p>
    <div v-else-if="status === 'error'" class="admin-alert error" role="alert">
      Jadwal layanan belum dapat dimuat.
      <button type="button" class="admin-button secondary" @click="refresh()">Muat Ulang</button>
    </div>
    <template v-else>
      <div class="admin-section-heading">
        <h2>{{ shortDate(selectedDate) }}</h2>
        <label class="admin-field">
          Tenaga medis
          <select v-model="selectedProvider">
            <option value="all">Semua Tenaga Medis</option>
            <option v-for="provider in data?.providers" :key="provider.id" :value="provider.id">
              {{ provider.name }}
            </option>
          </select>
        </label>
      </div>
      <div class="admin-session-grid">
        <section
          v-for="session in sessions" :key="session.id"
          class="admin-card"
        >
          <div class="admin-split">
            <span class="admin-warm-icon"><UIcon :name="session.icon" /></span>
            <AdminBadge
              :status="
                session.occupied >= session.capacity
                  ? 'error'
                  : 'active'
              "
              :label="`${session.occupied} / ${session.capacity} anak`"
            />
          </div>
          <h2 class="admin-session-title">Sesi {{ session.name }}</h2>
          <p class="admin-hint">{{ session.time }}</p>
          <progress
            class="admin-progress"
            :value="session.occupied"
            :max="session.capacity"
          />
          <div
            v-if="session.appointments.length"
            class="admin-appointment-list"
          >
            <NuxtLink
              v-for="booking in session.appointments"
              :key="booking.code"
              :to="{ path: '/admin/bookings', query: { selected: booking.code }, hash: '#pengajuan-website' }"
            >
              <strong>{{ booking.children.join(', ') }}</strong>
              <code>{{ booking.code }}</code>
              <small>{{ providerNames.get(booking.providerId ?? '') ?? 'Ditentukan klinik' }} · {{ booking.children.length }} anak</small>
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
    </template>
    <AdminModal v-model="capacityOpen" title="Atur kapasitas sesi">
      <form class="admin-form" @submit.prevent="save">
        <p class="admin-hint">Kapasitas ini berlaku untuk setiap tanggal layanan.</p>
        <label
          v-for="item in form" :key="item.id"
          class="admin-field"
        >
          {{ item.name }} (anak per hari)
          <input
            v-model.number="item.capacity"
            type="number"
            min="1"
            max="100"
            required
          />
        </label>
        <p v-if="saveError" class="admin-alert error" role="alert">{{ saveError }}</p>
        <button class="admin-button primary" type="submit" :disabled="saving">
          {{ saving ? 'Menyimpan…' : 'Simpan Kapasitas' }}
        </button>
      </form>
    </AdminModal>
  </div>
</template>
