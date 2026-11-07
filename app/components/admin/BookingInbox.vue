<script setup lang="ts">
import { shortDate, statusLabels, type AdminBooking } from '~/data/admin'
const {
  data: bookings,
  status,
  error,
  refresh
} = useFetch('/api/admin/booking-inbox', { server: false })
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
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
