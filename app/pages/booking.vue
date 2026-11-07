<script setup lang="ts">
import { bookingStages, localDate, displayDate } from '~/data/booking'
import { formatRupiah } from '~/data/landing'
import '~/assets/css/booking.css'
const catalog = usePublicCatalog()
const {
  packages,
  methods,
  providers,
  sessions,
  error: catalogError,
  status: catalogStatus
} = catalog
await catalog.ready

useSeoMeta({
  title: 'Booking Khitan — MyLaaTachzan',
  description:
    'Formulir booking khitan: data anak dan wali, paket dan metode, tenaga medis, serta preferensi jadwal.'
})

const route = useRoute()
const {
  draft,
  total,
  setQuantity,
  receipt,
  register,
  startNewBooking,
  catalogWarning
} = useBookingForm()
const stage = ref(1)
const today = ref(localDate())
const draftSaved = ref(false)
const statusDialog = ref<'status' | null>(null)
const showSuccess = ref(Boolean(receipt.value))
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
    if (
      typeof value === 'string' &&
      packages.value.some((item) => item.id === value)
    )
      draft.value.children[0]!.packageId = value
    else if (typeof value === 'string' && catalogStatus.value === 'success')
      catalogWarning.value =
        'Paket pada tautan tidak tersedia. Silakan pilih paket yang tersedia.'
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
const submitting = ref(false)
async function submit() {
  if (submitting.value) return
  submitting.value = true
  try {
    const selection = () =>
      JSON.stringify({
        children: draft.value.children.map((child) => [
          child.packageId,
          child.methodId,
          packages.value.find((item) => item.id === child.packageId)?.price
        ]),
        provider: draft.value.provider,
        session: draft.value.session
      })
    const quoted = selection()
    await catalog.refresh()
    await nextTick()
    if (catalogError.value) {
      submissionError.value = 'Katalog belum dapat diperiksa. Coba kembali.'
      return
    }
    if (quoted !== selection()) {
      submissionError.value =
        'Pilihan atau harga layanan berubah. Periksa kembali paket, tenaga medis, jadwal, dan ringkasan biaya sebelum mengajukan.'
      return
    }
    if (
      draft.value.children.some(
        (child) =>
          !packages.value.some((item) => item.id === child.packageId) ||
          !methods.value.some((method) => method.id === child.methodId)
      ) ||
      !sessions.value.some((item) => item.name === draft.value.session) ||
      (draft.value.provider !== 'clinic' &&
        !providers.value.some((item) => item.id === draft.value.provider))
    ) {
      submissionError.value =
        'Pilih paket, metode, tenaga medis, dan sesi yang masih tersedia.'
      return
    }
    submissionError.value = ''
    if (!form.value?.reportValidity()) return
    if (
      draft.value.date < today.value ||
      draft.value.children.some((child) => child.birthDate > today.value)
    ) {
      submissionError.value =
        'Periksa kembali tanggal lahir dan tanggal layanan.'
      return
    }
    try {
      await register()
    } catch (error) {
      submissionError.value =
        (error as { data?: { data?: { message?: string } } }).data?.data
          ?.message ?? 'Pengajuan belum dapat diproses. Silakan coba lagi.'
      return
    }
    showSuccess.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    submitting.value = false
  }
}
function newBooking() {
  startNewBooking()
  showSuccess.value = false
  submissionError.value = ''
  draftSaved.value = false
  nextTick(() => goToStage(1))
}
</script>

<template>
  <div class="booking-page">
    <a class="skip-link" href="#booking-main">Langsung ke formulir</a>
    <LandingHeader
      @book="showSuccess ? newBooking() : goToStage(1)"
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
      </div>

      <div
        v-if="
          catalogError ||
          catalogStatus === 'pending' ||
          !packages.length ||
          !sessions.length
        "
        class="booking-panel"
        role="status"
      >
        <h2>
          {{
            catalogStatus === 'pending'
              ? 'Memuat layanan klinik…'
              : 'Pilihan layanan belum tersedia'
          }}
        </h2>
        <p>
          {{
            catalogError
              ? 'Katalog belum dapat dimuat. Silakan coba kembali.'
              : 'Silakan hubungi klinik untuk informasi layanan.'
          }}
        </p>
        <button
          type="button"
          class="button button-outline"
          @click="catalog.refresh()"
        >
          Coba Lagi
        </button>
      </div>
      <p v-if="catalogWarning" class="booking-error" role="status">
        {{ catalogWarning }}
      </p>
      <template
        v-if="
          !catalogError &&
          catalogStatus === 'success' &&
          packages.length &&
          sessions.length
        "
      >
        <section
          v-if="showSuccess && receipt"
          class="booking-success booking-panel"
          aria-live="polite"
        >
          <span class="booking-success-icon">
            <UIcon name="i-lucide-circle-check" />
          </span>
          <span class="eyebrow">PENGAJUAN DITERIMA</span>
          <h2>Terima kasih, Ayah & Bunda.</h2>
          <p>
            Pengajuan untuk {{ draft.children.length }} anak telah diterima
            klinik.
          </p>
          <div class="booking-success-code">
            <span>Nomor pendaftaran</span>
            <strong>{{ receipt.code }}</strong>
            <small>
              Nomor dibuat dari tanggal reservasi awal
              {{ displayDate(receipt.date) }} dan nomor urut harian.
            </small>
            <span class="booking-waiting">
              <UIcon name="i-lucide-clock-3" />
              Menunggu Konfirmasi Klinik
            </span>
          </div>
          <p class="booking-field-hint">
            Simpan nomor pendaftaran untuk komunikasi dengan petugas.
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
              <dd>{{ formatRupiah(receipt.total) }}</dd>
            </div>
          </dl>
          <div class="booking-inline-note">
            <UIcon name="i-lucide-info" />
            <p>
              Petugas akan memeriksa pengajuan dan menghubungi wali untuk
              menyepakati jadwal.
            </p>
          </div>
          <div class="booking-success-actions">
            <button class="button button-primary" @click="newBooking">
              <UIcon name="i-lucide-plus" />
              Buat Booking Baru
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
                    Satu pengajuan mencakup data terpisah untuk setiap anak.
                    Paket dan metode bisa berbeda; tanggal serta tenaga medis
                    diajukan untuk satu kunjungan.
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
                description="Pilih layanan untuk masing-masing anak. Harga dan benefit mengikuti katalog klinik."
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
                description="Sampaikan preferensi Anda. Pilihan mengikuti tenaga medis aktif di klinik."
              >
                <div class="booking-provider-grid">
                  <label
                    v-for="provider in providers"
                    :key="provider.id"
                    class="booking-provider-option"
                    :class="{ selected: draft.provider === provider.id }"
                  >
                    <input
                      v-model="draft.provider"
                      type="radio"
                      name="provider"
                      :value="provider.id"
                    />
                    <img
                      :src="provider.image"
                      :alt="`Ilustrasi ${provider.role}`"
                      width="58"
                      height="58"
                    />
                    <strong>{{ provider.name }}</strong>
                    <small>{{ provider.role }}</small>
                    <p>Ketersediaan perlu dikonfirmasi</p>
                    <span class="booking-option-button">
                      {{
                        draft.provider === provider.id
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
                    Memilih tenaga medis belum menjamin ketersediaan. Klinik
                    akan memverifikasi preferensi sebelum mengonfirmasi jadwal.
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
                        Tanggal yang dipilih adalah preferensi. Petugas akan
                        memeriksa ketersediaan.
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
                description="Periksa kembali data keluarga sebelum mengirim pengajuan."
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
                    <p>
                      Orang tua / wali: {{ child.guardian || 'Belum diisi' }}
                    </p>
                    <p>
                      {{
                        packages.find((item) => item.id === child.packageId)
                          ?.name
                      }}
                      ·
                      {{
                        methods.find((item) => item.id === child.methodId)?.name
                      }}
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
                            : (providers.find(
                                (item) => item.id === draft.provider
                              )?.name ?? 'Ditentukan Klinik')
                        }}
                      </dd>
                    </div>
                    <div>
                      <dt>Tanggal & sesi</dt>
                      <dd>
                        {{ displayDate(draft.date) }} · {{ draft.session }}
                        <span v-if="draft.session === 'Sesi fleksibel'">
                          ·
                          {{
                            draft.flexibleNotes || 'Catatan waktu belum diisi'
                          }}
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
                    Penggunaan data pengajuan
                    <UIcon name="i-lucide-chevron-down" />
                  </summary>
                  <p>
                    Saat dikirim, data anak dan wali disimpan untuk peninjauan
                    pendaftaran dan komunikasi jadwal oleh klinik. Hindari
                    mencantumkan NIK atau catatan kesehatan dalam kolom catatan.
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
                <button
                  v-else
                  class="button button-primary"
                  type="submit"
                  :disabled="submitting"
                >
                  Kirim Pengajuan
                  <UIcon name="i-lucide-send" />
                </button>
              </div>
              <p v-if="submissionError" class="booking-error" role="alert">
                {{ submissionError }}
              </p>
            </div>
            <BookingSummary
              :submitting="submitting"
              :draft="draft"
              :total="total"
              v-model:consent="draft.consent"
              :draft-saved="draftSaved"
              @save="draftSaved = true"
            />
          </form>
        </template>
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
