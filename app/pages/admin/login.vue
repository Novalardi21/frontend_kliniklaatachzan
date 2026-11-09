<script setup lang="ts">
import '~/assets/css/admin.css'
definePageMeta({ layout: false })
useSeoMeta({ title: 'Login Admin — Klinik LaaTachzan' })
const { login: signIn, refresh, validRole } = useAdminSession()
const email = ref('')
const password = ref('')
const visible = ref(false)
const error = ref('')
const help = ref(false)
const submitting = ref(false)
onMounted(() => {
  refresh().catch(() => {})
})
async function login() {
  if (submitting.value) return
  error.value = ''
  submitting.value = true
  try {
    await signIn(email.value.trim(), password.value)
    password.value = ''
    await navigateTo('/admin')
  } catch (issue) {
    const failure = issue as { data?: { statusMessage?: string } }
    error.value =
      failure.data?.statusMessage ?? 'Tidak dapat masuk. Coba kembali.'
  } finally {
    submitting.value = false
  }
}
</script>
<template>
  <div class="admin-login">
    <div class="admin-login-card">
      <aside class="admin-login-intro">
        <NuxtLink to="/" class="admin-login-back">
          <UIcon name="i-lucide-arrow-left" />
          Kembali ke website klinik
        </NuxtLink>
        <LandingBrand />
        <span class="admin-eyebrow">PORTAL OPERASIONAL KLINIK</span>
        <h1>
          Perawatan yang tenang.
          <br />
          Pengelolaan yang tertata.
        </h1>
        <p>
          Ruang kerja untuk mengelola reservasi keluarga, jadwal layanan, dan
          administrasi Klinik LaaTachzan.
        </p>
        <div class="admin-login-image">
          <img
            src="/images/clinic.jpg"
            alt="Ilustrasi suasana klinik LaaTachzan"
          />
          <span>
            LAYANAN KHITAN KELUARGA
            <br />
            <strong>Dengan hati, di setiap langkah.</strong>
          </span>
        </div>
        <div class="admin-login-features">
          <div>
            <UIcon name="i-lucide-calendar-check" />
            <strong>Reservasi terpusat</strong>
            <small>Data keluarga dalam satu alur</small>
          </div>
          <div>
            <UIcon name="i-lucide-heart-handshake" />
            <strong>Kolaborasi tim</strong>
            <small>Koordinasi layanan lebih mudah</small>
          </div>
        </div>
        <blockquote>“Daftar Mudah, Khitan Nyaman, Keluarga Tenang.”</blockquote>
      </aside>
      <section class="admin-login-form">
        <div class="admin-login-fields">
          <div class="admin-split">
            <span class="admin-eyebrow">PORTAL ADMIN</span>
            <span class="admin-pill">
              <span class="status-dot" />
              Akses Administrator
            </span>
          </div>
          <h2>Autentikasi Staf Medis</h2>
          <p>Masuk ke ruang kerja operasional klinik.</p>
          <form class="admin-form" @submit.prevent="login">
            <label class="admin-field">
              Email petugas
              <input
                v-model="email"
                type="email"
                autocomplete="username"
                placeholder="Masukkan email admin"
                required
              />
              <small>Gunakan akun administrator klinik.</small>
            </label>
            <label class="admin-field">
              Kata sandi portal
              <div class="admin-password">
                <input
                  v-model="password"
                  :type="visible ? 'text' : 'password'"
                  autocomplete="current-password"
                  required
                  placeholder="Masukkan kata sandi"
                />
                <button
                  type="button"
                  :aria-label="
                    visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
                  "
                  @click="visible = !visible"
                >
                  <UIcon :name="visible ? 'i-lucide-eye-off' : 'i-lucide-eye'" />
                </button>
              </div>
            </label>
            <div class="admin-split">
              <button class="admin-text-link" type="button" @click="help = true">
                Bantuan akses
              </button>
            </div>
            <p v-if="error" class="admin-alert error" role="alert">{{ error }}</p>
            <button
              class="admin-button primary"
              type="submit"
              :disabled="submitting"
            >
              {{ submitting ? 'Membuka portal…' : 'Masuk ke Dashboard Klinik' }}
              <UIcon name="i-lucide-arrow-right" />
            </button>
          </form>
          <NuxtLink v-if="validRole" to="/admin" class="admin-text-link">
            Lanjutkan sesi yang sudah aktif
            <UIcon name="i-lucide-arrow-right" />
          </NuxtLink>
        </div>
        <footer>
          © {{ new Date().getFullYear() }} Klinik LaaTachzan
          <span>Operasional dengan perhatian.</span>
        </footer>
      </section>
    </div>
    <AdminModal
      v-model="help"
      title="Bantuan akses portal"
      description="Masuk menggunakan satu akun administrator yang telah dibuat."
    >
      <p class="admin-hint">
        Gunakan email dan kata sandi administrator klinik. Jika belum memiliki
        akses atau lupa kata sandi, hubungi pengelola aplikasi. Sesi berlaku
        maksimal 8 jam.
      </p>
      <button class="admin-button primary admin-full" @click="help = false">
        Mengerti
      </button>
    </AdminModal>
  </div>
</template>
