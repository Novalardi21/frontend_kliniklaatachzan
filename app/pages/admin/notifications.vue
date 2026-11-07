<script setup lang="ts">
import { dateTime, maskPhone } from '~/data/admin'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'WhatsApp & Notifikasi — LaaTachzan' })
const { data, status, error, refresh } = useFetch(
  '/api/admin/notification-log',
  { server: false }
)
const tab = ref('logs')
const search = ref('')
const filter = ref('')
const selectedId = ref('')
const sending = ref('')
const sendError = ref('')
const labels: Record<string, string> = {
  queued: 'Dalam antrean',
  sending: 'Sedang diproses',
  sent: 'Diterima gateway',
  read: 'Dibaca',
  failed: 'Perlu diperiksa',
  cancelled: 'Digantikan pesan terbaru'
}
const tabs = [
  { id: 'logs', label: 'Log Pengiriman' },
  { id: 'templates', label: 'Template Pesan' }
]
const rows = computed(() =>
  (data.value?.logs ?? []).filter(
    (row) =>
      (!filter.value || row.status === filter.value) &&
      [row.code, row.recipient, row.phone]
        .join(' ')
        .toLowerCase()
        .includes(search.value.trim().toLowerCase())
  )
)
const selected = computed(
  () => rows.value.find((row) => row.id === selectedId.value) ?? rows.value[0]
)
const counts = computed(() =>
  Object.fromEntries(
    data.value?.totals.map((row) => [row.status, row.count]) ?? []
  )
)
const total = computed(() =>
  (data.value?.totals ?? []).reduce((sum, row) => sum + row.count, 0)
)
function canSend(templateId: string) {
  return (
    ['booking-guardian', 'booking-staff'].includes(templateId) ||
    (data.value?.gateway.provider === 'fonnte' &&
      ['confirmed', 'reschedule', 'rejected'].includes(templateId))
  )
}
async function send(code: string) {
  if (sending.value) return
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
  <div>
    <AdminPageHeading
      eyebrow="KOMUNIKASI KELUARGA / NOTIFIKASI"
      title="WhatsApp Gateway &amp; Notifikasi"
      description="Pantau status antrean dan pesan booking yang tercatat di PostgreSQL."
    >
      <button
        type="button"
        class="admin-button secondary"
        :disabled="status === 'pending'"
        @click="refresh()"
      >
        <UIcon name="i-lucide-refresh-cw" />
        Muat Ulang
      </button>
    </AdminPageHeading>
    <p v-if="sendError" role="alert" class="admin-alert error">
      {{ sendError }}
    </p>
    <p v-if="error" role="alert" class="admin-alert error">
      Log WhatsApp belum dapat dimuat.
    </p>
    <p v-else-if="!data" role="status">Memuat log WhatsApp…</p>
    <template v-else>
      <div class="admin-stats-grid">
        <AdminStatCard
          label="Diterima Gateway / Dibaca"
          :value="(counts.sent ?? 0) + (counts.read ?? 0)"
          hint="Status tercatat"
          icon="i-lucide-check"
          tone="green"
        />
        <AdminStatCard
          label="Dalam Antrean"
          :value="counts.queued ?? 0"
          hint="Menunggu diproses"
          icon="i-lucide-clock"
        />
        <AdminStatCard
          label="Perlu Diperiksa"
          :value="counts.failed ?? 0"
          hint="Lihat detail error di log"
          icon="i-lucide-circle-alert"
          tone="warm"
        />
        <AdminStatCard
          label="Seluruh Aktivitas"
          :value="total"
          hint="Jumlah pesan di database"
          icon="i-lucide-message-circle"
        />
      </div>
      <nav class="notification-tabs" aria-label="Tampilan notifikasi">
        <button
          v-for="item in tabs"
          :key="item.id"
          type="button"
          class="admin-button"
          :class="tab === item.id ? 'primary' : 'secondary'"
          :aria-pressed="tab === item.id"
          @click="tab = item.id"
        >
          {{ item.label }}
        </button>
      </nav>
      <div v-if="tab === 'logs'" class="admin-main-with-aside">
        <section class="admin-card">
          <div class="admin-card-heading">
            <div>
              <h2>Log Pengiriman</h2>
              <p>Hingga 100 pesan terbaru.</p>
            </div>
          </div>
          <div class="admin-form-grid notification-filters">
            <label class="admin-field">
              Cari pesan
              <input
                v-model="search"
                placeholder="Kode booking, penerima, atau nomor"
              />
            </label>
            <label class="admin-field">
              Status
              <select v-model="filter">
                <option value="">Semua status</option>
                <option v-for="(label, key) in labels" :key="key" :value="key">
                  {{ label }}
                </option>
              </select>
            </label>
          </div>
          <p v-if="!rows.length">Belum ada pesan yang cocok.</p>
          <div v-else class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Penerima</th>
                  <th>Booking</th>
                  <th>Template</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rows" :key="row.id">
                  <td>{{ dateTime(row.at) }}</td>
                  <td>
                    {{ row.recipient }}
                    <br />
                    {{
                      row.phone ? maskPhone(row.phone) : 'Nomor belum tersedia'
                    }}
                  </td>
                  <td>
                    <NuxtLink
                      :to="{
                        path: '/admin/bookings',
                        query: { selected: row.code },
                        hash: '#pengajuan-website'
                      }"
                    >
                      {{ row.code }}
                    </NuxtLink>
                  </td>
                  <td>
                    <button
                      type="button"
                      class="admin-text-link"
                      @click="selectedId = row.id"
                    >
                      {{ row.template }}
                    </button>
                  </td>
                  <td>{{ labels[row.status] ?? row.status }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <aside v-if="selected" class="admin-card notification-preview">
          <h2 class="admin-section-title">Isi Pesan</h2>
          <p>{{ selected.body }}</p>
          <p v-if="selected.error" role="status" class="admin-alert error">
            {{ selected.error }}
          </p>
          <button
            v-if="selected.status === 'queued' && canSend(selected.templateId)"
            type="button"
            class="admin-button secondary"
            :disabled="Boolean(sending)"
            @click="send(selected.code)"
          >
            {{ sending ? 'Memproses…' : 'Kirim Antrean untuk Booking Ini' }}
          </button>
        </aside>
      </div>
      <section v-else class="admin-card notification-templates">
        <h2 class="admin-section-title">Template Pesan Tersimpan</h2>
        <details v-for="item in data.templates" :key="item.id">
          <summary>
            {{ item.name }} · {{ item.active ? 'Aktif' : 'Nonaktif' }}
          </summary>
          <p>{{ item.body }}</p>
        </details>
      </section>
    </template>
  </div>
</template>

<style scoped>
.notification-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.notification-filters {
  margin-bottom: 20px;
}

.notification-preview,
.notification-templates {
  display: grid;
  gap: 14px;
}

.notification-preview .admin-section-title,
.notification-templates .admin-section-title {
  margin: 0;
}

.notification-preview p,
.notification-templates details p {
  line-height: 1.7;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.notification-templates details {
  border-top: 1px solid #eeecea;
  padding-top: 14px;
}

.notification-templates details p {
  margin-top: 10px;
}
</style>
