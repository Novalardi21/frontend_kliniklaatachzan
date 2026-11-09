<script setup lang="ts">
const catalog = usePublicCatalog()
await catalog.ready
const dialog = ref<'booking' | 'status' | null>(null)
const landingMain = ref<HTMLElement>()
let scrollObserver: IntersectionObserver | undefined

onMounted(() => {
  if (!landingMain.value || !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  scrollObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.classList.add('landing-scroll-enter')
      observer.unobserve(entry.target)
    }
  })

  for (const section of landingMain.value.children) {
    if (section.getBoundingClientRect().top >= window.innerHeight)
      scrollObserver.observe(section)
  }
})
onBeforeUnmount(() => scrollObserver?.disconnect())

async function openBooking(packageId?: string) {
  await navigateTo({
    path: '/booking',
    query: packageId ? { paket: packageId } : {}
  })
}
</script>
<template>
  <div>
    <a class="skip-link" href="#main">Langsung ke konten</a>
    <LandingHeader @book="openBooking()" @check="dialog = 'status'" />
    <main id="main" ref="landingMain" class="landing-main">
      <LandingHero @book="openBooking()" />
      <LandingPackages @select="openBooking" />
      <LandingBookingSteps @book="openBooking()" />
      <LandingAbout />
      <LandingSchedule @book="openBooking()" />
      <LandingFaq />
      <section class="closing-banner container">
        <div>
          <span class="eyebrow">LANGKAH KECIL, KEBAHAGIAAN BESAR</span>
          <h2>
            Siapkan momen berani
            <br />
            si kecil bersama kami.
          </h2>
          <p>
            Mulai dari rumah. Pilih paket, ajukan jadwal, dan biarkan kami
            membantu.
          </p>
        </div>
        <button class="button button-light" @click="openBooking()">
          Booking Khitan
          <UIcon name="i-lucide-arrow-up-right" />
        </button>
      </section>
    </main>
    <LandingFooter />
    <div class="mobile-booking">
      <div>
        <strong>Untuk momen berani si kecil</strong>
        <span>Daftar mudah, bayar di tempat</span>
      </div>
      <button class="button button-primary" @click="openBooking()">
        Booking
        <UIcon name="i-lucide-arrow-right" />
      </button>
    </div>
    <LandingDemoDialog
      :mode="dialog"
      package-id="premium"
      @close="dialog = null"
    />
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: no-preference) {
  .landing-main > :deep(.landing-scroll-enter) {
    animation: landing-scroll-in 450ms ease-out;
  }
}

@keyframes landing-scroll-in {
  from {
    opacity: 0.55;
    transform: translateY(16px);
  }
}
</style>
