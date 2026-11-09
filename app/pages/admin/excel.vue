<script setup lang="ts">
import { sheetSchema, dateTime, type AdminState } from '~/data/admin'
import { getSheetRows } from '~/utils/adminSheets'
import { downloadCsv, downloadFile } from '~/utils/adminExport'
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Integrasi & Sinkronisasi Excel — LaaTachzan' })
const { data, backups, syncing, notify, synchronize, createBackup } =
  useAdminData()
const fileInput = ref<HTMLInputElement>()
const selectedFile = ref('')
const importOpen = ref(false)
const previewOpen = ref(false)
const selectedSheet = ref(sheetSchema[0]!)
const restoreOpen = ref(false)
const restoreId = ref('')
const fileError = ref('')
const rows = computed(() => getSheetRows(data.value, selectedSheet.value.name))
const { page: previewPage, rows: previewRows, total: previewTotal } =
  useTablePagination(rows, 8)
const { page: logPage, rows: logRows, total: logTotal } =
  useTablePagination(() => data.value.syncLogs)
watch([selectedSheet, previewOpen], () => { previewPage.value = 1 })
const sheetCounts = computed(() =>
  Object.fromEntries(
    sheetSchema.map((sheet) => [
      sheet.name,
      getSheetRows(data.value, sheet.name).length
    ])
  )
)
const totalRows = computed(() =>
  Object.values(sheetCounts.value).reduce((sum, count) => sum + count, 0)
)
function preview(name: string) {
  selectedSheet.value = sheetSchema.find((sheet) => sheet.name === name)!
  previewOpen.value = true
}
function downloadSheet(name: string) {
  const sheet = sheetSchema.find((item) => item.name === name)!
  const values = getSheetRows(data.value, name)
  downloadCsv(
    `${name}-laatachzan.csv`,
    values.length
      ? values
      : [Object.fromEntries(sheet.columns.map((key) => [key, '']))]
  )
}
async function upload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  fileError.value = ''
  if (
    !file.name.toLowerCase().endsWith('.xlsx') ||
    file.size > 10 * 1024 * 1024
  ) {
    fileError.value = 'Pilih workbook .xlsx dengan ukuran maksimal 10 MB.'
    input.value = ''
    return
  }
  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  if (signature[0] !== 0x50 || signature[1] !== 0x4b) {
    fileError.value =
      'Berkas tidak memiliki struktur workbook .xlsx yang sesuai.'
    input.value = ''
    return
  }
  selectedFile.value = file.name
  importOpen.value = true
  input.value = ''
}
async function simulateImport() {
  importOpen.value = false
  await synchronize()
  notify(
    `Simulasi ${selectedFile.value} selesai. Isi workbook belum diimpor; data contoh tetap digunakan.`
  )
}
function backup() {
  const snapshot = createBackup()
  downloadFile(
    `cadangan-laatachzan-${data.value.today}.json`,
    JSON.stringify(
      { mode: 'preview', createdAt: snapshot.at, data: snapshot.data },
      null,
      2
    ),
    'application/json'
  )
}
function chooseRestore(id: string) {
  restoreId.value = id
  restoreOpen.value = true
}
function restore() {
  const backup = backups.value.find((item) => item.id === restoreId.value)
  if (!backup) return
  data.value = JSON.parse(JSON.stringify(backup.data)) as AdminState
  restoreOpen.value = false
  notify('Dataset contoh dipulihkan ke snapshot pilihan.')
}
</script>
<template>
  <div>
    <AdminPageHeading
      eyebrow="DATA OPERASIONAL / WORKBOOK"
      title="Integrasi & Sinkronisasi Excel Workbook"
      description="Tinjau skema data operasional, unduh data contoh, dan coba alur sinkronisasi workbook."
    >
      <button class="admin-button secondary" @click="fileInput?.click()">
        <UIcon name="i-lucide-file-up" />
        Unggah Workbook (.xlsx)
      </button>
      <button
        class="admin-button primary"
        :disabled="syncing"
        @click="synchronize"
      >
        <UIcon name="i-lucide-refresh-cw" :class="{ spinning: syncing }" />
        {{ syncing ? 'Menyinkronkan…' : 'Simulasikan Sinkronisasi' }}
      </button>
    </AdminPageHeading>
    <input
      ref="fileInput"
      type="file"
      accept=".xlsx"
      class="sr-only"
      aria-label="Pilih workbook Excel"
      @change="upload"
    />
    <p v-if="fileError" class="admin-alert error" role="alert">
      {{ fileError }}
    </p>
    <section class="admin-card admin-sync-summary">
      <div class="admin-title-with-icon">
        <span class="admin-green-icon large">
          <UIcon name="i-lucide-cloud-check" />
        </span>
        <div>
          <h2>Dataset Siap Ditinjau</h2>
          <p class="admin-hint">
            Sinkronisasi contoh terakhir:
            <br />
            {{ dateTime(data.lastSync) }}
          </p>
        </div>
        <AdminBadge status="active" label="Mode Pratinjau" />
      </div>
      <div class="admin-inset">
        <small>SUMBER DATA</small>
        <strong>{{ selectedFile || 'Dataset Operasional Contoh' }}</strong>
        <p>10 lembar kerja sesuai pedoman klinik</p>
      </div>
      <div class="admin-inset">
        <small>INTEGRITAS STRUKTUR</small>
        <strong class="text-success">{{ totalRows }} baris</strong>
        <p>Relasi ditampilkan untuk pemeriksaan</p>
      </div>
      <div class="admin-inset">
        <small>PENYIMPANAN</small>
        <strong>Sesi aplikasi</strong>
        <p>Belum ada koneksi workbook eksternal</p>
      </div>
    </section>
    <div class="admin-main-with-aside">
      <div>
        <div class="admin-section-heading">
          <div>
            <h2>Katalog 10 Lembar Kerja</h2>
            <p class="admin-hint">
              Struktur data operasional sesuai pedoman DESIGN.md.
            </p>
          </div>
          <span class="admin-pill">{{ totalRows }} entri contoh</span>
        </div>
        <div class="admin-sheets-grid">
          <article
            v-for="(sheet, index) in sheetSchema"
            :key="sheet.name"
            class="admin-card admin-sheet-card"
          >
            <div class="admin-split">
              <span class="admin-sheet-number">
                {{ String(index + 1).padStart(2, '0') }}
              </span>
              <div>
                <h3>
                  {{ sheet.name }}
                  <UIcon name="i-lucide-circle-check" />
                </h3>
                <p>{{ sheet.description }}</p>
              </div>
              <span class="admin-pill">
                {{ sheetCounts[sheet.name] }} baris
              </span>
            </div>
            <code>{{ sheet.columns.join(', ') }}</code>
            <div class="admin-inline-actions">
              <button
                class="admin-button secondary small"
                @click="preview(sheet.name)"
              >
                <UIcon name="i-lucide-eye" />
                Pratinjau
              </button>
              <button
                class="admin-button secondary small"
                @click="downloadSheet(sheet.name)"
              >
                <UIcon name="i-lucide-download" />
                Unduh CSV
              </button>
            </div>
          </article>
        </div>
        <section class="admin-card admin-sync-log">
          <div class="admin-card-heading">
            <div>
              <h2>Riwayat & Log Sinkronisasi</h2>
              <p>Aktivitas simulasi pada dataset contoh di sesi ini.</p>
            </div>
            <span class="admin-pill">{{ data.syncLogs.length }} aktivitas</span>
          </div>
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>WAKTU EKSEKUSI</th>
                  <th>PETUGAS</th>
                  <th>BARIS DITINJAU</th>
                  <th>KETERANGAN</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in logRows" :key="log.id">
                  <td>{{ dateTime(log.at) }}</td>
                  <td>{{ log.actor }}</td>
                  <td>{{ log.rows }} baris</td>
                  <td>{{ log.detail }}</td>
                  <td><AdminBadge :status="log.status" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <AdminPagination v-model="logPage" :total="logTotal" />
        </section>
      </div>
      <aside class="admin-support-column">
        <section class="admin-card">
          <h2 class="admin-section-title">
            <UIcon name="i-lucide-shield-check" />
            Backup & Snapshot
          </h2>
          <p class="admin-hint">
            Buat cadangan data contoh, unduh JSON, dan coba pemulihan dalam sesi
            yang sama.
          </p>
          <div
            v-for="snapshot in backups"
            :key="snapshot.id"
            class="admin-snapshot"
          >
            <strong>{{ snapshot.name }}</strong>
            <small>{{ dateTime(snapshot.at) }}</small>
            <button
              class="admin-button secondary small"
              @click="chooseRestore(snapshot.id)"
            >
              <UIcon name="i-lucide-history" />
              Pulihkan Snapshot
            </button>
          </div>
          <AdminEmpty
            v-if="!backups.length"
            title="Belum ada snapshot"
            description="Buat cadangan pertama untuk mencoba pemulihan."
          />
          <button class="admin-button secondary admin-full" @click="backup">
            <UIcon name="i-lucide-archive" />
            Buat & Unduh Cadangan
          </button>
        </section>
        <section class="admin-card">
          <h2 class="admin-section-title">Diagnostik Data</h2>
          <dl class="admin-health-list">
            <div>
              <dt>Lembar kerja</dt>
              <dd>{{ sheetSchema.length }}</dd>
            </div>
            <div>
              <dt>Reservasi</dt>
              <dd>{{ data.bookings.length }}</dd>
            </div>
            <div>
              <dt>Transaksi</dt>
              <dd>{{ data.payments.length }}</dd>
            </div>
            <div>
              <dt>Riwayat status</dt>
              <dd>{{ data.audit.length }}</dd>
            </div>
          </dl>
          <div class="admin-alert warm">
            <UIcon name="i-lucide-info" />
            <p>
              Ekspor CSV bisa dibuka di Excel. Unggah .xlsx saat ini hanya
              mensimulasikan alur; isi workbook tidak mengubah data pasien.
            </p>
          </div>
        </section>
      </aside>
    </div>
    <AdminModal
      v-model="previewOpen"
      :title="`Pratinjau ${selectedSheet.name}`"
      description="Menampilkan 8 baris per halaman."
    >
      <div class="admin-table-wrap">
        <table v-if="rows.length" class="admin-table">
          <thead>
            <tr>
              <th v-for="column in selectedSheet.columns" :key="column">
                {{ column }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in previewRows" :key="index">
              <td v-for="column in selectedSheet.columns" :key="column">
                {{ row[column] }}
              </td>
            </tr>
          </tbody>
        </table>
        <AdminEmpty
          v-else
          title="Lembar kerja masih kosong"
          description="Data akan muncul setelah ada aktivitas terkait."
        />
      </div>
      <AdminPagination v-model="previewPage" :total="previewTotal" :page-size="8" />
      <button
        class="admin-button secondary admin-full"
        @click="downloadSheet(selectedSheet.name)"
      >
        <UIcon name="i-lucide-download" />
        Unduh Lembar Kerja CSV
      </button>
    </AdminModal>
    <AdminModal
      v-model="importOpen"
      title="Pratinjau Workbook"
      description="Berkas dipilih untuk mencoba alur impor."
    >
      <div class="admin-inset">
        <strong>{{ selectedFile }}</strong>
        <p class="admin-hint">
          Struktur lembar kerja:
          {{ sheetSchema.map((sheet) => sheet.name).join(', ') }}.
        </p>
      </div>
      <p class="admin-alert warm">
        Simulasi menggunakan dataset contoh. Isi berkas belum dibaca sebagai
        data operasional.
      </p>
      <button class="admin-button primary admin-full" @click="simulateImport">
        Jalankan Simulasi Impor
      </button>
    </AdminModal>
    <AdminModal
      v-model="restoreOpen"
      title="Pulihkan Snapshot"
      description="Perubahan data contoh setelah snapshot ini akan diganti dalam sesi pratinjau."
    >
      <div class="admin-inline-actions">
        <button class="admin-button secondary" @click="restoreOpen = false">
          Batal
        </button>
        <button class="admin-button primary" @click="restore">
          Pulihkan Data Contoh
        </button>
      </div>
    </AdminModal>
  </div>
</template>
