<script setup lang="ts">
const loading = ref(true)

onNuxtReady(() => {
  loading.value = false
})
</script>

<template>
  <Transition name="site-loading">
    <div v-if="loading" class="site-loading-screen" role="status">
      <img src="/images/logo-laa-tachzan.png" alt="Klinik Laa Tachzan" />
      <span class="site-loading-spinner" aria-hidden="true" />
      <p>Memuat halaman…</p>
    </div>
  </Transition>
</template>

<style scoped>
.site-loading-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 16px;
  pointer-events: none;
  background: #f8f6f2;
  color: #195941;
  animation: loading-failsafe 0s 5s forwards;
}

.site-loading-screen img {
  width: 132px;
  border-radius: 14px;
}

.site-loading-spinner {
  width: 26px;
  height: 26px;
  border: 2px solid #cbded5;
  border-top-color: #195941;
  border-radius: 50%;
  animation: loading-spin 0.75s linear infinite;
}

.site-loading-leave-active {
  transition: opacity 200ms ease;
}

.site-loading-leave-to {
  opacity: 0;
}

@keyframes loading-spin {
  to { transform: rotate(360deg); }
}

@keyframes loading-failsafe {
  to { visibility: hidden; }
}

@media (prefers-reduced-motion: reduce) {
  .site-loading-spinner {
    animation: none;
  }

  .site-loading-leave-active {
    transition: none;
  }
}
</style>
