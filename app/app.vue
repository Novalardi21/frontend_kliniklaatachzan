<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'id' },
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap'
    }
  ]
})
useSeoMeta({
  title: 'MyLaaTachzan — Daftar Mudah, Khitan Nyaman, Keluarga Tenang',
  description:
    'Kenali paket khitan dan alur booking Klinik LaaTachzan. Pilih preferensi jadwal dan bayar di tempat. Pratinjau dengan data contoh.',
  ogTitle: 'MyLaaTachzan | Klinik Khitan Keluarga',
  ogDescription: 'Daftar Mudah, Khitan Nyaman, Keluarga Tenang.'
})
</script>
<template>
  <UApp><NuxtPage /></UApp>
</template>
