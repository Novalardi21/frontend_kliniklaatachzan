<script setup lang="ts">
import { bookingStages, methods, localDate, displayDate } from '~/data/booking'
import { packages, providers, sessions, formatRupiah } from '~/data/landing'
import '~/assets/css/booking.css'

useSeoMeta({
  title: 'Booking Khitan — MyLaaTachzan',
  description:
    'Formulir booking khitan: data anak dan wali, paket dan metode, tenaga medis, serta preferensi jadwal. Versi demo.'
})

const route = useRoute()
const {
  draft,
  total,
  setQuantity,
  fillSampleData,
  registration,
  originalDate,
  register,
  startNewBooking
} = useBookingForm()
const stage = ref(1)
const today = ref(localDate())
const draftSaved = ref(false)
const statusDialog = ref<'status' | null>(null)
const showSuccess = ref(Boolean(registration.value))
const form = ref<HTMLFormElement>()
const submissionError = ref('')
const completed = computed(() => [
  draft.value.children.length > 0,
  draft.value.children.every(
    (child) =>
      child.name &&
      child.birthPlace &&
      child.birthDate &&
      child.birthDate <= today.value &&
      child.guardian
  ) &&
    Boolean(
      draft.value.customer.name &&
      /^(?:\+62|62|0)8[0-9]{8,11}$/.test(draft.value.customer.whatsapp) &&
      draft.value.customer.address
    ),
  draft.value.children.every((child) => child.packageId && child.methodId),
  Boolean(draft.value.provider),
  Boolean(
    draft.value.date &&
    draft.value.date >= today.value &&
    (draft.value.session !== 'Sesi fleksibel' ||
      draft.value.flexibleNotes.trim())
  ),
  draft.value.consent
])

watch(
  () => route.query.paket,
  (value) => {
    if (typeof value === 'string' && packages.some((item) => item.id === value))
      draft.value.children[0]!.packageId = value
  },
  { immediate: true }
)
watch(
  draft,
  () => {
    draftSaved.value = false
  },
  { deep: true }
)
onMounted(() => {
  today.value = localDate()
})

function goToStage(value: number) {
  stage.value = value
  document
    .getElementById(`booking-step-${value}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function updateStage(event: FocusEvent) {
  const section = (event.target as HTMLElement).closest(
    'section[id^="booking-step-"]'
  )
  if (section) stage.value = Number(section.id.split('-').at(-1))
}
function nextStage() {
  const section = document.getElementById(`booking-step-${stage.value}`)
  const fields = section?.querySelectorAll<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >('input, select, textarea')
  for (const field of fields ?? []) {
    if (!field.reportValidity()) return
  }
  goToStage(Math.min(6, stage.value + 1))
}
function submit() {
  submissionError.value = ''
  if (!form.value?.reportValidity()) return
  if (
    draft.value.date < today.value ||
    draft.value.children.some((child) => child.birthDate > today.value)
  ) {
    submissionError.value = 'Periksa kembali tanggal lahir dan tanggal layanan.'
    return
  }
  try {
    register()
  } catch (error) {
    submissionError.value =
      error instanceof Error
        ? error.message
        : 'Nomor pendaftaran belum berhasil dibuat. Silakan coba lagi.'
    return
  }
  showSuccess.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function editDraft() {
  showSuccess.value = false
  nextTick(() => goToStage(1))
}
function newBooking() {
  startNewBooking()
  showSuccess.value = false
  submissionError.value = ''
  draftSaved.value = false
  nextTick(() => goToStage(1))
}
function fillExample() {
  fillSampleData()
  submissionError.value = ''
}
</script>

<template>
  <div class="booking-page">
    <a class="skip-link" href="#booking-main">Langsung ke formulir</a>
    <LandingHeader
      @book="showSuccess ? editDraft() : goToStage(1)"
      @check="statusDialog = 'status'"
    />
    <main id="booking-main" class="booking-main container">
      <div class="booking-page-intro">
        <div>
          <NuxtLink to="/" class="booking-back">
            <UIcon name="i-lucide-arrow-left" />
            Kembali ke beranda
          </NuxtLink>
          <h1>Booking Khitan</h1>
          <p>
            Lengkapi data, pilih layanan, dan rencanakan momen berani si kecil.
          </p>
        </div>
        <button
          v-if="!showSuccess"
          type="button"
          class="button button-outline"
          @click="fillExample"
        >
          <UIcon name="i-lucide-sparkles" />
          Isi Data Contoh
        </button>
      </div>

      <section
        v-if="showSuccess"
        class="booking-success booking-panel"
        aria-live="polite"
      >
        <span class="booking-success-icon">
          <UIcon name="i-lucide-circle-check" />
        </span>
        <span class="eyebrow">SIMULASI PENGAJUAN SELESAI</span>
        <h2>Terima kasih, Ayah & Bunda.</h2>
        <p>
          Berikut contoh pengajuan untuk {{ draft.children.length }} anak. Data
          ini belum dikirim ke klinik dan tidak disimpan ke server.
        </p>
        <div class="booking-success-code">
          <span>Nomor pendaftaran · Demo</span>
          <strong>{{ registration }}</strong>
          <small>
            Nomor dibuat dari tanggal reservasi awal
            {{ displayDate(originalDate) }} dan nomor urut harian.
          </small>
          <span class="booking-waiting">
            <UIcon name="i-lucide-clock-3" />
            Menunggu Konfirmasi Klinik · Demo
          </span>
        </div>
        <p class="booking-field-hint">
          Nomor pendaftaran tetap sama jika jadwal diubah. Penghitung contoh
          berlaku selama sesi aplikasi ini dan direset saat halaman dimuat
          ulang.
        </p>
        <dl>
          <div>
            <dt>Nama penanggung jawab</dt>
            <dd>{{ draft.customer.name }}</dd>
          </div>
          <div>
            <dt>Preferensi kunjungan</dt>
            <dd>{{ displayDate(draft.date) }} · {{ draft.session }}</dd>
          </div>
          <div>
            <dt>Estimasi biaya</dt>
            <dd>{{ formatRupiah(total) }}</dd>
          </div>
        </dl>
        <div class="booking-inline-note">
          <UIcon name="i-lucide-info" />
          <p>
            Pada layanan aktif, klinik memeriksa data dan mengonfirmasi jadwal.
            Belum ada jadwal final atau pesan WhatsApp yang terkirim dari demo
            ini.
          </p>
        </div>
        <div class="booking-success-actions">
          <button class="button button-primary" @click="newBooking">
            <UIcon name="i-lucide-plus" />
            Buat Booking Baru
          </button>
          <button class="button button-outline" @click="editDraft">
            Kembali ke formulir
            <UIcon name="i-lucide-arrow-right" />
          </button>
          <NuxtLink to="/" class="button button-outline">
            Kembali ke beranda
          </NuxtLink>
        </div>
      </section>

      <template v-else>
        <nav class="booking-stepper" aria-label="Tahapan booking">
          <button
            v-for="(label, index) in bookingStages"
            :key="label"
            type="button"
            :class="{
              active: stage === index + 1,
              complete: completed[index] && stage !== index + 1
            }"
            :aria-current="stage === index + 1 ? 'step' : undefined"
            @click="goToStage(index + 1)"
          >
            <span class="booking-step-circle">
              <UIcon
                v-if="completed[index] && stage !== index + 1"
                name="i-lucide-check"
              />
              <template v-else>
                {{ String(index + 1).padStart(2, '0') }}
              </template>
            </span>
            <span>
              <small>
                {{
                  stage === index + 1
                    ? 'TAHAP AKTIF'
                    : `TAHAP ${String(index + 1).padStart(2, '0')}`
                }}
              </small>
              <strong>{{ label }}</strong>
            </span>
          </button>
        </nav>
        <form
          ref="form"
          class="booking-layout"
          @submit.prevent="submit"
          @invalid.capture="
            submissionError =
              'Masih ada isian wajib yang belum lengkap atau belum sesuai.'
          "
        >
          <div class="booking-sections" @focusin="updateStage">
            <BookingSection
              :number="1"
              title="Jumlah Anak yang Didaftarkan"
              description="Daftarkan satu atau beberapa anak dalam satu rencana kunjungan."
            >
              <div class="booking-quantity">
                <button
                  v-for="option in [
                    {
                      count: 1,
                      label: '1 Anak',
                      text: 'Khitan tunggal',
                      icon: 'i-lucide-baby'
                    },
                    {
                      count: 2,
                      label: '2 Anak',
                      text: 'Kakak & adik',
                      icon: 'i-lucide-users-round'
                    },
                    {
                      count: 3,
                      label: '3+ Anak',
                      text: 'Grup / kerabat',
                      icon: 'i-lucide-users'
                    }
                  ]"
                  :key="option.count"
                  type="button"
                  :class="{
                    selected:
                      option.count === 3
                        ? draft.children.length >= 3
                        : draft.children.length === option.count
                  }"
                  :aria-pressed="
                    option.count === 3
                      ? draft.children.length >= 3
                      : draft.children.length === option.count
                  "
                  @click="
                    setQuantity(
                      option.count === 3
                        ? Math.max(3, draft.children.length)
                        : option.count
                    )
                  "
                >
                  <UIcon :name="option.icon" />
                  <span>
                    <strong>{{ option.label }}</strong>
                    <small>{{ option.text }}</small>
                  </span>
                  <UIcon
                    :name="
                      (
                        option.count === 3
                          ? draft.children.length >= 3
                          : draft.children.length === option.count
                      )
                        ? 'i-lucide-circle-check'
                        : 'i-lucide-circle'
                    "
                  />
                </button>
              </div>
              <label
                v-if="draft.children.length >= 3"
                class="booking-group-quantity"
                for="group-quantity"
              >
                Jumlah anak (3–10)
                <input
                  id="group-quantity"
                  type="number"
                  min="3"
                  max="10"
                  :value="draft.children.length"
                  @change="
                    setQuantity(
                      Number(($event.target as HTMLInputElement).value)
                    )
                  "
                  required
                />
              </label>
              <div class="booking-inline-note">
                <UIcon name="i-lucide-info" />
                <p>
                  Satu pengajuan mencakup data terpisah untuk setiap anak. Paket
                  dan metode bisa berbeda; tanggal serta tenaga medis diajukan
                  untuk satu kunjungan.
                </p>
              </div>
            </BookingSection>

            <BookingSection
              :number="2"
              title="Data Pasien & Penanggung Jawab"
              description="Isi identitas anak sesuai KIA atau Akta Kelahiran. Tanda * wajib diisi."
            >
              <BookingChildFields
                v-for="(child, index) in draft.children"
                :key="child.id"
                v-model="draft.children[index]!"
                :index="index"
                :today="today"
              />
              <fieldset class="booking-fieldset">
                <legend>
                  <UIcon name="i-lucide-contact" />
                  PENANGGUNG JAWAB (ORANG TUA / WALI)
                </legend>
                <div class="booking-fields-grid">
                  <label for="customer-name">
                    Nama lengkap orang tua / wali
                    <span>*</span>
                    <input
                      id="customer-name"
                      v-model.trim="draft.customer.name"
                      autocomplete="name"
                      placeholder="Nama penanggung jawab"
                      maxlength="100"
                      pattern=".*\S.*"
                      required
                    />
                  </label>
                  <label for="customer-whatsapp">
                    Nomor WhatsApp aktif
                    <span>*</span>
                    <input
                      id="customer-whatsapp"
                      v-model.trim="draft.customer.whatsapp"
                      type="tel"
                      autocomplete="tel"
                      inputmode="tel"
                      placeholder="Contoh: 081200000000"
                      pattern="(?:\+62|62|0)8[0-9]{8,11}"
                      title="Gunakan nomor Indonesia: 08…, 628…, atau +628… tanpa spasi"
                      maxlength="16"
                      required
                    />
                  </label>
                  <label for="customer-address" class="field-full">
                    Alamat domisili lengkap
                    <span>*</span>
                    <textarea
                      id="customer-address"
                      v-model.trim="draft.customer.address"
                      autocomplete="street-address"
                      placeholder="Jalan, nomor rumah, RT/RW, desa/kelurahan, kecamatan, kabupaten/kota, kode pos"
                      rows="3"
                      maxlength="1000"
                      pattern=".*\S.*"
                      required
                    />
                  </label>
                  <label for="customer-location" class="field-full">
                    Catatan lokasi
                    <small>(opsional)</small>
                    <input
                      id="customer-location"
                      v-model.trim="draft.customer.locationNotes"
                      placeholder="Patokan lokasi bila diperlukan"
                      maxlength="300"
                    />
                  </label>
                </div>
              </fieldset>
            </BookingSection>

            <BookingSection
              :number="3"
              title="Pilihan Paket Khitan & Metode Klinis"
              description="Pilih layanan untuk masing-masing anak. Seluruh harga dan benefit masih data contoh."
            >
              <BookingPackageChoice
                v-for="(child, index) in draft.children"
                :key="child.id"
                v-model="draft.children[index]!"
                :index="index"
                :multiple="draft.children.length > 1"
              />
            </BookingSection>

            <BookingSection
              :number="4"
              title="Pilihan Tenaga Medis Pelaksana"
              description="Sampaikan preferensi Anda. Profil berikut adalah contoh untuk demonstrasi."
            >
              <div class="booking-provider-grid">
                <label
                  v-for="provider in providers.slice(0, 2)"
                  :key="provider.name"
                  class="booking-provider-option"
                  :class="{ selected: draft.provider === provider.name }"
                >
                  <input
                    v-model="draft.provider"
                    type="radio"
                    name="provider"
                    :value="provider.name"
                  />
                  <img
                    :src="provider.image"
                    :alt="`Ilustrasi ${provider.role}`"
                    width="58"
                    height="58"
                  />
                  <strong>{{ provider.name }}</strong>
                  <small>{{ provider.role }}</small>
                  <p>Profil contoh · ketersediaan perlu dikonfirmasi</p>
                  <span class="booking-option-button">
                    {{
                      draft.provider === provider.name
                        ? 'Terpilih'
                        : 'Pilih Dokter'
                    }}
                  </span>
                </label>
                <label
                  class="booking-provider-option"
                  :class="{ selected: draft.provider === 'clinic' }"
                >
                  <input
                    v-model="draft.provider"
                    type="radio"
                    name="provider"
                    value="clinic"
                  />
                  <span class="booking-clinic-icon">
                    <UIcon name="i-lucide-shield-check" />
                  </span>
                  <strong>Rekomendasi Klinik</strong>
                  <small>Ditentukan tim medis</small>
                  <p>
                    Menyesuaikan kebutuhan anak dan ketersediaan tim klinik.
                  </p>
                  <span class="booking-option-button">
                    {{
                      draft.provider === 'clinic'
                        ? 'Terpilih'
                        : 'Pilih Opsi Ini'
                    }}
                  </span>
                </label>
              </div>
              <div class="booking-inline-note">
                <UIcon name="i-lucide-info" />
                <p>
                  Memilih tenaga medis belum menjamin ketersediaan. Klinik akan
                  memverifikasi preferensi sebelum mengonfirmasi jadwal.
                </p>
              </div>
            </BookingSection>

            <BookingSection
              :number="5"
              title="Jadwal Tanggal & Sesi Operasional"
              description="Pilih tanggal dan preferensi waktu yang sesuai dengan kebutuhan keluarga."
            >
              <div class="booking-fields-grid booking-schedule-fields">
                <div>
                  <label for="service-date">
                    Pilih tanggal kedatangan
                    <span>*</span>
                    <input
                      id="service-date"
                      v-model="draft.date"
                      type="date"
                      :min="today"
                      required
                    />
                  </label>
                  <p class="booking-field-hint">
                    Semua anak diajukan dalam satu kunjungan. Jadwal final
                    disepakati bersama klinik.
                  </p>
                  <div class="booking-inline-note">
                    <UIcon name="i-lucide-calendar-clock" />
                    <p>
                      Data ketersediaan belum tersambung dalam demo. Tanggal
                      yang bisa dipilih bukan jaminan slot tersedia.
                    </p>
                  </div>
                </div>
                <fieldset class="booking-session-options">
                  <legend>
                    Pilihan rentang sesi operasional
                    <span>*</span>
                  </legend>
                  <label
                    v-for="item in sessions"
                    :key="item.name"
                    :class="{ selected: draft.session === item.name }"
                  >
                    <input
                      v-model="draft.session"
                      type="radio"
                      name="session"
                      :value="item.name"
                    />
                    <UIcon :name="item.icon" />
                    <span>
                      <strong>{{ item.name }}</strong>
                      <small>{{ item.time }}</small>
                    </span>
                  </label>
                </fieldset>
                <label
                  v-if="draft.session === 'Sesi fleksibel'"
                  for="flexible-notes"
                  class="field-full"
                >
                  Preferensi waktu fleksibel
                  <span>*</span>
                  <input
                    id="flexible-notes"
                    v-model.trim="draft.flexibleNotes"
                    placeholder="Contoh: setelah pukul 10.00 WIB"
                    maxlength="300"
                    pattern=".*\S.*"
                    required
                  />
                </label>
                <label for="booking-notes" class="field-full">
                  Catatan khusus untuk tim medis
                  <small>(opsional)</small>
                  <textarea
                    id="booking-notes"
                    v-model.trim="draft.notes"
                    placeholder="Contoh: ananda pemalu dan ingin didampingi orang tua"
                    rows="2"
                    maxlength="1000"
                  />
                </label>
              </div>
            </BookingSection>

            <BookingSection
              :number="6"
              title="Review & Kirim Pengajuan"
              description="Periksa kembali data keluarga sebelum membuat simulasi pengajuan."
            >
              <div class="booking-review">
                <article
                  v-for="(child, index) in draft.children"
                  :key="child.id"
                >
                  <h3>
                    Anak {{ index + 1 }} ·
                    {{ child.name || 'Nama belum diisi' }}
                  </h3>
                  <p>
                    {{ child.birthPlace || 'Tempat lahir belum diisi' }},
                    {{ displayDate(child.birthDate) }} · {{ child.gender }}
                  </p>
                  <p>Orang tua / wali: {{ child.guardian || 'Belum diisi' }}</p>
                  <p v-if="child.nik">NIK: {{ child.nik }}</p>
                  <p>
                    {{
                      packages.find((item) => item.id === child.packageId)?.name
                    }}
                    ·
                    {{
                      methods.find((item) => item.id === child.methodId)?.name
                    }}
                  </p>
                  <p v-if="child.healthNotes">
                    Catatan kesehatan: {{ child.healthNotes }}
                  </p>
                </article>
                <dl>
                  <div>
                    <dt>Penanggung jawab</dt>
                    <dd>{{ draft.customer.name || 'Belum diisi' }}</dd>
                  </div>
                  <div>
                    <dt>WhatsApp</dt>
                    <dd>{{ draft.customer.whatsapp || 'Belum diisi' }}</dd>
                  </div>
                  <div>
                    <dt>Alamat</dt>
                    <dd>
                      {{ draft.customer.address || 'Belum diisi' }}
                      <span v-if="draft.customer.locationNotes">
                        · {{ draft.customer.locationNotes }}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>Tenaga medis</dt>
                    <dd>
                      {{
                        draft.provider === 'clinic'
                          ? 'Ditentukan Klinik'
                          : draft.provider
                      }}
                    </dd>
                  </div>
                  <div>
                    <dt>Tanggal & sesi</dt>
                    <dd>
                      {{ displayDate(draft.date) }} · {{ draft.session }}
                      <span v-if="draft.session === 'Sesi fleksibel'">
                        ·
                        {{ draft.flexibleNotes || 'Catatan waktu belum diisi' }}
                      </span>
                    </dd>
                  </div>
                  <div v-if="draft.notes">
                    <dt>Catatan khusus</dt>
                    <dd>{{ draft.notes }}</dd>
                  </div>
                </dl>
              </div>
              <details id="booking-privacy" class="booking-privacy">
                <summary>
                  <UIcon name="i-lucide-lock-keyhole" />
                  Keterangan privasi demo
                  <UIcon name="i-lucide-chevron-down" />
                </summary>
                <p>
                  Gunakan data contoh saat mencoba formulir ini. Isian berada di
                  memori tab, tidak dikirim ke server, dan tidak ditulis ke
                  penyimpanan browser. Draft akan hilang saat halaman dimuat
                  ulang atau tab ditutup. Pada layanan aktif, kebijakan privasi
                  resmi klinik harus tersedia sebelum data pasien dikirim.
                </p>
              </details>
            </BookingSection>

            <div class="booking-navigation">
              <button
                class="button button-outline"
                type="button"
                :disabled="stage === 1"
                @click="goToStage(stage - 1)"
              >
                <UIcon name="i-lucide-arrow-left" />
                Kembali
              </button>
              <span>Tahap {{ stage }} dari 6</span>
              <button
                v-if="stage < 6"
                class="button button-primary"
                type="button"
                @click="nextStage"
              >
                Lanjutkan
                <UIcon name="i-lucide-arrow-right" />
              </button>
              <button v-else class="button button-primary" type="submit">
                Ajukan Booking Demo
                <UIcon name="i-lucide-send" />
              </button>
            </div>
            <p v-if="submissionError" class="booking-error" role="alert">
              {{ submissionError }}
            </p>
          </div>
          <BookingSummary
            :draft="draft"
            :total="total"
            v-model:consent="draft.consent"
            :draft-saved="draftSaved"
            @save="draftSaved = true"
          />
        </form>
      </template>
    </main>
    <LandingFooter />
    <LandingDemoDialog
      :mode="statusDialog"
      package-id="premium"
      @close="statusDialog = null"
    />
  </div>
</template>
