<script setup lang="ts">
import { dateTime, shortDate, maskPhone, type AdminBooking } from '~/data/admin'
const props = defineProps<{ booking?: AdminBooking }>()
const { data, changeStatus, notify, renderMessage } = useAdminData()
const action = ref<'reject' | 'reschedule' | 'confirm' | null>(null)
const open = ref(false)
const reason = ref('')
const date = ref('')
const session = ref('Pagi')
const consent = ref(false)
const error = ref('')
const history = computed(() =>
  data.value.audit.filter((item) => item.bookingId === props.booking?.id)
)
function begin(value: 'reject' | 'reschedule' | 'confirm') {
  action.value = value
  reason.value = ''
  error.value = ''
  consent.value = false
  date.value = props.booking?.date ?? data.value.today
  session.value = props.booking?.session ?? 'Pagi'
  open.value = true
}
function approve() {
  if (!props.booking) return
  if (props.booking.status === 'reschedule') {
    begin('confirm')
    return
  }
  try {
    changeStatus(
      props.booking,
      'confirmed',
      'Identitas dan preferensi jadwal telah diperiksa.'
    )
  } catch (issue) {
    notify((issue as Error).message, 'error')
  }
}
function complete() {
  if (props.booking) {
    try {
      changeStatus(
        props.booking,
        'completed',
        'Layanan selesai pada simulasi operasional.'
      )
    } catch (issue) {
      notify((issue as Error).message, 'error')
    }
  }
}
function submitAction() {
  if (!props.booking) return
  try {
    if (action.value === 'confirm') {
      if (!consent.value)
        throw new Error('Konfirmasi persetujuan wali terlebih dahulu.')
      changeStatus(
        props.booking,
        'confirmed',
        'Jadwal usulan telah disepakati dengan wali pada simulasi.'
      )
    } else if (action.value === 'reject')
      changeStatus(props.booking, 'rejected', reason.value)
    else {
      if (date.value < data.value.today)
        throw new Error('Tanggal usulan tidak boleh di masa lalu.')
      changeStatus(
        props.booking,
        'reschedule',
        reason.value,
        date.value,
        session.value
      )
    }
    open.value = false
  } catch (issue) {
    error.value = (issue as Error).message
  }
}
</script>
<template>
  <aside class="admin-detail-column">
    <section v-if="booking" class="admin-card admin-detail">
      <div class="admin-detail-header">
        <div class="admin-split">
          <span class="admin-pill">VERIFIKASI & TINJAUAN</span>
          <AdminBadge :status="booking.status" />
        </div>
        <h2>{{ booking.patient }}</h2>
        <code>{{ booking.id }}</code>
        <p>{{ booking.age }} tahun · {{ booking.count }} anak</p>
      </div>
      <div class="admin-detail-body">
        <div class="admin-inset">
          <h3>DATA WALI & KONTAK</h3>
          <dl class="admin-detail-list">
            <div>
              <dt>Nama wali</dt>
              <dd>{{ booking.guardian }}</dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>{{ maskPhone(booking.phone) }}</dd>
            </div>
            <div class="full">
              <dt>Alamat</dt>
              <dd>{{ booking.address }}</dd>
            </div>
          </dl>
        </div>
        <div class="admin-detail-section">
          <h3>Verifikasi identitas</h3>
          <label class="admin-check">
            <input
              v-model="booking.verified"
              type="checkbox"
              :disabled="['completed', 'rejected'].includes(booking.status)"
            />
            <span>
              Data anak dan wali sudah ditinjau sesuai dokumen yang disepakati
              klinik.
            </span>
          </label>
          <p class="admin-hint">
            Tidak ada kewajiban unggah KIA atau foto medis pada pratinjau ini.
          </p>
        </div>
        <label class="admin-field">
          Tenaga medis yang diusulkan
          <select
            v-model="booking.provider"
            :disabled="['completed', 'rejected'].includes(booking.status)"
          >
            <option>Ditentukan Klinik</option>
            <option
              v-for="provider in data.providers.filter((item) => item.active)"
              :key="provider.id"
            >
              {{ provider.name }}
            </option>
          </select>
        </label>
        <div class="admin-inset">
          <h3>JADWAL LAYANAN</h3>
          <strong>
            {{ shortDate(booking.date) }} · Sesi {{ booking.session }}
          </strong>
          <p v-if="booking.proposedDate" class="text-warning">
            Usulan: {{ shortDate(booking.proposedDate) }} ·
            {{ booking.proposedSession }}. Menunggu persetujuan wali.
          </p>
          <p>{{ booking.notes }}</p>
        </div>
        <div
          v-if="['pending', 'reschedule'].includes(booking.status)"
          class="admin-detail-actions"
        >
          <button class="admin-button success" @click="approve">
            <UIcon name="i-lucide-circle-check" />
            {{
              booking.status === 'reschedule'
                ? 'Catat Persetujuan Wali'
                : 'Setujui Pengajuan'
            }}
          </button>
          <div>
            <button class="admin-button warm" @click="begin('reschedule')">
              <UIcon name="i-lucide-calendar-clock" />
              Usulkan Jadwal
            </button>
            <button class="admin-button danger" @click="begin('reject')">
              <UIcon name="i-lucide-x" />
              Tolak
            </button>
          </div>
        </div>
        <button
          v-else-if="booking.status === 'confirmed'"
          class="admin-button success admin-full"
          @click="complete"
        >
          <UIcon name="i-lucide-check-check" />
          Tandai Layanan Selesai
        </button>
        <NuxtLink
          v-if="booking.status === 'completed' && !booking.paid"
          to="/admin/payments"
          class="admin-button primary admin-full"
        >
          Lanjut ke Kasir
          <UIcon name="i-lucide-arrow-right" />
        </NuxtLink>
        <p class="admin-hint">
          Perubahan menggunakan data contoh. Notifikasi hanya masuk antrean
          simulasi.
        </p>
      </div>
    </section>
    <section v-else class="admin-card">
      <AdminEmpty
        title="Pilih reservasi"
        description="Klik kode pasien pada tabel untuk meninjau pengajuan."
      />
    </section>
    <section v-if="booking" class="admin-card">
      <h3 class="admin-section-title">
        <UIcon name="i-lucide-message-circle" />
        Pratinjau Pesan
      </h3>
      <p class="admin-message-preview">
        <template v-if="booking.status === 'rejected'">
          Pengajuan ditolak. Hubungi wali untuk menjelaskan alasan yang tercatat
          pada riwayat perubahan.
        </template>
        <template v-else>
          {{
            renderMessage(
              booking,
              booking.paid
                ? 'payment'
                : booking.status === 'reschedule'
                  ? 'reschedule'
                  : ['confirmed', 'completed'].includes(booking.status)
                    ? 'confirmed'
                    : 'received'
            )
          }}
        </template>
      </p>
      <NuxtLink to="/admin/notifications" class="admin-text-link">
        Kelola antrean notifikasi
        <UIcon name="i-lucide-arrow-right" />
      </NuxtLink>
    </section>
    <section v-if="history.length" class="admin-card">
      <h3 class="admin-section-title">Riwayat Perubahan</h3>
      <ol class="admin-timeline">
        <li v-for="item in history.slice(0, 5)" :key="item.id">
          <strong>{{ item.to }}</strong>
          <p>{{ item.reason }}</p>
          <small>{{ item.actor }} · {{ dateTime(item.at) }}</small>
        </li>
      </ol>
    </section>
    <AdminModal
      v-model="open"
      :title="
        action === 'reject'
          ? 'Tolak pengajuan'
          : action === 'confirm'
            ? 'Konfirmasi persetujuan wali'
            : 'Usulkan jadwal baru'
      "
      description="Nomor pendaftaran tetap sama setelah perubahan jadwal."
    >
      <form class="admin-form" @submit.prevent="submitAction">
        <template v-if="action === 'reschedule'">
          <label class="admin-field">
            Tanggal usulan
            <input v-model="date" type="date" :min="data.today" required />
          </label>
          <label class="admin-field">
            Sesi usulan
            <select v-model="session">
              <option>Pagi</option>
              <option>Sore</option>
              <option>Fleksibel</option>
            </select>
          </label>
        </template>
        <label v-if="action !== 'confirm'" class="admin-field">
          Alasan
          <textarea
            v-model.trim="reason"
            rows="3"
            required
            maxlength="500"
            placeholder="Jelaskan alasan untuk keluarga pasien"
          />
        </label>
        <label v-else class="admin-check">
          <input v-model="consent" type="checkbox" required />
          <span>
            Wali sudah menyetujui tanggal
            {{ shortDate(booking?.proposedDate ?? data.today) }} dan sesi
            {{ booking?.proposedSession }} pada simulasi.
          </span>
        </label>
        <p v-if="error" class="admin-alert error" role="alert">{{ error }}</p>
        <button class="admin-button primary" type="submit">
          Simpan Perubahan
        </button>
      </form>
    </AdminModal>
  </aside>
</template>
