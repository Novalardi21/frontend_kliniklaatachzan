<script setup lang="ts">
import { shortDate, initials, dateTime } from '~/data/admin'
import { formatRupiah } from '~/data/landing'
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Dashboard Operasional — LaaTachzan' })
const {
  data,
  pending,
  todayBookings,
  revenue,
  syncing,
  synchronize,
  changeStatus,
  notify
} = useAdminData()
const manualOpen = ref(false)
const confirmed = computed(() =>
  todayBookings.value.filter(
    (item) => item.status === 'confirmed' || item.status === 'completed'
  )
)
function approve(id: string) {
  const item = data.value.bookings.find((row) => row.id === id)
  if (item) {
    try {
      changeStatus(item, 'confirmed', 'Pengajuan ditinjau melalui dashboard.')
    } catch (issue) {
      notify((issue as Error).message, 'error')
    }
  }
}
function detail(id: string) {
  return navigateTo({ path: '/admin/bookings', query: { selected: id } })
}
</script>
<template>
  <div>
    <AdminPageHeading
      eyebrow="RINGKASAN OPERASIONAL"
      title="Selamat Datang, Tim Medis LaaTachzan"
      description="Satu pandangan untuk reservasi, jadwal, dan kebutuhan keluarga hari ini."
    >
      <button
        class="admin-button secondary"
        :disabled="syncing"
        @click="synchronize"
      >
        <UIcon name="i-lucide-refresh-cw" :class="{ spinning: syncing }" />
        {{ syncing ? 'Menyinkronkan…' : 'Sinkronkan Sekarang' }}
      </button>
      <NuxtLink class="admin-button secondary" to="/admin/schedule">
        <UIcon name="i-lucide-calendar-days" />
        Kuota Hari Ini
      </NuxtLink>
      <button class="admin-button primary" @click="manualOpen = true">
        <UIcon name="i-lucide-plus" />
        Tambah Booking Manual
      </button>
    </AdminPageHeading>
    <div class="admin-context-line">
      <span>
        <UIcon name="i-lucide-calendar-days" />
        {{ shortDate(data.today) }}
      </span>
      <span>
        <span class="status-dot" />
        Klinik LaaTachzan · Pratinjau
      </span>
      <span>
        <UIcon name="i-lucide-refresh-cw" />
        Sinkronisasi contoh: {{ dateTime(data.lastSync) }}
      </span>
    </div>
    <div class="admin-stats-grid">
      <AdminStatCard
        label="Pengajuan Baru"
        :value="pending.length"
        hint="Menunggu tinjauan tim klinik"
        icon="i-lucide-inbox"
        tone="warm"
      />
      <AdminStatCard
        label="Jadwal Khitan Hari Ini"
        :value="confirmed.reduce((sum, item) => sum + item.count, 0)"
        :hint="`${confirmed.length} reservasi terkonfirmasi / selesai`"
        icon="i-lucide-briefcase-medical"
      />
      <AdminStatCard
        label="Perlu Konfirmasi Pasien"
        :value="
          data.bookings.filter((item) => item.status === 'reschedule').length
        "
        hint="Usulan jadwal menunggu kesepakatan"
        icon="i-lucide-calendar-clock"
        tone="warm"
      />
      <AdminStatCard
        label="Pembayaran Tercatat"
        :value="formatRupiah(revenue)"
        hint="Pembayaran di tempat · dataset contoh"
        icon="i-lucide-banknote"
        tone="green"
      />
    </div>
    <section class="admin-card admin-urgent">
      <div class="admin-card-heading">
        <div class="admin-title-with-icon">
          <span class="admin-warm-icon">
            <UIcon name="i-lucide-bell-ring" />
          </span>
          <div>
            <h2>Antrean Verifikasi Pengajuan</h2>
            <p>Tinjau data dan ketersediaan sebelum mengonfirmasi jadwal.</p>
          </div>
        </div>
        <span class="admin-pill">{{ pending.length }} perlu diproses</span>
      </div>
      <div v-if="pending.length" class="admin-urgent-grid">
        <article v-for="item in pending.slice(0, 3)" :key="item.id">
          <div class="admin-split">
            <code>{{ item.id }}</code>
            <AdminBadge status="pending" label="Menunggu Review" />
          </div>
          <div class="admin-patient-heading">
            <span class="admin-avatar">{{ initials(item.patient) }}</span>
            <div>
              <strong>{{ item.patient }}</strong>
              <small>{{ item.age }} tahun · {{ item.count }} anak</small>
              <small class="text-accent">
                {{
                  data.packages.find((pkg) => pkg.id === item.packageId)?.name
                }}
              </small>
            </div>
          </div>
          <dl>
            <div>
              <dt>Jadwal</dt>
              <dd>{{ shortDate(item.date) }} · {{ item.session }}</dd>
            </div>
            <div>
              <dt>Tenaga medis</dt>
              <dd>{{ item.provider }}</dd>
            </div>
          </dl>
          <div class="admin-card-actions">
            <button
              class="admin-button success small"
              @click="approve(item.id)"
            >
              <UIcon name="i-lucide-check" />
              Setujui
            </button>
            <button class="admin-button warm small" @click="detail(item.id)">
              <UIcon name="i-lucide-calendar-clock" />
              Tinjau Jadwal
            </button>
            <button
              class="admin-icon-button"
              aria-label="Lihat detail pengajuan"
              @click="detail(item.id)"
            >
              <UIcon name="i-lucide-arrow-up-right" />
            </button>
          </div>
        </article>
      </div>
      <AdminEmpty
        v-else
        title="Semua pengajuan sudah ditinjau"
        description="Pengajuan baru akan muncul di sini."
      />
    </section>
    <div class="admin-main-with-aside">
      <AdminBookingTable
        :items="data.bookings"
        compact
        @select="detail($event.id)"
      />
      <aside class="admin-support-column">
        <section class="admin-card">
          <h2 class="admin-section-title">
            <UIcon name="i-lucide-blocks" />
            Integrasi Sistem
          </h2>
          <NuxtLink to="/admin/notifications" class="admin-integration-row">
            <span class="admin-green-icon">
              <UIcon name="i-lucide-message-circle" />
            </span>
            <div>
              <strong>WhatsApp Notifikasi</strong>
              <small>
                {{
                  data.messages.filter((item) => item.status === 'queued')
                    .length
                }}
                pesan dalam antrean contoh
              </small>
            </div>
            <UIcon name="i-lucide-chevron-right" />
          </NuxtLink>
          <NuxtLink to="/admin/excel" class="admin-integration-row">
            <span class="admin-warm-icon">
              <UIcon name="i-lucide-table-2" />
            </span>
            <div>
              <strong>Master Spreadsheet</strong>
              <small>10 lembar kerja operasional</small>
            </div>
            <UIcon name="i-lucide-chevron-right" />
          </NuxtLink>
          <div class="admin-alert warm">
            <strong>Protokol pembayaran keluarga</strong>
            <p>
              Pembayaran dilakukan di tempat setelah layanan. Tidak ada
              kewajiban pembayaran di muka.
            </p>
          </div>
        </section>
        <section class="admin-card">
          <h3 class="admin-section-title">
            <UIcon name="i-lucide-heart-handshake" />
            Langkah Selanjutnya
          </h3>
          <p class="admin-hint">
            Periksa perubahan jadwal, lalu pastikan keluarga mendapat informasi
            yang sesuai.
          </p>
          <NuxtLink to="/admin/bookings" class="admin-text-link">
            Kelola pengajuan
            <UIcon name="i-lucide-arrow-right" />
          </NuxtLink>
        </section>
      </aside>
    </div>
    <AdminManualBooking v-model="manualOpen" @created="detail" />
  </div>
</template>
