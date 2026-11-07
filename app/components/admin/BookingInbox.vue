<script setup lang="ts">
import { shortDate, statusLabels, type AdminBooking } from '~/data/admin'
const props = defineProps<{ compact?: boolean }>()
const route = useRoute()
const selected = computed(() =>
  !props.compact && typeof route.query.selected === 'string'
    ? route.query.selected
    : ''
)
const search = computed(() =>
  !props.compact && !selected.value && typeof route.query.search === 'string'
    ? route.query.search
    : ''
)
const {
  data: bookings,
  status,
  error,
  refresh
} = useFetch('/api/admin/booking-inbox', {
  server: false,
  key: props.compact ? 'clinic-inbox-compact' : 'clinic-inbox-full',
  query: { compact: props.compact ? 'true' : 'false', selected, search }
})
defineExpose({ refresh })
async function refreshAfterReview() {
  clearNuxtData('clinic-admin-dashboard')
  await refresh()
}
const sending = ref('')
const sendError = ref('')
const deliveryLabels: Record<string, string> = {
  queued: 'Dalam antrean',
  sending: 'Sedang diproses',
  sent: 'Diterima gateway',
  read: 'Dibaca',
  failed: 'Perlu diperiksa',
  cancelled: 'Digantikan pesan terbaru'
}
async function sendWhatsApp(code: string) {
  sending.value = code
  sendError.value = ''
  try {
    await $fetch('/api/admin/booking-whatsapp', {
      method: 'POST',
      body: { code }
    })
  } catch (issue) {
    sendError.value =
      (issue as { data?: { data?: { message?: string } } }).data?.data
        ?.message ?? 'Antrean WhatsApp belum dapat diproses.'
  } finally {
    await refresh()
    sending.value = ''
  }
}
</script>

<template>
  <section id="pengajuan-website" class="admin-card">
    <div class="admin-card-heading">
      <div>
        <h2>
          {{
            selected ? 'Detail Pengajuan Tersimpan' : 'Pengajuan dari Website'
          }}
        </h2>
        <p v-if="selected">Nomor {{ selected }}</p>
        <p v-else>
          {{ compact ? 'Enam' : 'Hingga 100' }} pengajuan terbaru yang tersimpan
          di PostgreSQL.
        </p>
      </div>
      <NuxtLink
        v-if="compact || selected || search"
        to="/admin/bookings#pengajuan-website"
        class="admin-button secondary small"
      >
        Lihat Semua
      </NuxtLink>
      <button
        v-else
        type="button"
        class="admin-button secondary small"
        :disabled="status === 'pending'"
        @click="refresh()"
      >
        Muat Ulang
      </button>
    </div>
    <p v-if="sendError" role="alert">{{ sendError }}</p>
    <p v-if="status === 'pending'" role="status">Memuat pengajuan…</p>
    <p v-else-if="error" role="alert">
      Pengajuan belum dapat dimuat. Periksa koneksi dan migrasi 007.
    </p>
    <p v-else-if="status === 'success' && !bookings?.length">
      {{
        selected || search
          ? 'Pengajuan yang dicari tidak ditemukan.'
          : 'Belum ada pengajuan dari website.'
      }}
    </p>
    <div v-else-if="bookings?.length" class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Kode</th>
            <th>Wali / WhatsApp</th>
            <th>Pasien</th>
            <th>Preferensi jadwal</th>
            <th>Status</th>
            <th v-if="!compact">WhatsApp</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="booking in bookings" :key="booking.code">
            <td>
              <NuxtLink
                class="admin-text-link"
                :to="{
                  path: '/admin/bookings',
                  query: { selected: booking.code },
                  hash: '#pengajuan-website'
                }"
              >
                {{ booking.code }}
              </NuxtLink>
            </td>
            <td>
              {{ booking.guardian }}
              <br />
              {{ compact ? '' : booking.phone }}
            </td>
            <td>{{ booking.children.join(', ') }}</td>
            <td>{{ shortDate(booking.date) }} · {{ booking.session }}</td>
            <td>
              {{ statusLabels[booking.status as AdminBooking['status']] }}
            </td>
            <td v-if="!compact">
              <div
                v-for="message in booking.notifications"
                :key="message.audience"
              >
                {{ message.audience }} ·
                {{ deliveryLabels[message.status] ?? message.status }}
                <small
                  v-if="message.status === 'queued' && !message.hasRecipient"
                >
                  · Nomor belum tersedia di antrean
                </small>
                <small v-if="message.error">· {{ message.error }}</small>
              </div>
              <button
                v-if="
                  booking.notifications.some(
                    (message) => message.status === 'queued'
                  )
                "
                type="button"
                class="admin-button secondary small"
                :disabled="Boolean(sending)"
                @click="sendWhatsApp(booking.code)"
              >
                {{
                  sending === booking.code ? 'Memproses…' : 'Kirim Antrean WA'
                }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <AdminLiveBookingReview
      v-if="selected && bookings?.[0]?.code === selected"
      :key="selected + bookings[0].version"
      :booking="bookings[0]"
      @updated="refreshAfterReview()"
    />
  </section>
</template>
