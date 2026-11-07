<script setup lang="ts">
import {
  dateTime,
  shortDate,
  type PaymentMethod,
  type AdminPayment
} from '~/data/admin'
import { formatRupiah } from '~/data/landing'
import { downloadCsv, downloadFile } from '~/utils/adminExport'
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Kasir & Pembayaran — LaaTachzan' })
const { data, revenue, recordPayment, notify } = useAdminData()
const eligible = computed(() =>
  data.value.bookings.filter(
    (item) => item.status === 'completed' && !item.paid
  )
)
const selectedId = ref(eligible.value[0]?.id ?? '')
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
  data.value.bookings.filter(
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
watch([filter, search], () => {
  page.value = 1
})
watch([selectedId, method], () => {
  received.value = selected.value?.amount ?? 0
})
function focusCashier() {
  document
    .getElementById('cashier-form')
    ?.scrollIntoView({ behavior: 'smooth' })
}
function showReceipt(id: string) {
  receipt.value =
    data.value.payments.find((item) => item.bookingId === id) ?? null
  receiptOpen.value = Boolean(receipt.value)
}
function save() {
  if (!selected.value) return
  try {
    receipt.value = recordPayment(
      selected.value,
      method.value,
      method.value === 'Tunai' ? received.value : selected.value.amount
    )
    receiptOpen.value = true
    selectedId.value = eligible.value[0]?.id ?? ''
  } catch (issue) {
    notify((issue as Error).message, 'error')
  }
}
function exportPayments() {
  if (!data.value.payments.length) {
    notify('Belum ada transaksi untuk diekspor.', 'error')
    return
  }
  downloadCsv(
    'rekap-kasir-laatachzan.csv',
    data.value.payments.map((item) => ({
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
function downloadReceipt() {
  if (!receipt.value) return
  const row = receipt.value
  const booking = data.value.bookings.find((item) => item.id === row.bookingId)
  downloadFile(
    `${row.id}.txt`,
    `KLINIK LAATACHZAN\nKUITANSI PRATINJAU / DATA CONTOH\n\nNomor: ${row.id}\nBooking: ${row.bookingId}\nWali: ${booking?.guardian ?? '-'}\nTanggal: ${dateTime(row.at)}\nMetode: ${row.method}\nTotal: ${formatRupiah(row.amount)}\nDiterima: ${formatRupiah(row.received)}\nKembalian: ${formatRupiah(row.change)}\nPetugas: ${row.actor}\n\nDokumen ini adalah contoh pencatatan, bukan bukti transaksi aktual.`
  )
}
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
      <button class="admin-button primary" @click="focusCashier">
        <UIcon name="i-lucide-plus" />
        Input Pembayaran
      </button>
    </AdminPageHeading>
    <div class="admin-stats-grid">
      <AdminStatCard
        label="Total Penerimaan Tercatat"
        :value="formatRupiah(revenue)"
        :hint="`${data.payments.length} transaksi contoh lunas`"
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
        :value="data.payments.filter((item) => item.method === 'Tunai').length"
        hint="Dicatat setelah pembayaran di lokasi"
        icon="i-lucide-wallet"
      />
      <AdminStatCard
        label="Pembayaran Nontunai"
        :value="data.payments.filter((item) => item.method !== 'Tunai').length"
        hint="QRIS dan transfer klinik"
        icon="i-lucide-qr-code"
      />
    </div>
    <div class="admin-main-with-aside">
      <section class="admin-card">
        <div class="admin-card-heading">
          <div>
            <h2>Daftar Transaksi Kasir Klinik</h2>
            <p>Riwayat pembayaran dan tagihan pada dataset contoh.</p>
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
                        data.payments.find(
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
                      data.packages.find(
                        (item) => item.id === booking.packageId
                      )?.name
                    }}
                    · {{ booking.count }} anak
                  </small>
                </td>
                <td>{{ formatRupiah(booking.amount) }}</td>
                <td>
                  {{
                    data.payments.find((item) => item.bookingId === booking.id)
                      ?.method ?? '—'
                  }}
                </td>
                <td>
                  <AdminBadge :status="booking.paid ? 'paid' : 'unpaid'" />
                  <button
                    v-if="booking.status === 'completed' && !booking.paid"
                    class="admin-text-link"
                    @click="selectedId = booking.id"
                  >
                    Pilih di Kasir
                  </button>
                  <small v-else-if="!booking.paid">Layanan belum selesai</small>
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
          <AdminBadge status="active" label="Pratinjau" />
        </div>
        <form v-if="eligible.length" class="admin-form" @submit.prevent="save">
          <label class="admin-field">
            Pilih pasien setelah layanan
            <select v-model="selectedId" required>
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
                      data.packages.find(
                        (item) => item.id === selected?.packageId
                      )?.name
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
            <p class="admin-hint">
              Gunakan tombol ini untuk mencoba pencatatan pembayaran pada data
              contoh.
            </p>
            <button
              class="admin-button primary admin-full"
              type="submit"
              :disabled="method === 'Tunai' && received < selected.amount"
            >
              <UIcon name="i-lucide-receipt" />
              Simpan & Lihat Kuitansi
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
    <AdminModal
      v-model="receiptOpen"
      title="Kuitansi Pembayaran"
      description="Contoh bukti pencatatan. Tidak ada transaksi uang aktual."
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
        <button
          class="admin-button primary admin-full"
          @click="downloadReceipt"
        >
          <UIcon name="i-lucide-download" />
          Unduh Kuitansi Contoh
        </button>
      </template>
    </AdminModal>
  </div>
</template>
