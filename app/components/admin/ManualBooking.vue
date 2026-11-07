<script setup lang="ts">
import { packages as packageCatalog } from '~/data/landing'
const open = defineModel<boolean>({ required: true })
const { data, addBooking, notify } = useAdminData()
const emit = defineEmits<{ created: [id: string] }>()
const input = reactive({
  patient: '',
  guardian: '',
  phone: '',
  address: '',
  age: 7,
  count: 1,
  packageId: 'premium',
  provider: 'Ditentukan Klinik',
  date: '',
  session: 'Pagi',
  method: 'Bius Jarum & Jahitan'
})
const availableMethods = computed(() => {
  const methodId = packageCatalog.find(
    pkg => pkg.id === input.packageId
  )?.methodId
  return data.value.methods.filter(
    method => method.active && (!methodId || method.id === methodId)
  )
})
watch(
  () => input.packageId,
  () => {
    input.method = availableMethods.value[0]?.name ?? ''
  },
  { immediate: true }
)
watch(open, (value) => {
  if (value)
    Object.assign(input, {
      patient: '',
      guardian: '',
      phone: '',
      address: '',
      age: 7,
      count: 1,
      packageId: data.value.packages.find((item) => item.active)?.id ?? '',
      provider: 'Ditentukan Klinik',
      date: data.value.today,
      session: 'Pagi',
      method: data.value.methods.find((item) => item.active)?.name ?? ''
    })
})
function submit() {
  const pkg = data.value.packages.find((item) => item.id === input.packageId)
  if (
    !pkg ||
    input.date < data.value.today ||
    !input.patient.trim() ||
    !input.guardian.trim()
  ) {
    notify('Periksa data pasien, paket, dan tanggal.', 'error')
    return
  }
  const booking = addBooking({
    ...input,
    patient: input.patient.trim(),
    guardian: input.guardian.trim(),
    amount: pkg.price * input.count,
    verified: false,
    notes: 'Pengajuan manual, menunggu verifikasi klinik.'
  })
  open.value = false
  emit('created', booking.id)
}
</script>
<template>
  <AdminModal
    v-model="open"
    title="Tambah Booking Manual"
    description="Catat permintaan keluarga. Status awal menunggu konfirmasi klinik."
  >
    <form class="admin-form" @submit.prevent="submit">
      <div class="admin-form-grid">
        <label class="admin-field">
          Nama pasien / perwakilan anak
          <input v-model.trim="input.patient" required maxlength="100" />
        </label>
        <label class="admin-field">
          Usia (tahun)
          <input
            v-model.number="input.age"
            type="number"
            min="0"
            max="100"
            required
          />
        </label>
        <label class="admin-field">
          Nama wali
          <input v-model.trim="input.guardian" required maxlength="100" />
        </label>
        <label class="admin-field">
          WhatsApp
          <input
            v-model.trim="input.phone"
            type="tel"
            required
            pattern="(?:\+62|62|0)8[0-9]{8,11}"
            placeholder="081200000000"
            title="Nomor Indonesia tanpa spasi"
          />
        </label>
        <label class="admin-field full">
          Alamat
          <textarea
            v-model.trim="input.address"
            required
            rows="2"
            maxlength="500"
          />
        </label>
        <label class="admin-field">
          Jumlah anak
          <input
            v-model.number="input.count"
            type="number"
            min="1"
            max="10"
            required
          />
        </label>
        <label class="admin-field">
          Paket
          <select v-model="input.packageId" required>
            <option
              v-for="pkg in data.packages.filter((item) => item.active)"
              :key="pkg.id"
              :value="pkg.id"
            >
              {{ pkg.name }}
            </option>
          </select>
        </label>
        <label class="admin-field">
          Metode
          <select v-model="input.method">
            <option
              v-for="method in availableMethods"
              :key="method.id"
            >
              {{ method.name }}
            </option>
          </select>
        </label>
        <label class="admin-field">
          Tanggal layanan
          <input v-model="input.date" type="date" :min="data.today" required />
        </label>
        <label class="admin-field">
          Sesi
          <select v-model="input.session">
            <option>Pagi</option>
            <option>Sore</option>
            <option>Fleksibel</option>
          </select>
        </label>
        <label class="admin-field">
          Tenaga medis
          <select v-model="input.provider">
            <option>Ditentukan Klinik</option>
            <option
              v-for="provider in data.providers.filter((item) => item.active)"
              :key="provider.id"
            >
              {{ provider.name }}
            </option>
          </select>
        </label>
      </div>
      <button class="admin-button primary" type="submit">
        <UIcon name="i-lucide-plus" />
        Tambah Pengajuan
      </button>
    </form>
  </AdminModal>
</template>
