<script setup lang="ts">
import { initials, shortDate } from '~/data/admin'
import { formatRupiah } from '~/data/landing'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Dashboard Operasional — LaaTachzan' })

const {
  data: dashboard,
  error,
  status,
  refresh
} = useFetch('/api/admin/dashboard', {
  key: 'clinic-admin-dashboard',
  server: false
})
const inbox = ref<{ refresh: () => Promise<unknown> }>()
async function reload() {
  await Promise.all([refresh(), inbox.value?.refresh()])
}
</script>

<template>
  <div>
    <AdminPageHeading
      eyebrow="RINGKASAN OPERASIONAL"
      title="Selamat Datang, Tim Medis LaaTachzan"
      description="Pantau reservasi, jadwal, pembayaran, dan notifikasi klinik."
    >
      <button
        class="admin-button secondary"
        type="button"
        :disabled="status === 'pending'"
        @click="reload"
      >
        <UIcon
          name="i-lucide-refresh-cw"
          :class="{ spinning: status === 'pending' }"
        />
        {{ status === 'pending' ? 'Memuat…' : 'Muat Ulang Data' }}
      </button>
      <NuxtLink
        class="admin-button primary"
        to="/admin/bookings#pengajuan-website"
      >
        <UIcon name="i-lucide-calendar-days" />
        Buka Pengajuan
      </NuxtLink>
    </AdminPageHeading>
    <p v-if="error" class="admin-alert error" role="alert">
      Ringkasan klinik belum dapat dimuat. Coba muat ulang.
    </p>
    <p v-else-if="!dashboard" role="status">Memuat ringkasan klinik…</p>
    <template v-else>
      <div class="admin-context-line">
        <span>
          <UIcon name="i-lucide-calendar-days" />
          {{ shortDate(dashboard.today) }} · WIB
        </span>
        <span>
          <span class="status-dot" />
          Klinik LaaTachzan · PostgreSQL
        </span>
      </div>
      <div class="admin-stats-grid">
        <AdminStatCard
          label="Pengajuan Baru"
          :value="dashboard.pending"
          hint="Menunggu tinjauan tim klinik"
          icon="i-lucide-inbox"
          tone="warm"
        />
        <AdminStatCard
          label="Jadwal Khitan Hari Ini"
          :value="dashboard.patients"
          :hint="dashboard.scheduled + ' reservasi terkonfirmasi atau selesai'"
          icon="i-lucide-briefcase-medical"
        />
        <AdminStatCard
          label="Perlu Konfirmasi Pasien"
          :value="dashboard.proposed"
          hint="Usulan jadwal menunggu kesepakatan"
          icon="i-lucide-calendar-clock"
          tone="warm"
        />
        <AdminStatCard
          label="Pembayaran Tercatat"
          :value="formatRupiah(Number(dashboard.revenue))"
          hint="Total pembayaran tersimpan"
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
              <p>Pengajuan terbaru yang menunggu tinjauan petugas.</p>
            </div>
          </div>
          <span class="admin-pill">{{ dashboard.pending }} perlu diproses</span>
        </div>
        <div v-if="dashboard.review.length" class="admin-urgent-grid">
          <article v-for="item in dashboard.review" :key="item.code">
            <div class="admin-split">
              <code>{{ item.code }}</code>
              <AdminBadge status="pending" label="Menunggu Review" />
            </div>
            <div class="admin-patient-heading">
              <span class="admin-avatar">{{ initials(item.patient) }}</span>
              <div>
                <strong>{{ item.patient }}</strong>
                <small>{{ item.count }} anak</small>
              </div>
            </div>
            <dl>
              <div>
                <dt>Preferensi jadwal</dt>
                <dd>{{ shortDate(item.date) }} · {{ item.session }}</dd>
              </div>
              <div>
                <dt>Tenaga medis</dt>
                <dd>{{ item.provider }}</dd>
              </div>
            </dl>
            <NuxtLink
              class="admin-button warm small"
              :to="{
                path: '/admin/bookings',
                query: { selected: item.code },
                hash: '#pengajuan-website'
              }"
            >
              Tinjau Pengajuan
              <UIcon name="i-lucide-arrow-up-right" />
            </NuxtLink>
          </article>
        </div>
        <AdminEmpty
          v-else
          title="Antrean verifikasi kosong"
          description="Pengajuan baru akan muncul di sini."
        />
      </section>
      <div class="admin-main-with-aside">
        <AdminBookingInbox ref="inbox" compact />
        <aside class="admin-support-column">
          <section class="admin-card">
            <h2 class="admin-section-title">
              <UIcon name="i-lucide-message-circle" />
              Notifikasi WhatsApp
            </h2>
            <p>
              {{ dashboard.queued }} dalam antrean ·
              {{ dashboard.failed }} perlu diperiksa
            </p>
            <NuxtLink
              to="/admin/bookings#pengajuan-website"
              class="admin-text-link"
            >
              Lihat status per pengajuan
              <UIcon name="i-lucide-arrow-up-right" />
            </NuxtLink>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
