<script setup lang="ts">
import { dateTime } from '~/data/admin'
import type {
  MasterRecord as MasterItem,
  MasterSnapshot
} from '../../../shared/types/master'
import { formatRupiah } from '~/data/landing'
import { downloadCsv } from '~/utils/adminExport'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Master Data Layanan — LaaTachzan' })
const { notify } = useAdminData()
const request = useRequestFetch()
const {
  data: snapshot,
  status: loadStatus,
  error: loadError,
  refresh
} = await useAsyncData('postgres-master', () =>
  request<MasterSnapshot>('/api/admin/master')
)
const data = computed(
  () =>
    snapshot.value ?? {
      packages: [],
      methods: [],
      providers: [],
      sessions: [],
      history: []
    }
)
const saving = ref(false)
const capacityOpen = ref(false)
const capacityError = ref('')
const quotas = reactive({ morning: 8, afternoon: 6, flexible: 4 })
function editCapacity() {
  for (const session of data.value.sessions)
    if (session.id in quotas)
      quotas[session.id as keyof typeof quotas] = session.capacity
  capacityError.value = ''
  capacityOpen.value = true
}
function failure(issue: unknown) {
  const value = issue as { data?: { statusMessage?: string } }
  return (
    value.data?.statusMessage
    ?? 'Penyimpanan gagal. Periksa koneksi dan coba kembali.'
  )
}
async function saveQuotas() {
  if (saving.value) return
  saving.value = true
  capacityError.value = ''
  try {
    snapshot.value = await $fetch<MasterSnapshot>(
      '/api/admin/master/capacity',
      { method: 'PUT', body: quotas }
    )
    capacityOpen.value = false
    notify('Kapasitas sesi berhasil disimpan ke PostgreSQL.')
  } catch (issue) {
    capacityError.value = failure(issue)
  } finally {
    saving.value = false
  }
}
type Kind = 'packages' | 'methods' | 'providers'
const kind = ref<Kind>('packages')
const activeTab = ref('packages')
const open = ref(false)
const editing = ref(false)
const error = ref('')
const historyOpen = ref(false)
const history = computed(() => data.value.history)
const model = reactive({
  id: '',
  name: '',
  description: '',
  price: 0,
  duration: '',
  benefits: '',
  active: true,
  role: '',
  capacity: 8,
  image: '',
  methodId: '',
  anesthesia: 'needle',
  usesStitches: false
})
function begin(type: Kind, item?: MasterItem) {
  kind.value = type
  editing.value = Boolean(item)
  error.value = ''
  Object.assign(model, {
    id: item?.id ?? '',
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: item?.price ?? 0,
    duration: item?.duration ?? '',
    benefits: item?.benefits.join('\n') ?? '',
    active: item?.active ?? true,
    role: item?.role ?? '',
    capacity: item?.capacity ?? 8,
    image: item?.image ?? '/images/doctor-ridwan.jpg',
    methodId:
      item?.methodId
      ?? data.value.methods.find(method => method.active)?.id
      ?? '',
    anesthesia: item?.anesthesia ?? 'needle',
    usesStitches: item?.usesStitches ?? false
  })
  open.value = true
}
async function save() {
  if (saving.value) return
  saving.value = true
  error.value = ''
  try {
    snapshot.value = await $fetch<MasterSnapshot>(
      '/api/admin/master/' + kind.value,
      {
        method: 'POST',
        body: {
          ...model,
          benefits: model.benefits
            .split('\n')
            .map(value => value.trim())
            .filter(Boolean)
        }
      }
    )
    open.value = false
    notify('Master data berhasil disimpan ke PostgreSQL.')
  } catch (issue) {
    error.value = failure(issue)
  } finally {
    saving.value = false
  }
}
function focusSection(id: string) {
  activeTab.value = id
  document
    .getElementById(`master-${id}`)
    ?.scrollIntoView({ behavior: 'smooth' })
}
function exportMaster() {
  downloadCsv(
    'master-paket-laatachzan.csv',
    data.value.packages.map(item => ({
      kode: item.id,
      nama: item.name,
      tarif: item.price,
      durasi: item.duration,
      benefit: item.benefits,
      aktif: item.active
    }))
  )
}
</script>

<template>
  <div>
    <AdminPageHeading
      eyebrow="KLINIK LAATACHZAN / PENGATURAN LAYANAN"
      title="Master Data Layanan & Tarif Medis"
      description="Konfigurasi paket, metode, profil tenaga medis, dan kapasitas sesi layanan."
    >
      <button
        class="admin-button secondary"
        @click="historyOpen = true"
      >
        <UIcon name="i-lucide-history" />
        Riwayat Perubahan
      </button>
      <button
        class="admin-button primary"
        :disabled="!snapshot || saving"
        @click="begin('packages')"
      >
        <UIcon name="i-lucide-plus" />
        Tambah Data Baru
      </button>
    </AdminPageHeading>
    <p
      v-if="loadStatus === 'pending'"
      class="admin-alert"
      role="status"
    >
      Memuat master data dari PostgreSQL…
    </p>
    <div
      v-else-if="loadError"
      class="admin-alert error"
      role="alert"
    >
      Master data belum dapat dimuat. Periksa koneksi database dan migrasi 006.
      <button
        class="admin-button secondary small"
        @click="refresh()"
      >
        Coba Lagi
      </button>
    </div>
    <template v-if="snapshot">
      <div class="admin-tabs admin-tabs-card">
        <button
          v-for="tab in [
            {
              id: 'packages',
              label: 'Paket Khitan',
              icon: 'i-lucide-package',
              count: data.packages.length
            },
            {
              id: 'methods',
              label: 'Metode Klinis',
              icon: 'i-lucide-stethoscope',
              count: data.methods.length
            },
            {
              id: 'providers',
              label: 'Tenaga Medis',
              icon: 'i-lucide-contact',
              count: data.providers.length
            },
            {
              id: 'capacity',
              label: 'Kapasitas & Sesi',
              icon: 'i-lucide-clock',
              count: 3
            }
          ]"
          :key="tab.id"
          :class="{ active: activeTab === tab.id }"
          @click="focusSection(tab.id)"
        >
          <UIcon :name="tab.icon" />
          {{ tab.label }}
          <span>{{ tab.count }}</span>
        </button>
      </div>
      <section
        id="master-packages"
        class="admin-master-section"
      >
        <div class="admin-section-heading">
          <h2>Paket Khitan & Benefit Pasien</h2>
          <span class="admin-hint">
            Tarif dan benefit tersimpan di PostgreSQL
          </span>
        </div>
        <div class="admin-master-packages">
          <article
            v-for="(pkg, index) in data.packages"
            :key="pkg.id"
            class="admin-card admin-master-package"
            :class="{ featured: index === 1 }"
          >
            <div class="admin-split">
              <span class="admin-pill">PAKET {{ index + 1 }}</span>
              <AdminBadge :status="pkg.active ? 'active' : 'inactive'" />
            </div>
            <h3>Paket {{ pkg.name }}</h3>
            <p>{{ pkg.description }}</p>
            <div class="admin-master-price">
              <span>TARIF PER ANAK</span>
              <strong>{{ formatRupiah(pkg.price) }}</strong>
              <small>
                <UIcon name="i-lucide-clock" />
                {{ pkg.duration }}
              </small>
            </div>
            <span class="admin-master-label">BENEFIT & FASILITAS</span>
            <ul>
              <li
                v-for="benefit in pkg.benefits"
                :key="benefit"
              >
                <UIcon name="i-lucide-circle-check" />
                {{ benefit }}
              </li>
            </ul>
            <div class="admin-master-card-footer">
              <code>{{ pkg.id }}</code>
              <button
                class="admin-button secondary small"
                @click="begin('packages', pkg)"
              >
                <UIcon name="i-lucide-pencil" />
                Edit Detail
              </button>
            </div>
          </article>
        </div>
      </section>
      <div class="admin-master-middle">
        <section
          id="master-methods"
          class="admin-master-section"
        >
          <div class="admin-section-heading">
            <h2>Katalog Metode Khitan Klinis</h2>
            <button
              class="admin-text-link"
              @click="begin('methods')"
            >
              <UIcon name="i-lucide-plus" />
              Tambah Metode
            </button>
          </div>
          <div class="admin-method-grid">
            <article
              v-for="(method, index) in data.methods"
              :key="method.id"
              class="admin-card"
            >
              <div class="admin-split">
                <span class="admin-warm-icon">
                  <UIcon
                    :name="
                      [
                        'i-lucide-circle-dot',
                        'i-lucide-droplet',
                        'i-lucide-zap',
                        'i-lucide-shield-check'
                      ][index % 4]!
                    "
                  />
                </span>
                <AdminBadge :status="method.active ? 'active' : 'inactive'" />
              </div>
              <h3>{{ method.name }}</h3>
              <p>{{ method.description }}</p>
              <button
                class="admin-button secondary small"
                @click="begin('methods', method)"
              >
                <UIcon name="i-lucide-pencil" />
                Edit Metode
              </button>
            </article>
          </div>
        </section>
        <section
          id="master-capacity"
          class="admin-master-section"
        >
          <div class="admin-section-heading">
            <h2>Kapasitas Sesi Harian</h2>
          </div>
          <div class="admin-card admin-capacity-card">
            <article
              v-for="session in data.sessions"
              :key="session.id"
            >
              <div class="admin-split">
                <div>
                  <strong>Sesi {{ session.name }}</strong>
                  <small>{{ session.time }}</small>
                </div>
                <span>{{ session.capacity }} anak</span>
              </div>
            </article>
            <p class="admin-hint">
              Kapasitas default tersimpan di database. Kuota khusus
              tanggal/praktisi tidak berubah otomatis.
            </p>
            <button
              class="admin-button secondary admin-full"
              @click="editCapacity"
            >
              Atur Kapasitas Sesi
            </button>
          </div>
        </section>
      </div>
      <section
        id="master-providers"
        class="admin-master-section"
      >
        <div class="admin-section-heading">
          <h2>Tenaga Medis & Kuota Praktik</h2>
          <button
            class="admin-button secondary small"
            @click="begin('providers')"
          >
            <UIcon name="i-lucide-user-plus" />
            Tambah Praktisi
          </button>
        </div>
        <div class="admin-provider-cards">
          <article
            v-for="provider in data.providers"
            :key="provider.id"
            class="admin-card"
          >
            <div class="admin-provider-profile">
              <img
                :src="provider.image"
                :alt="`Ilustrasi ${provider.name}`"
                width="64"
                height="64"
              >
              <div>
                <h3>{{ provider.name }}</h3>
                <p>{{ provider.role }}</p>
                <AdminBadge :status="provider.active ? 'active' : 'inactive'" />
              </div>
            </div>
            <div class="admin-provider-quota">
              <div>
                <small>Batas kuota operasional</small>
                <strong>Maks. {{ provider.capacity }} pasien / hari</strong>
              </div>
              <button
                class="admin-button secondary small"
                @click="begin('providers', provider)"
              >
                Atur Profil
              </button>
            </div>
          </article>
        </div>
      </section>
      <section class="admin-card">
        <div class="admin-card-heading">
          <div>
            <h2>Tabel Ringkasan Tarif Layanan</h2>
            <p>
              Perubahan tarif berlaku untuk pilihan pengajuan baru, bukan
              transaksi yang telah dicatat.
            </p>
          </div>
          <button
            class="admin-button secondary small"
            @click="exportMaster"
          >
            <UIcon name="i-lucide-download" />
            Unduh Master CSV
          </button>
        </div>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>KODE PAKET</th>
                <th>NAMA PAKET</th>
                <th>DURASI</th>
                <th>TARIF</th>
                <th>STATUS</th>
                <th>AKSI</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="pkg in data.packages"
                :key="pkg.id"
              >
                <td>
                  <code>{{ pkg.id }}</code>
                </td>
                <td>
                  <strong>{{ pkg.name }}</strong>
                </td>
                <td>{{ pkg.duration }}</td>
                <td>{{ formatRupiah(pkg.price) }}</td>
                <td>
                  <AdminBadge :status="pkg.active ? 'active' : 'inactive'" />
                </td>
                <td>
                  <button
                    class="admin-text-link"
                    @click="begin('packages', pkg)"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
    <AdminModal
      v-model="open"
      :title="editing ? 'Edit Master Data' : 'Tambah Master Data'"
      description="Perubahan disimpan permanen di PostgreSQL."
    >
      <form
        class="admin-form"
        @submit.prevent="save"
      >
        <fieldset
          :disabled="saving"
          style="
            border: 0;
            padding: 0;
            margin: 0;
            min-width: 0;
            display: contents;
          "
        >
          <label
            v-if="!editing"
            class="admin-field"
          >
            Jenis data
            <select v-model="kind">
              <option value="packages">Paket Khitan</option>
              <option value="methods">Metode Klinis</option>
              <option value="providers">Tenaga Medis</option>
            </select>
          </label>
          <label class="admin-field">
            Nama
            <input
              v-model.trim="model.name"
              required
              maxlength="100"
            >
          </label>
          <label class="admin-field">
            Deskripsi
            <textarea
              v-model.trim="model.description"
              rows="2"
              required
              maxlength="500"
            />
          </label>
          <template v-if="kind === 'packages'">
            <label class="admin-field">
              Metode tindakan
              <select
                v-model="model.methodId"
                required
              >
                <option
                  disabled
                  value=""
                >Pilih metode</option>
                <option
                  v-for="method in data.methods"
                  :key="method.id"
                  :value="method.id"
                >
                  {{ method.name }}{{ method.active ? '' : ' (Nonaktif)' }}
                </option>
              </select>
            </label>
            <div class="admin-form-grid">
              <label class="admin-field">
                Tarif per anak (Rp)
                <input
                  v-model.number="model.price"
                  type="number"
                  min="1"
                  step="1"
                  required
                >
              </label>
              <label class="admin-field">
                Estimasi durasi
                <input
                  v-model.trim="model.duration"
                  required
                  placeholder="± 20–30 menit"
                  maxlength="60"
                >
              </label>
            </div>
            <label class="admin-field">
              Benefit (satu per baris)
              <textarea
                v-model="model.benefits"
                rows="4"
                required
                maxlength="1500"
              />
            </label>
          </template>
          <template v-if="kind === 'methods'">
            <label class="admin-field">
              Jenis bius
              <select v-model="model.anesthesia">
                <option value="needle">Jarum</option>
                <option value="spray">Semprot</option>
              </select>
            </label>
            <label class="admin-check">
              <input
                v-model="model.usesStitches"
                type="checkbox"
              >
              Menggunakan jahitan
            </label>
          </template>
          <template v-if="kind === 'providers'">
            <label class="admin-field">
              Foto profil
              <select v-model="model.image">
                <option value="/images/doctor-ridwan.jpg">Foto dokter 1</option>
                <option value="/images/doctor-ratna.jpg">Foto dokter 2</option>
                <option value="/images/nurse-aisyah.jpg">Foto perawat</option>
              </select>
            </label>
            <label class="admin-field">
              Peran / profesi
              <input
                v-model.trim="model.role"
                required
                maxlength="100"
              >
            </label>
            <label class="admin-field">
              Kuota pasien per hari
              <input
                v-model.number="model.capacity"
                type="number"
                min="1"
                max="100"
                required
              >
            </label>
          </template>
          <label class="admin-check">
            <input
              v-model="model.active"
              type="checkbox"
            >
            <span>Aktif dan tersedia untuk dipilih</span>
          </label>
          <p
            v-if="error"
            class="admin-alert error"
            role="alert"
          >
            {{ error }}
          </p>
          <button
            class="admin-button primary"
            type="submit"
            :disabled="saving"
          >
            {{ saving ? 'Menyimpan…' : 'Simpan Master Data' }}
          </button>
        </fieldset>
      </form>
    </AdminModal>
    <AdminModal
      v-model="capacityOpen"
      title="Kapasitas Default Sesi"
      description="Berlaku sebagai kapasitas default; jadwal khusus tanggal/praktisi tetap dikelola terpisah."
    >
      <form
        class="admin-form"
        @submit.prevent="saveQuotas"
      >
        <label
          v-for="session in data.sessions"
          :key="session.id"
          class="admin-field"
        >
          Sesi {{ session.name }}
          <input
            v-model.number="quotas[session.id as keyof typeof quotas]"
            type="number"
            min="1"
            max="100"
            step="1"
            required
            :disabled="saving"
          >
        </label>
        <p
          v-if="capacityError"
          class="admin-alert error"
          role="alert"
        >
          {{ capacityError }}
        </p>
        <button
          class="admin-button primary"
          :disabled="saving"
          type="submit"
        >
          {{ saving ? 'Menyimpan…' : 'Simpan Kapasitas' }}
        </button>
      </form>
    </AdminModal>
    <AdminModal
      v-model="historyOpen"
      title="Riwayat Perubahan Master Data"
    >
      <ol
        v-if="history.length"
        class="admin-timeline"
      >
        <li
          v-for="(item, index) in history"
          :key="index"
        >
          <strong>{{ item.name }}</strong>
          <p>{{ item.detail }}</p>
          <small>{{ item.actor }} · {{ dateTime(item.at) }}</small>
        </li>
      </ol>
      <AdminEmpty
        v-else
        title="Belum ada perubahan"
        description="Aktivitas pengaturan master akan tercatat setelah data disimpan."
      />
    </AdminModal>
  </div>
</template>
