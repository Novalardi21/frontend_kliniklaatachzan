<script setup lang="ts">
import {
  statusLabels,
  shortDate,
  maskPhone,
  type AdminBooking
} from '~/data/admin'
import { formatRupiah } from '~/data/landing'
import { downloadCsv } from '~/utils/adminExport'
const props = defineProps<{
  items: AdminBooking[]
  selectedId?: string
  compact?: boolean
}>()
defineEmits<{ select: [booking: AdminBooking] }>()
const route = useRoute()
const { data } = useAdminData()
const search = ref(
  typeof route.query.search === 'string' ? route.query.search : ''
)
const status = ref('all')
const date = ref('')
const packageId = ref('')
const perPage = computed(() => (props.compact ? 4 : 6))
watch(
  () => route.query.search,
  (value) => {
    search.value = typeof value === 'string' ? value : ''
  }
)
const filtered = computed(() =>
  props.items.filter(
    (item) =>
      (status.value === 'all' || item.status === status.value) &&
      (!date.value || item.date === date.value) &&
      (!packageId.value || item.packageId === packageId.value) &&
      `${item.id} ${item.patient} ${item.guardian} ${item.phone}`
        .toLowerCase()
        .includes(search.value.toLowerCase().trim())
  )
)
const { page, rows: visibleRows, total } = useTablePagination(filtered, perPage)
watch([search, status, date, packageId], () => {
  page.value = 1
})
function reset() {
  search.value = ''
  status.value = 'all'
  date.value = ''
  packageId.value = ''
}
function exportRows() {
  downloadCsv(
    'booking-laatachzan.csv',
    filtered.value.map((item) => ({
      kode_registrasi: item.id,
      pasien: item.patient,
      jumlah_anak: item.count,
      wali: item.guardian,
      tanggal: item.date,
      sesi: item.session,
      paket: data.value.packages.find((pkg) => pkg.id === item.packageId)?.name,
      status: statusLabels[item.status],
      estimasi_biaya: item.amount,
      pembayaran: item.paid ? 'Lunas' : 'Belum Dibayar'
    }))
  )
}
</script>
<template>
  <section class="admin-card admin-booking-table">
    <div class="admin-card-heading">
      <div>
        <h2>Daftar Booking & Status Reservasi</h2>
        <p>Kelola pengajuan keluarga dan jadwal layanan klinik.</p>
      </div>
      <button
        class="admin-button secondary small"
        :disabled="!filtered.length"
        @click="exportRows"
      >
        <UIcon name="i-lucide-download" />
        Ekspor CSV
      </button>
    </div>
    <div class="admin-tabs" aria-label="Filter status booking">
      <button
        v-for="key in [
          'all',
          'pending',
          'confirmed',
          'reschedule',
          'completed'
        ]"
        :key="key"
        :class="{ active: status === key }"
        :aria-pressed="status === key"
        @click="status = key"
      >
        {{
          key === 'all'
            ? 'Semua'
            : statusLabels[key as keyof typeof statusLabels]
        }}
        <span>
          {{
            key === 'all'
              ? items.length
              : items.filter((item) => item.status === key).length
          }}
        </span>
      </button>
    </div>
    <div class="admin-filters">
      <label class="admin-search-field">
        <UIcon name="i-lucide-search" />
        <input
          v-model="search"
          aria-label="Cari reservasi"
          placeholder="Cari kode, nama anak, atau wali…"
        />
      </label>
      <label>
        <span class="sr-only">Filter tanggal reservasi</span>
        <input
          v-model="date"
          type="date"
          aria-label="Filter tanggal reservasi"
        />
      </label>
      <select v-model="packageId" aria-label="Filter paket">
        <option value="">Semua Paket</option>
        <option v-for="pkg in data.packages" :key="pkg.id" :value="pkg.id">
          {{ pkg.name }}
        </option>
      </select>
      <button
        class="admin-icon-button"
        aria-label="Reset filter booking"
        @click="reset"
      >
        <UIcon name="i-lucide-rotate-ccw" />
      </button>
    </div>
    <div class="admin-table-wrap">
      <table v-if="visibleRows.length" class="admin-table">
        <thead>
          <tr>
            <th scope="col">KODE & PASIEN</th>
            <th scope="col">ORANG TUA / WALI</th>
            <th scope="col">PAKET & TENAGA MEDIS</th>
            <th scope="col">JADWAL & SESI</th>
            <th scope="col">STATUS</th>
            <th v-if="!compact" scope="col">PEMBAYARAN</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in visibleRows"
            :key="item.id"
            :class="{ selected: selectedId === item.id }"
          >
            <td>
              <button class="admin-row-link" @click="$emit('select', item)">
                <code>{{ item.id }}</code>
                <strong>{{ item.patient }}</strong>
                <small>{{ item.age }} tahun · {{ item.count }} anak</small>
              </button>
              <span
                class="admin-mini-status"
                :class="item.verified ? 'text-success' : 'text-warning'"
              >
                <UIcon
                  :name="
                    item.verified
                      ? 'i-lucide-circle-check'
                      : 'i-lucide-circle-alert'
                  "
                />
                {{ item.verified ? 'Identitas ditinjau' : 'Perlu verifikasi' }}
              </span>
            </td>
            <td>
              <strong>{{ item.guardian }}</strong>
              <small>{{ maskPhone(item.phone) }}</small>
            </td>
            <td>
              <strong class="text-accent">
                {{
                  data.packages.find((pkg) => pkg.id === item.packageId)
                    ?.name ?? 'Paket diarsipkan'
                }}
              </strong>
              <small>{{ item.method }}</small>
              <small>{{ item.provider }}</small>
            </td>
            <td>
              <strong>{{ shortDate(item.date) }}</strong>
              <small>Sesi {{ item.session }}</small>
            </td>
            <td><AdminBadge :status="item.status" /></td>
            <td v-if="!compact">
              <AdminBadge :status="item.paid ? 'paid' : 'unpaid'" />
              <small>{{ formatRupiah(item.amount) }}</small>
            </td>
          </tr>
        </tbody>
      </table>
      <AdminEmpty v-else />
    </div>
    <AdminPagination v-model="page" :total="total" :page-size="perPage" />
  </section>
</template>
