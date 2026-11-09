<script setup lang="ts">
import { formatRupiah } from '~/data/landing'
const { packages, sessions } = usePublicCatalog()
const props = defineProps<{
  mode: 'booking' | 'status' | null
  packageId: string
}>()
const emit = defineEmits<{ close: [] }>()
const modal = ref<HTMLDialogElement>()
const chosenPackage = ref(props.packageId)
const date = ref('')
const session = ref('Sesi pagi')
const submitted = ref(false)
const bookingCode = ref('')
const bookingPhone = ref('')
const statusResult = ref<{ status: keyof typeof statusMessages; date: string | null; session: string | null } | null>(null)
const statusLoading = ref(false)
const statusError = ref('')
const statusMessages = {
  pending: ['Menunggu Konfirmasi Klinik', 'Tanggal dan sesi masih berupa preferensi. Klinik akan menghubungi wali.'],
  confirmed: ['Terkonfirmasi', 'Klinik sudah mengonfirmasi jadwal kunjungan.'],
  reschedule: ['Usulan Jadwal Baru', 'Hubungi klinik untuk menyetujui atau membahas jadwal usulan.'],
  completed: ['Layanan Selesai', 'Klinik sudah menandai layanan ini selesai.'],
  rejected: ['Pengajuan Tidak Disetujui', 'Hubungi klinik jika memerlukan informasi lebih lanjut.']
}
let statusRequest: AbortController | undefined

function resetStatus() {
  statusRequest?.abort()
  statusRequest = undefined
  statusLoading.value = false
  statusResult.value = null
  statusError.value = ''
}

async function checkStatus() {
  resetStatus()
  const request = new AbortController()
  statusRequest = request
  statusLoading.value = true
  try {
    const result = await $fetch('/api/booking-status', {
      method: 'POST',
      body: { code: bookingCode.value, phone: bookingPhone.value },
      signal: request.signal
    })
    if (!request.signal.aborted) statusResult.value = result
  } catch (error) {
    if (!request.signal.aborted)
      statusError.value = (error as { data?: { data?: { message?: string } } }).data?.data
        ?.message ?? 'Status booking belum bisa diperiksa. Silakan coba lagi.'
  } finally {
    if (statusRequest === request) {
      statusRequest = undefined
      statusLoading.value = false
    }
  }
}
watch([bookingCode, bookingPhone], resetStatus)
const minimumDate = ref('')
const currentPackage = computed(
  () =>
    packages.value.find((item) => item.id === chosenPackage.value) ??
    packages.value[0]
)
let previousFocus: HTMLElement | null = null
let previousOverflow = ''

watch(
  () => props.mode,
  async (mode) => {
    if (!mode) {
      modal.value?.close()
      return
    }
    chosenPackage.value = props.packageId
    submitted.value = false
    bookingCode.value = ''
    bookingPhone.value = ''
    const today = new Date()
    minimumDate.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    date.value = ''
    await nextTick()
    previousFocus = document.activeElement as HTMLElement
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    modal.value?.showModal()
  }
)
function close() {
  resetStatus()
  document.body.style.overflow = previousOverflow
  emit('close')
  previousFocus?.focus()
}
function submit() {
  if (!date.value || date.value < minimumDate.value) return
  submitted.value = true
}
onBeforeUnmount(() => {
  statusRequest?.abort()
  if (props.mode) document.body.style.overflow = previousOverflow
})
</script>
<template>
  <dialog
    ref="modal"
    class="demo-dialog"
    aria-labelledby="dialog-title"
    @cancel.prevent="modal?.close()"
    @close="close"
    @click="$event.target === modal && modal?.close()"
  >
    <div class="dialog-content">
      <button
        class="dialog-close"
        aria-label="Tutup dialog"
        @click="modal?.close()"
      >
        <UIcon name="i-lucide-x" />
      </button>
      <span v-if="mode === 'booking'" class="soft-tag">Simulasi · Data contoh</span>
      <h2 id="dialog-title">
        {{
          mode === 'status'
            ? 'Cek status booking'
            : submitted
              ? 'Simulasi selesai!'
              : 'Rencanakan momen berani.'
        }}
      </h2>
      <template v-if="mode === 'booking' && !submitted">
        <p>
          Coba pilih paket dan preferensi waktu. Demo ini tidak mengirim
          pengajuan ke klinik.
        </p>
        <form class="demo-form" @submit.prevent="submit">
          <label for="demo-package">
            Pilihan paket
            <select id="demo-package" v-model="chosenPackage">
              <option v-for="item in packages" :key="item.id" :value="item.id">
                {{ item.name }} — {{ formatRupiah(item.price) }}
              </option>
            </select>
          </label>
          <label for="demo-date">
            Tanggal yang diinginkan
            <input
              id="demo-date"
              v-model="date"
              type="date"
              :min="minimumDate"
              required
            />
          </label>
          <label for="demo-session">
            Preferensi waktu
            <select id="demo-session" v-model="session">
              <option
                v-for="item in sessions"
                :key="item.name"
                :value="item.name"
              >
                {{ item.name }} · {{ item.time }}
              </option>
            </select>
          </label>
          <div class="demo-summary">
            <span>Contoh biaya per anak</span>
            <strong>{{ formatRupiah(currentPackage?.price ?? 0) }}</strong>
            <small>
              Metode dipilih terpisah. Jadwal perlu konfirmasi klinik.
            </small>
          </div>
          <button class="button button-primary" type="submit">
            Lihat ringkasan simulasi
            <UIcon name="i-lucide-arrow-right" />
          </button>
        </form>
      </template>
      <div v-else-if="mode === 'booking'" class="demo-result" role="status">
        <span class="result-icon"><UIcon name="i-lucide-circle-check" /></span>
        <p>
          Paket
          <strong>{{ currentPackage?.name ?? 'Paket belum dipilih' }}</strong>
          , tanggal
          <strong>
            {{
              new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(
                new Date(`${date}T12:00:00`)
              )
            }}
          </strong>
          , {{ session.toLowerCase() }}.
        </p>
        <div class="notice">
          Ini hanya simulasi. Belum ada booking atau pembayaran yang dibuat.
          Pada layanan aktif, pengajuan berstatus
          <strong>Menunggu Konfirmasi Klinik</strong>
          .
        </div>
        <button class="button button-primary" @click="modal?.close()">
          Selesai
        </button>
      </div>
      <template v-else>
        <p>
          Masukkan kode registrasi dan nomor WhatsApp wali yang digunakan saat mendaftar.
        </p>
        <form class="demo-form" @submit.prevent="checkStatus">
          <label for="booking-code">
            Kode registrasi
            <input
              id="booking-code"
              v-model="bookingCode"
              placeholder="Contoh: KHT-20261105-0001"
              autocapitalize="characters"
              spellcheck="false"
              required
              maxlength="32"
            />
          </label>
          <label for="booking-status-phone">
            Nomor WhatsApp wali
            <input
              id="booking-status-phone"
              v-model="bookingPhone"
              type="tel"
              autocomplete="tel"
              placeholder="Contoh: 081234567890"
              maxlength="24"
              required
            />
          </label>
          <button class="button button-primary" type="submit" :disabled="statusLoading">
            <UIcon name="i-lucide-search" />
            {{ statusLoading ? 'Memeriksa…' : 'Cek status' }}
          </button>
        </form>
        <div v-if="statusError" class="notice" role="alert">{{ statusError }}</div>
        <div v-if="statusResult" class="notice" role="status">
          <strong>{{ statusMessages[statusResult.status][0] }}</strong>
          <div v-if="statusResult.date">
            {{
              new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(
                new Date(`${statusResult.date}T12:00:00`)
              )
            }}
            <span v-if="statusResult.session"> · {{ statusResult.session }}</span>
          </div>
          <div>{{ statusMessages[statusResult.status][1] }}</div>
        </div>
      </template>
    </div>
  </dialog>
</template>
