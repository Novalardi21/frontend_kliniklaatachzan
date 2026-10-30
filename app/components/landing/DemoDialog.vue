<script setup lang="ts">
import { packages, sessions, formatRupiah } from '~/data/landing'
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
const statusSearched = ref(false)
const minimumDate = ref('')
const currentPackage = computed(
  () => packages.find((item) => item.id === chosenPackage.value) ?? packages[0]!
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
    statusSearched.value = false
    bookingCode.value = ''
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
  document.body.style.overflow = previousOverflow
  emit('close')
  previousFocus?.focus()
}
function submit() {
  if (!date.value || date.value < minimumDate.value) return
  submitted.value = true
}
onBeforeUnmount(() => {
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
      <span class="soft-tag">Simulasi · Data contoh</span>
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
            <strong>{{ formatRupiah(currentPackage.price) }}</strong>
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
          <strong>{{ currentPackage.name }}</strong>
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
          Fitur pencarian berikut merupakan pratinjau tampilan. Belum terhubung
          ke data booking klinik.
        </p>
        <form class="demo-form" @submit.prevent="statusSearched = true">
          <label for="booking-code">
            Kode registrasi
            <input
              id="booking-code"
              v-model="bookingCode"
              placeholder="Contoh: KHT-20261105-001"
              required
              maxlength="32"
            />
          </label>
          <button class="button button-primary" type="submit">
            <UIcon name="i-lucide-search" />
            Cek status
          </button>
        </form>
        <div v-if="statusSearched" class="notice" role="status">
          Pencarian belum tersedia dalam demo. Kode yang dimasukkan belum
          diperiksa ke sistem klinik.
        </div>
      </template>
    </div>
  </dialog>
</template>
