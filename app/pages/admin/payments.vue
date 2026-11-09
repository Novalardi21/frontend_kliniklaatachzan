<script setup lang="ts">
import {
  dateTime,
  shortDate,
  type PaymentMethod,
  type AdminPayment
} from '~/data/admin'
import { formatRupiah } from '~/data/landing'
import { downloadCsv } from '~/utils/adminExport'
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Kasir & Pembayaran — LaaTachzan' })
const { data: records, status, refresh } = useFetch('/api/admin/payments', {
  server: false
})
const bookings = computed(() =>
  (records.value ?? []).map((item) => ({ ...item, paid: Boolean(item.payment) }))
)
const payments = computed(() => bookings.value.flatMap((item) => item.payment ? [item.payment] : []))
const revenue = computed(() => payments.value.reduce((total, item) => total + item.amount, 0))
const saving = ref(false)
const notice = ref('')
const eligible = computed(() =>
  bookings.value.filter(
    (item) => item.status === 'completed' && !item.paid && item.amount > 0
  )
)
const selectedId = ref('')
const selected = computed(() =>
  eligible.value.find((item) => item.id === selectedId.value)
)
const method = ref<PaymentMethod>('Tunai')
const received = ref(selected.value?.amount ?? 0)
const filter = ref('all')
const search = ref('')
const page = ref(1)
const receipt = ref<AdminPayment | null>(null)
const receiptOpen = ref(false)
const filtered = computed(() =>
  bookings.value.filter(
    (item) =>
      (filter.value === 'all' ||
        (filter.value === 'paid'
          ? item.paid
          : item.status === 'completed' && !item.paid)) &&
      `${item.id} ${item.patient} ${item.guardian}`
        .toLowerCase()
        .includes(search.value.trim().toLowerCase())
  )
)
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 6)))
const rows = computed(() =>
  filtered.value.slice((page.value - 1) * 6, page.value * 6)
)
watch(eligible, (items) => {
  if (!items.some((item) => item.id === selectedId.value))
    selectedId.value = items[0]?.id ?? ''
})
watch(pages, (last) => { page.value = Math.min(page.value, last) })
watch([filter, search], () => {
  page.value = 1
})
watch([selectedId, method], () => {
  received.value = selected.value?.amount ?? 0
})
function focusCashier() {
  document.getElementById('cashier-booking')?.focus({ preventScroll: true })
  document
    .getElementById('cashier-form')
    ?.scrollIntoView({ behavior: 'smooth' })
}
function showReceipt(id: string) {
  receipt.value =
    payments.value.find((item) => item.bookingId === id) ?? null
  receiptOpen.value = Boolean(receipt.value)
}
async function save() {
  if (!selected.value || saving.value) return
  saving.value = true
  notice.value = ''
  try {
    receipt.value = await $fetch('/api/admin/payments', {
      method: 'POST',
      body: { code: selected.value.id, method: method.value, received: received.value }
    })
    receiptOpen.value = true
    await refresh()
    await refreshNuxtData('clinic-admin-dashboard')
  } catch (issue) {
    notice.value = (issue as { data?: { data?: { message?: string } } }).data?.data
      ?.message ?? 'Pembayaran belum dapat disimpan.'
  } finally {
    saving.value = false
  }
}
function exportPayments() {
  if (!payments.value.length) {
    notice.value = 'Belum ada transaksi untuk diekspor.'
    return
  }
  downloadCsv(
    'rekap-kasir-laatachzan.csv',
    payments.value.map((item) => ({
      kuitansi: item.id,
      booking: item.bookingId,
      jumlah: item.amount,
      metode: item.method,
      diterima: item.received,
      kembalian: item.change,
      petugas: item.actor,
      waktu: item.at
    }))
  )
}
const downloadingReceipt = ref(false)
const receiptError = ref('')
async function downloadReceipt() {
  if (!receipt.value || downloadingReceipt.value) return
  const row = receipt.value
  const booking = bookings.value.find((item) => item.id === row.bookingId)
  downloadingReceipt.value = true
  receiptError.value = ''
  try {
    const { createPaymentReceipt } = await import('~/utils/paymentReceipt')
    const pdf = createPaymentReceipt(
      [
        ['Nomor kuitansi', row.id],
        ['Kode booking', row.bookingId],
        ['Nama wali', booking?.guardian ?? '-'],
        ['Tanggal pembayaran', dateTime(row.at)],
        ['Metode pembayaran', row.method],
        ['Petugas', row.actor]
      ],
      [
        ['Total pembayaran', formatRupiah(row.amount)],
        ['Uang diterima', formatRupiah(row.received)],
        ['Kembalian', formatRupiah(row.change)]
      ]
    )
    pdf.save(`${row.id}.pdf`)
  } catch {
    receiptError.value = 'Kuitansi PDF belum dapat diunduh. Coba lagi.'
  } finally {
    downloadingReceipt.value = false
  }
}
watch(receipt, () => { receiptError.value = '' })
</script>
<template>
  <div>
    <AdminPageHeading
      eyebrow="KASIR MEDIS / PEMBAYARAN DI TEMPAT"
      title="Kasir & Pembayaran di Tempat"
      description="Catat pembayaran tunai, QRIS, dan transfer setelah layanan selesai."
    >
      <button class="admin-button secondary" @click="exportPayments">
        <UIcon name="i-lucide-download" />
        Unduh Rekap Kasir
      </button>
      <button
        v-if="status === 'success' && eligible.length"
        type="button"
        class="admin-button primary"
        @click="focusCashier"
      >
        <UIcon name="i-lucide-plus" />
        Input Pembayaran
      </button>
      <NuxtLink
        v-else-if="status === 'success'"
        to="/admin/bookings"
        class="admin-button primary"
      >
        <UIcon name="i-lucide-calendar-check" />
        Lihat Reservasi
      </NuxtLink>
    </AdminPageHeading>
    <p v-if="notice" class="admin-alert error" role="alert">{{ notice }}</p>
    <div v-if="status === 'error'" class="admin-alert error" role="alert">
      Data pembayaran belum dapat dimuat.
      <button class="admin-button secondary" @click="refresh()">Muat Ulang</button>
    </div>
    <p v-else-if="status !== 'success'" role="status">Memuat data pembayaran…</p>
    <template v-else>
      <div class="admin-stats-grid">
        <AdminStatCard
          label="Total Penerimaan Tercatat"
          :value="formatRupiah(revenue)"
          :hint="`${payments.length} transaksi lunas`"
          icon="i-lucide-banknote"
          tone="green"
        />
        <AdminStatCard
          label="Menunggu Kasir"
          :value="
            formatRupiah(eligible.reduce((sum, item) => sum + item.amount, 0))
          "
          :hint="`${eligible.length} reservasi selesai, belum dibayar`"
          icon="i-lucide-clipboard-clock"
          tone="warm"
        />
        <AdminStatCard
          label="Transaksi Tunai"
          :value="payments.filter((item) => item.method === 'Tunai').length"
          hint="Dicatat setelah pembayaran di lokasi"
          icon="i-lucide-wallet"
        />
        <AdminStatCard
          label="Pembayaran Nontunai"
          :value="payments.filter((item) => item.method !== 'Tunai').length"
          hint="QRIS dan transfer klinik"
          icon="i-lucide-qr-code"
        />
      </div>
      <div class="admin-main-with-aside">
        <section class="admin-card">
          <div class="admin-card-heading">
            <div>
              <h2>Daftar Transaksi Kasir Klinik</h2>
              <p>Riwayat pembayaran dan tagihan layanan selesai.</p>
            </div>
            <select v-model="filter" aria-label="Filter pembayaran">
              <option value="all">Semua Status</option>
              <option value="paid">Lunas</option>
              <option value="unpaid">Menunggu Kasir</option>
            </select>
          </div>
          <label class="admin-search-field admin-search-full">
            <UIcon name="i-lucide-search" />
            <input
              v-model="search"
              aria-label="Cari transaksi"
              placeholder="Cari kode, pasien, atau wali…"
            />
          </label>
          <div class="admin-table-wrap">
            <table v-if="rows.length" class="admin-table">
              <thead>
                <tr>
                  <th>KUITANSI & BOOKING</th>
                  <th>ANAK & ORANG TUA</th>
                  <th>TAGIHAN</th>
                  <th>METODE</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="booking in rows" :key="booking.id">
                  <td>
                    <button
                      v-if="booking.paid"
                      class="admin-row-link"
                      @click="showReceipt(booking.id)"
                    >
                      <code>
                        {{
                          payments.find(
                            (item) => item.bookingId === booking.id
                          )?.id
                        }}
                      </code>
                      <small>{{ booking.id }}</small>
                    </button>
                    <template v-else>
                      <code>{{ booking.id }}</code>
                      <small>{{ shortDate(booking.date) }}</small>
                    </template>
                  </td>
                  <td>
                    <strong>{{ booking.patient }}</strong>
                    <small>{{ booking.guardian }}</small>
                    <small>
                      {{
                        booking.packages
                      }}
                      · {{ booking.count }} anak
                    </small>
                  </td>
                  <td>{{ formatRupiah(booking.amount) }}</td>
                  <td>
                    {{
                      payments.find((item) => item.bookingId === booking.id)
                        ?.method ?? '—'
                    }}
                  </td>
                  <td>
                    <AdminBadge :status="booking.paid ? 'paid' : 'unpaid'" />
                    <button
                      v-if="!booking.paid && booking.amount > 0"
                      class="admin-text-link"
                      @click="selectedId = booking.id"
                    >
                      Pilih di Kasir
                    </button>
                    <small v-else-if="!booking.paid">Tagihan belum tersedia</small>
                  </td>
                </tr>
              </tbody>
            </table>
            <AdminEmpty v-else />
          </div>
          <div class="admin-pagination">
            <span>{{ filtered.length }} reservasi</span>
            <div>
              <button
                aria-label="Transaksi sebelumnya"
                :disabled="page === 1"
                @click="page--"
              >
                <UIcon name="i-lucide-chevron-left" />
              </button>
              <span>{{ page }} / {{ pages }}</span>
              <button
                aria-label="Transaksi berikutnya"
                :disabled="page >= pages"
                @click="page++"
              >
                <UIcon name="i-lucide-chevron-right" />
              </button>
            </div>
          </div>
          <div class="admin-alert warm">
            <UIcon name="i-lucide-shield-check" />
            <p>
              Pembayaran di tempat dicatat setelah layanan selesai. Tarif
              menggunakan paket yang disepakati dalam reservasi.
            </p>
          </div>
        </section>
        <aside id="cashier-form" class="admin-card admin-cashier">
          <div class="admin-card-heading">
            <div>
              <h2>Form Kasir Cepat</h2>
              <p>Pencatatan pembayaran di lokasi</p>
            </div>
          </div>
          <form v-if="eligible.length" class="admin-form" @submit.prevent="save">
            <label class="admin-field">
              Pilih pasien setelah layanan
              <select id="cashier-booking" v-model="selectedId" required>
                <option value="" disabled>Pilih reservasi</option>
                <option
                  v-for="booking in eligible"
                  :key="booking.id"
                  :value="booking.id"
                >
                  {{ booking.patient }} · {{ booking.id }}
                </option>
              </select>
            </label>
            <template v-if="selected">
              <div class="admin-inset">
                <dl class="admin-receipt-list">
                  <div>
                    <dt>Pasien</dt>
                    <dd>{{ selected.patient }}</dd>
                  </div>
                  <div>
                    <dt>Wali</dt>
                    <dd>{{ selected.guardian }}</dd>
                  </div>
                  <div>
                    <dt>Paket</dt>
                    <dd>
                      {{
                        selected.packages
                      }}
                    </dd>
                  </div>
                </dl>
              </div>
              <h3 class="admin-small-heading">Rincian Tagihan</h3>
              <div class="admin-inset">
                <div class="admin-split">
                  <span>Tarif {{ selected.count }} anak</span>
                  <strong>{{ formatRupiah(selected.amount) }}</strong>
                </div>
                <p class="admin-hint">Perlengkapan perawatan sesuai paket.</p>
              </div>
              <fieldset class="admin-method-selector">
                <legend>Metode pembayaran di tempat</legend>
                <label
                  v-for="item in [
                    { name: 'Tunai', icon: 'i-lucide-banknote' },
                    { name: 'QRIS', icon: 'i-lucide-qr-code' },
                    { name: 'Transfer', icon: 'i-lucide-landmark' }
                  ]"
                  :key="item.name"
                  :class="{ active: method === item.name }"
                >
                  <input
                    v-model="method"
                    type="radio"
                    name="cashier-method"
                    :value="item.name"
                  />
                  <UIcon :name="item.icon" />
                  {{ item.name }}
                </label>
              </fieldset>
              <label v-if="method === 'Tunai'" class="admin-field">
                Uang diterima (Rp)
                <input
                  v-model.number="received"
                  type="number"
                  :min="selected.amount"
                  required
                  step="1"
                />
              </label>
              <div v-if="method === 'Tunai'" class="admin-split">
                <span>Kembalian</span>
                <strong class="text-success">
                  {{ formatRupiah(Math.max(0, received - selected.amount)) }}
                </strong>
              </div>
              <div class="admin-cashier-total">
                <span>Total Bayar</span>
                <strong>{{ formatRupiah(selected.amount) }}</strong>
              </div>
              <button
                class="admin-button primary admin-full"
                type="submit"
                :disabled="saving || (method === 'Tunai' && received < selected.amount)"
              >
                <UIcon name="i-lucide-receipt" />
                {{ saving ? 'Menyimpan…' : 'Simpan & Lihat Kuitansi' }}
              </button>
            </template>
          </form>
          <AdminEmpty
            v-else
            title="Tidak ada tagihan menunggu"
            description="Reservasi muncul setelah layanan ditandai selesai dan belum dibayar."
          >
            <NuxtLink to="/admin/bookings" class="admin-button secondary">
              Lihat Reservasi
            </NuxtLink>
          </AdminEmpty>
        </aside>
      </div>
    </template>
    <AdminModal
      v-model="receiptOpen"
      title="Kuitansi Pembayaran"
    >
      <template v-if="receipt">
        <div class="admin-receipt">
          <LandingBrand />
          <code>{{ receipt.id }}</code>
          <AdminBadge status="paid" />
          <dl class="admin-receipt-list">
            <div>
              <dt>Booking</dt>
              <dd>{{ receipt.bookingId }}</dd>
            </div>
            <div>
              <dt>Waktu</dt>
              <dd>{{ dateTime(receipt.at) }}</dd>
            </div>
            <div>
              <dt>Metode</dt>
              <dd>{{ receipt.method }}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{{ formatRupiah(receipt.amount) }}</dd>
            </div>
            <div>
              <dt>Diterima</dt>
              <dd>{{ formatRupiah(receipt.received) }}</dd>
            </div>
            <div>
              <dt>Kembalian</dt>
              <dd>{{ formatRupiah(receipt.change) }}</dd>
            </div>
            <div>
              <dt>Petugas</dt>
              <dd>{{ receipt.actor }}</dd>
            </div>
          </dl>
        </div>
        <p v-if="receiptError" class="admin-alert error" role="alert">{{ receiptError }}</p>
        <button
          class="admin-button primary admin-full"
          type="button"
          :disabled="downloadingReceipt"
          @click="downloadReceipt"
        >
          <UIcon name="i-lucide-download" />
          {{ downloadingReceipt ? 'Menyiapkan PDF…' : 'Unduh Kuitansi PDF' }}
        </button>
      </template>
    </AdminModal>
  </div>
</template>
