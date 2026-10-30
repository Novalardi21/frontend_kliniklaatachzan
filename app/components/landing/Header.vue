<script setup lang="ts">
const emit = defineEmits<{ book: []; check: [] }>()
const menuOpen = ref(false)
const route = useRoute()
function checkBooking() {
  emit('check')
  menuOpen.value = false
}
const navigation = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Paket Khitan', href: '#paket' },
  { label: 'Cara Booking', href: '#cara-booking' },
  { label: 'Tentang Klinik', href: '#tentang' },
  { label: 'Kontak', href: '#kontak' }
]
</script>
<template>
  <div class="utility-bar">
    <div class="container">
      <span>
        <UIcon name="i-lucide-heart-handshake" />
        Langkah berani si kecil, ketenangan untuk keluarga.
      </span>
      <span class="demo-label">
        <span class="status-dot" />
        Pratinjau dengan data contoh
      </span>
    </div>
  </div>
  <header class="site-header">
    <div class="container nav-inner">
      <LandingBrand />
      <nav class="desktop-nav" aria-label="Navigasi utama">
        <NuxtLink
          v-for="item in navigation"
          :key="item.href"
          :to="route.path === '/' ? item.href : '/' + item.href"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="nav-actions">
        <button class="check-button" @click="$emit('check')">
          <UIcon name="i-lucide-search" />
          Cek Booking
        </button>
        <button class="button button-primary nav-book" @click="$emit('book')">
          Booking Khitan
          <UIcon name="i-lucide-arrow-up-right" />
        </button>
        <button
          class="menu-toggle"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          :aria-label="menuOpen ? 'Tutup menu' : 'Buka menu'"
          @click="menuOpen = !menuOpen"
        >
          <UIcon :name="menuOpen ? 'i-lucide-x' : 'i-lucide-menu'" />
        </button>
      </div>
    </div>
    <nav
      v-if="menuOpen"
      id="mobile-menu"
      class="mobile-nav"
      aria-label="Navigasi seluler"
    >
      <NuxtLink
        v-for="item in navigation"
        :key="item.href"
        :to="route.path === '/' ? item.href : '/' + item.href"
        @click="menuOpen = false"
      >
        {{ item.label }}
      </NuxtLink>
      <button @click="checkBooking">
        Cek Booking
        <UIcon name="i-lucide-search" />
      </button>
    </nav>
  </header>
</template>
