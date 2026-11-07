<script setup lang="ts">
import {
  messageLabels,
  dateTime,
  maskPhone,
  type AdminMessage
} from '~/data/admin'
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'WhatsApp & Notifikasi — LaaTachzan' })
const { data, notify, addMessage, renderMessage } = useAdminData()
const tab = ref('logs')
const search = ref('')
const status = ref('all')
const page = ref(1)
const selectedId = ref(data.value.messages[0]?.id)
const selected = computed(
  () =>
    data.value.messages.find((item) => item.id === selectedId.value) ??
    data.value.messages[0]
)
const filtered = computed(() =>
  data.value.messages.filter(
    (item) =>
      (status.value === 'all' || item.status === status.value) &&
      `${item.bookingId} ${item.recipient} ${item.phone}`
        .toLowerCase()
        .includes(search.value.trim().toLowerCase())
  )
)
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 6)))
const rows = computed(() =>
  filtered.value.slice((page.value - 1) * 6, page.value * 6)
)
watch([search, status], () => {
  page.value = 1
})
watch(pages, (value) => {
  if (page.value > value) page.value = value
})
const manualOpen = ref(false)
const target = ref(data.value.bookings[0]?.id ?? '')
const templateId = ref('received')
const text = ref('')
const templateOpen = ref(false)
const editTemplateId = ref('received')
const templateText = ref('')
const settings = reactive({
  enabled: data.value.gateway.enabled,
  phone: data.value.gateway.phone,
  delay: data.value.gateway.delay
})
const totalSent = computed(
  () =>
    data.value.messages.filter(
      (item) => item.status === 'sent' || item.status === 'read'
    ).length
)
function fillMessage() {
  const booking = data.value.bookings.find((item) => item.id === target.value)
  text.value = booking ? renderMessage(booking, templateId.value) : ''
}
watch([target, templateId], fillMessage)
function startMessage() {
  fillMessage()
  manualOpen.value = true
}
function send() {
  const booking = data.value.bookings.find((item) => item.id === target.value)
  if (!booking || !text.value.trim()) return
  addMessage(booking, templateId.value, text.value.trim())
  selectedId.value = data.value.messages[0]?.id
  manualOpen.value = false
  notify(
    'Pesan masuk antrean simulasi. Tidak ada pesan WhatsApp sungguhan dikirim.'
  )
}
function retry(message: AdminMessage) {
  if (!data.value.gateway.enabled) {
    notify('Aktifkan gateway simulasi di pengaturan terlebih dahulu.', 'error')
    return
  }
  message.status = 'sent'
  message.at = new Date().toISOString()
  notify('Simulasi pengiriman berhasil. Tidak ada pesan eksternal dikirim.')
}
function processQueue() {
  if (!data.value.gateway.enabled) {
    notify('Gateway simulasi sedang dinonaktifkan.', 'error')
    return
  }
  const queued = data.value.messages.filter((item) => item.status === 'queued')
  if (!queued.length) {
    notify('Tidak ada pesan dalam antrean.')
    return
  }
  queued.forEach((item) => {
    item.status = 'sent'
    item.at = new Date().toISOString()
  })
  notify(`${queued.length} pesan selesai diproses pada simulasi.`)
}
function editTemplate(id: string) {
  editTemplateId.value = id
  templateText.value =
    data.value.templates.find((item) => item.id === id)?.content ?? ''
  templateOpen.value = true
}
function saveTemplate() {
  const item = data.value.templates.find(
    (value) => value.id === editTemplateId.value
  )
  if (!item || !templateText.value.trim()) return
  const unsupported = [...templateText.value.matchAll(/\{([^}]+)\}/g)].some(
    (match) => !['nama_wali', 'kode', 'tanggal', 'sesi'].includes(match[1]!)
  )
  if (unsupported) {
    notify('Gunakan variabel nama_wali, kode, tanggal, dan sesi saja.', 'error')
    return
  }
  item.content = templateText.value.trim()
  templateOpen.value = false
  notify('Template pesan contoh diperbarui.')
}
function saveSettings() {
  if (!/^(?:\+62|62|0)8[0-9]{8,11}$/.test(settings.phone)) {
    notify('Periksa format nomor WhatsApp contoh.', 'error')
    return
  }
  data.value.gateway = { ...settings }
  notify('Pengaturan gateway simulasi disimpan.')
}
</script>
<template>
  <div>
    <AdminPageHeading
      eyebrow="KOMUNIKASI KELUARGA / NOTIFIKASI"
      title="WhatsApp Gateway & Notifikasi Otomatis"
      description="Tinjau log, kelola template, dan coba alur komunikasi reservasi keluarga."
    >
      <button
        class="admin-button secondary"
        @click="
          notify(
            data.gateway.enabled
              ? 'Gateway simulasi siap digunakan. Belum terhubung ke nomor WhatsApp nyata.'
              : 'Gateway simulasi sedang dinonaktifkan.',
            data.gateway.enabled ? 'success' : 'error'
          )
        "
      >
        <UIcon name="i-lucide-radio" />
        Uji Koneksi Gateway
      </button>
      <button class="admin-button primary" @click="startMessage">
        <UIcon name="i-lucide-send" />
        Buat Pesan Manual
      </button>
    </AdminPageHeading>
    <div class="admin-notification-overview">
      <section class="admin-card">
        <div class="admin-split">
          <span class="admin-eyebrow">LAYANAN WHATSAPP</span>
          <AdminBadge
            :status="data.gateway.enabled ? 'active' : 'inactive'"
            :label="data.gateway.enabled ? 'Simulasi Aktif' : 'Dinonaktifkan'"
          />
        </div>
        <div class="admin-gateway-title">
          <span class="admin-green-icon large">
            <UIcon name="i-lucide-message-square-check" />
          </span>
          <div>
            <h2>Gateway LaaTachzan</h2>
            <p>Pratinjau komunikasi klinik</p>
            <code>{{ maskPhone(data.gateway.phone) }}</code>
          </div>
        </div>
        <div class="admin-alert warm">
          Tidak ada koneksi atau pengiriman ke WhatsApp sungguhan dalam mode
          pratinjau.
        </div>
      </section>
      <section class="admin-card">
        <div class="admin-card-heading">
          <div>
            <span class="admin-eyebrow">STATISTIK DATA CONTOH</span>
            <h2>Efisiensi Notifikasi Pasien</h2>
          </div>
          <button class="admin-text-link" @click="processQueue">
            <UIcon name="i-lucide-play" />
            Proses Antrean
          </button>
        </div>
        <div class="admin-notification-stats">
          <div>
            <small>Terkirim / Dibaca</small>
            <strong class="text-success">{{ totalSent }}</strong>
            <span>pesan contoh</span>
          </div>
          <div>
            <small>Dalam Antrean</small>
            <strong class="text-warning">
              {{
                data.messages.filter((item) => item.status === 'queued').length
              }}
            </strong>
            <span>menunggu simulasi</span>
          </div>
          <div>
            <small>Pesan Gagal</small>
            <strong class="text-error">
              {{
                data.messages.filter((item) => item.status === 'failed').length
              }}
            </strong>
            <span>bisa dikirim ulang</span>
          </div>
          <div>
            <small>Seluruh Aktivitas</small>
            <strong>{{ data.messages.length }}</strong>
            <span>riwayat sesi ini</span>
          </div>
        </div>
        <p class="admin-hint">
          Jeda pengiriman contoh: {{ data.gateway.delay }} detik · Nomor
          penerima disamarkan pada tabel.
        </p>
      </section>
    </div>
    <div class="admin-tabs admin-notification-tabs">
      <button
        v-for="item in [
          {
            id: 'logs',
            label: 'Log Pengiriman',
            icon: 'i-lucide-clipboard-list'
          },
          {
            id: 'templates',
            label: 'Template Pesan',
            icon: 'i-lucide-file-text'
          },
          {
            id: 'settings',
            label: 'Pengaturan Gateway',
            icon: 'i-lucide-sliders-horizontal'
          }
        ]"
        :key="item.id"
        :class="{ active: tab === item.id }"
        @click="tab = item.id"
      >
        <UIcon :name="item.icon" />
        {{ item.label }}
      </button>
    </div>
    <div v-if="tab === 'logs'" class="admin-main-with-aside">
      <section class="admin-card">
        <div class="admin-card-heading">
          <h2>Aktivitas WhatsApp Pasien</h2>
          <span class="admin-pill">{{ filtered.length }} entri</span>
        </div>
        <div class="admin-filters">
          <label class="admin-search-field">
            <UIcon name="i-lucide-search" />
            <input
              v-model="search"
              aria-label="Cari notifikasi"
              placeholder="Cari nomor, wali, atau booking…"
            />
          </label>
          <select v-model="status" aria-label="Filter status notifikasi">
            <option value="all">Semua Status</option>
            <option
              v-for="(label, key) in messageLabels"
              :key="key"
              :value="key"
            >
              {{ label }}
            </option>
          </select>
        </div>
        <div class="admin-table-wrap">
          <table v-if="rows.length" class="admin-table">
            <thead>
              <tr>
                <th>WAKTU</th>
                <th>PENERIMA</th>
                <th>KODE BOOKING</th>
                <th>TEMPLATE</th>
                <th>STATUS & AKSI</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="message in rows"
                :key="message.id"
                :class="{ selected: message.id === selected?.id }"
              >
                <td>{{ dateTime(message.at) }}</td>
                <td>
                  <strong>{{ message.recipient }}</strong>
                  <small>{{ maskPhone(message.phone) }}</small>
                </td>
                <td>
                  <button
                    class="admin-row-link"
                    @click="selectedId = message.id"
                  >
                    <code>{{ message.bookingId }}</code>
                  </button>
                </td>
                <td>{{ message.template }}</td>
                <td>
                  <AdminBadge :status="message.status" />
                  <button
                    v-if="['failed', 'queued'].includes(message.status)"
                    class="admin-text-link"
                    @click="retry(message)"
                  >
                    {{
                      message.status === 'failed'
                        ? 'Kirim Ulang'
                        : 'Simulasikan Kirim'
                    }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <AdminEmpty v-else />
        </div>
        <div class="admin-pagination">
          <span>{{ filtered.length }} aktivitas contoh</span>
          <div>
            <button
              aria-label="Notifikasi sebelumnya"
              :disabled="page === 1"
              @click="page--"
            >
              <UIcon name="i-lucide-chevron-left" />
            </button>
            <span>{{ page }} / {{ pages }}</span>
            <button
              aria-label="Notifikasi berikutnya"
              :disabled="page === pages"
              @click="page++"
            >
              <UIcon name="i-lucide-chevron-right" />
            </button>
          </div>
        </div>
        <div class="admin-alert warm">
          <UIcon name="i-lucide-shield-check" />
          <p>
            Pesan berfokus pada kode pengajuan dan jadwal. Hindari NIK, foto,
            dan riwayat kesehatan dalam notifikasi WhatsApp.
          </p>
        </div>
      </section>
      <aside class="admin-card admin-phone-card">
        <div class="admin-card-heading">
          <div>
            <h2>Pratinjau Pesan</h2>
            <p>Contoh tampilan pada perangkat wali.</p>
          </div>
        </div>
        <div class="admin-phone">
          <div class="admin-phone-notch" />
          <div class="admin-phone-header">
            <UIcon name="i-lucide-arrow-left" />
            <span class="admin-avatar">LT</span>
            <div>
              <strong>Klinik LaaTachzan</strong>
              <small>Pratinjau WhatsApp</small>
            </div>
            <UIcon name="i-lucide-phone" />
          </div>
          <div class="admin-phone-screen">
            <span>HARI INI</span>
            <article v-if="selected">
              <strong>Klinik LaaTachzan</strong>
              <p>{{ selected.text }}</p>
              <small>{{ dateTime(selected.at) }} · Simulasi</small>
            </article>
            <p v-else>Belum ada pesan.</p>
          </div>
          <div class="admin-phone-input">
            Balas pesan…
            <UIcon name="i-lucide-mic" />
          </div>
        </div>
        <button
          class="admin-button secondary admin-full"
          @click="tab = 'templates'"
        >
          <UIcon name="i-lucide-pencil" />
          Sunting Template Pesan
        </button>
        <button class="admin-button primary admin-full" @click="startMessage">
          <UIcon name="i-lucide-send" />
          Buat Pesan Percobaan
        </button>
      </aside>
    </div>
    <section v-else-if="tab === 'templates'" class="admin-card">
      <div class="admin-card-heading">
        <div>
          <h2>Template Pesan Klinik</h2>
          <p>Variabel: {nama_wali}, {kode}, {tanggal}, dan {sesi}.</p>
        </div>
      </div>
      <div class="admin-template-grid">
        <article
          v-for="template in data.templates"
          :key="template.id"
          class="admin-inset"
        >
          <h3>{{ template.name }}</h3>
          <p class="admin-template-content">{{ template.content }}</p>
          <button
            class="admin-button secondary small"
            @click="editTemplate(template.id)"
          >
            <UIcon name="i-lucide-pencil" />
            Edit Template
          </button>
        </article>
      </div>
    </section>
    <section v-else class="admin-card admin-settings-card">
      <div class="admin-card-heading">
        <div>
          <h2>Pengaturan Gateway Simulasi</h2>
          <p>Pengaturan ini hanya memengaruhi antrean data contoh.</p>
        </div>
      </div>
      <form class="admin-form" @submit.prevent="saveSettings">
        <label class="admin-field">
          Nomor klinik contoh
          <input
            v-model.trim="settings.phone"
            type="tel"
            pattern="(?:\+62|62|0)8[0-9]{8,11}"
            required
          />
        </label>
        <label class="admin-field">
          Jeda pengiriman contoh (detik)
          <input
            v-model.number="settings.delay"
            type="number"
            min="1"
            max="60"
            required
          />
        </label>
        <label class="admin-check">
          <input v-model="settings.enabled" type="checkbox" />
          <span>Aktifkan gateway simulasi</span>
        </label>
        <button class="admin-button primary" type="submit">
          Simpan Pengaturan
        </button>
      </form>
    </section>
    <AdminModal
      v-model="manualOpen"
      title="Buat Pesan Manual"
      description="Pesan hanya masuk antrean contoh. Tidak dikirim ke nomor WhatsApp nyata."
    >
      <form class="admin-form" @submit.prevent="send">
        <label class="admin-field">
          Reservasi penerima
          <select v-model="target" required>
            <option
              v-for="booking in data.bookings"
              :key="booking.id"
              :value="booking.id"
            >
              {{ booking.id }} · {{ booking.guardian }}
            </option>
          </select>
        </label>
        <label class="admin-field">
          Template
          <select v-model="templateId">
            <option
              v-for="template in data.templates"
              :key="template.id"
              :value="template.id"
            >
              {{ template.name }}
            </option>
          </select>
        </label>
        <label class="admin-field">
          Isi pesan
          <textarea v-model="text" rows="7" required maxlength="2000" />
        </label>
        <button class="admin-button primary" type="submit">
          Tambahkan ke Antrean Simulasi
        </button>
      </form>
    </AdminModal>
    <AdminModal
      v-model="templateOpen"
      title="Edit Template Pesan"
      description="Hindari data medis sensitif. Gunakan variabel yang didukung."
    >
      <form class="admin-form" @submit.prevent="saveTemplate">
        <label class="admin-field">
          Isi template
          <textarea v-model="templateText" rows="7" required maxlength="2000" />
        </label>
        <p class="admin-hint">
          Variabel yang tersedia: {nama_wali}, {kode}, {tanggal}, {sesi}.
        </p>
        <button class="admin-button primary" type="submit">
          Simpan Template
        </button>
      </form>
    </AdminModal>
  </div>
</template>
