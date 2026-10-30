<template>
  <NuxtLink to="/#beranda" class="brand" aria-label="Klinik Laa Tachzan — Beranda">
    <span class="clinic-logo">
      <img
        src="/images/logo-laa-tachzan.png"
        alt="Klinik Laa Tachzan"
        width="150"
        height="150"
      >
    </span>
  </NuxtLink>
</template>

<style scoped>
/* Frame the supplied square image without changing the original logo asset. */
.clinic-logo {
  display: block;
  width: 150px;
  height: 60px;
  overflow: hidden;
}

.clinic-logo img {
  display: block;
  width: 150px;
  height: 150px;
  max-width: none;
  transform: translateY(-38px);
}

@media (max-width: 720px) {
  .clinic-logo {
    width: 140px;
    height: 56px;
  }

  .clinic-logo img {
    width: 140px;
    height: 140px;
    transform: translateY(-35px);
  }
}
</style>
