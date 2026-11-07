<script setup lang="ts">
import { shortDate, statusLabels, type AdminBooking } from '~/data/admin'
const {
  data: bookings,
  status,
  error,
  refresh
} = useFetch('/api/admin/booking-inbox', { server: false })
const sending = ref('')
const sendError = ref('')
const deliveryLabels: Record<string, string> = {
  queued: 'Dalam antrean',
  sending: 'Sedang diproses',
  sent: 'Diterima gateway',
  read: 'Dibaca',
  failed: 'Perlu diperiksa'
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
  <section class="admin-card">
    <div class="admin-card-heading">
      <div>
        <h2>Pengajuan dari Website</h2>
        <p>100 pengajuan terbaru yang tersimpan di PostgreSQL.</p>
      </div>
      <button
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
      Belum ada pengajuan dari website.
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
            <th>WhatsApp</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="booking in bookings" :key="booking.code">
            <td>{{ booking.code }}</td>
            <td>
              {{ booking.guardian }}
              <br />
              {{ booking.phone }}
            </td>
            <td>{{ booking.children.join(', ') }}</td>
            <td>{{ shortDate(booking.date) }} · {{ booking.session }}</td>
            <td>
              {{ statusLabels[booking.status as AdminBooking['status']] }}
            </td>
            <td>
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
  </section>
</template>
