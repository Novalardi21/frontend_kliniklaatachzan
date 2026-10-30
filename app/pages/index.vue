<script setup lang="ts">
const dialog = ref<'booking' | 'status' | null>(null)
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
    <main id="main" class="landing-main">
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
