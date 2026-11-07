<script setup lang="ts">
import { adminNavigation, initials } from '~/data/admin'
import '~/assets/css/admin.css'
const route = useRoute()
const persistentMaster = computed(() => route.path === '/admin/master-data')
const liveDashboard = computed(
  () => route.path === '/admin' || route.path === '/admin/'
)
const { data: dashboardSummary } = useNuxtData<{
  pending: number
  queued: number
  failed: number
}>('clinic-admin-dashboard')
const modeLabel = computed(() =>
  liveDashboard.value
    ? 'Dashboard · PostgreSQL'
    : persistentMaster.value
      ? 'Master Data · PostgreSQL'
      : 'Pratinjau · Data contoh'
)
const { name, label, logout: endSession } = useAdminSession()
const { data, pending, notices } = useAdminData()
const search = ref('')
const menuOpen = ref(false)
watch(
  () => route.path,
  () => {
    menuOpen.value = false
  }
)
async function logout() {
  try {
    await endSession()
    clearNuxtData([
      'clinic-admin-dashboard',
      'clinic-inbox-compact',
      'clinic-inbox-full'
    ])
    await navigateTo('/admin/login')
  } catch {
    const { notify } = useAdminData()
    notify('Belum dapat keluar. Silakan coba kembali.', 'error')
  }
}
async function searchBookings() {
  await navigateTo({
    path: '/admin/bookings',
    query: search.value.trim() ? { search: search.value.trim() } : {},
    hash: '#pengajuan-website'
  })
}
</script>
<template>
  <div class="admin-app">
    <a class="skip-link" href="#admin-main">Langsung ke konten admin</a>
    <button
      v-if="menuOpen"
      class="admin-mobile-backdrop"
      aria-label="Tutup navigasi"
      @click="menuOpen = false"
    />
    <aside class="admin-sidebar" :class="{ 'is-open': menuOpen }">
      <div class="admin-sidebar-brand">
        <LandingBrand />
        <span>PORTAL OPERASIONAL KLINIK</span>
      </div>
      <div class="admin-mode-tag">
        <UIcon name="i-lucide-badge-check" />
        {{ modeLabel }}
      </div>
      <small class="admin-nav-label">NAVIGASI OPERASIONAL</small>
      <nav aria-label="Navigasi operasional">
        <NuxtLink
          v-for="item in adminNavigation"
          :key="item.to"
          :to="item.to"
          :class="{ active: route.path === item.to }"
          :aria-current="route.path === item.to ? 'page' : undefined"
        >
          <UIcon :name="item.icon" />
          <span>{{ item.label }}</span>
          <small
            v-if="
              item.to === '/admin/bookings' &&
              (liveDashboard ? dashboardSummary?.pending : pending.length)
            "
          >
            {{
              liveDashboard ? dashboardSummary?.pending : pending.length
            }}
            Baru
          </small>
        </NuxtLink>
      </nav>
      <div class="admin-sidebar-bottom">
        <div class="admin-clinic-chip">
          <span>LT</span>
          <div>
            <strong>Klinik LaaTachzan</strong>
            <small>Operasional & reservasi</small>
          </div>
        </div>
        <NuxtLink to="/">
          <UIcon name="i-lucide-arrow-up-right" />
          Lihat website klinik
        </NuxtLink>
        <button @click="logout">
          <UIcon name="i-lucide-log-out" />
          Keluar
        </button>
      </div>
    </aside>
    <div class="admin-workspace">
      <header class="admin-topbar">
        <button
          class="admin-menu-button admin-icon-button"
          :aria-expanded="menuOpen"
          aria-label="Buka navigasi admin"
          @click="menuOpen = !menuOpen"
        >
          <UIcon name="i-lucide-menu" />
        </button>
        <form class="admin-global-search" @submit.prevent="searchBookings">
          <UIcon name="i-lucide-search" />
          <input
            v-model="search"
            aria-label="Cari booking"
            placeholder="Cari kode registrasi, nama anak, atau wali…"
          />
          <button type="submit" aria-label="Jalankan pencarian">
            <UIcon name="i-lucide-arrow-right" />
          </button>
        </form>
        <span class="admin-topbar-tag">
          <span class="status-dot" />
          {{ modeLabel }}
        </span>
        <NuxtLink
          :to="
            liveDashboard
              ? '/admin/bookings#pengajuan-website'
              : '/admin/notifications'
          "
          class="admin-icon-button admin-bell"
          aria-label="Lihat notifikasi"
        >
          <UIcon name="i-lucide-bell" />
          <span
            v-if="
              liveDashboard
                ? Boolean(dashboardSummary?.queued || dashboardSummary?.failed)
                : data.messages.some(
                    (item) =>
                      item.status === 'failed' || item.status === 'queued'
                  )
            "
          />
        </NuxtLink>
        <div class="admin-account">
          <div>
            <strong>{{ name }}</strong>
            <span>{{ label }}</span>
          </div>
          <span class="admin-avatar">{{ initials(name) }}</span>
        </div>
      </header>
      <main id="admin-main" class="admin-content"><slot /></main>
      <footer class="admin-bottom-bar">
        <span>© {{ new Date().getFullYear() }} Klinik LaaTachzan</span>
        <span>
          {{
            liveDashboard
              ? 'Ringkasan operasional dari PostgreSQL'
              : persistentMaster
                ? 'Master Data disimpan di PostgreSQL'
                : 'Mode pratinjau · Perubahan tersimpan selama sesi ini'
          }}
        </span>
      </footer>
    </div>
    <div class="admin-toasts" aria-live="polite">
      <div
        v-for="notice in notices.slice(-3)"
        :key="notice.id"
        :class="notice.tone"
      >
        <UIcon
          :name="
            notice.tone === 'error'
              ? 'i-lucide-circle-alert'
              : 'i-lucide-circle-check'
          "
        />
        {{ notice.text }}
        <button
          aria-label="Tutup pemberitahuan"
          @click="notices = notices.filter((item) => item.id !== notice.id)"
        >
          <UIcon name="i-lucide-x" />
        </button>
      </div>
    </div>
  </div>
</template>
