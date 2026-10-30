<script setup lang="ts">
defineEmits<{ book: [] }>()
const benefits = [
  {
    icon: 'i-lucide-stethoscope',
    title: 'Pendampingan medis',
    text: 'Dari persiapan hingga kontrol'
  },
  {
    icon: 'i-lucide-smile',
    title: 'Pendekatan ramah anak',
    text: 'Kenyamanan si kecil diutamakan'
  },
  {
    icon: 'i-lucide-wallet',
    title: 'Bayar di tempat',
    text: 'Tanpa pembayaran di muka'
  }
]
</script>
<template>
  <section id="beranda" class="hero container">
    <div class="hero-copy">
      <div class="hero-label">
        <span />
        DENGAN HATI, UNTUK SI KECIL
      </div>
      <h1>
        Daftar Mudah.
        <br />
        Khitan Nyaman.
        <br />
        <span>Keluarga Tenang.</span>
      </h1>
      <p>
        Momen penting si kecil layak dipersiapkan dengan baik. Kenali layanan
        khitan kami dan rencanakan kunjungan keluarga dengan lebih mudah.
      </p>
      <div class="hero-actions">
        <button class="button button-primary" @click="$emit('book')">
          <UIcon name="i-lucide-calendar-days" />
          Booking Khitan
          <UIcon name="i-lucide-arrow-up-right" />
        </button>
        <a class="button button-outline" href="#paket">
          Jelajahi Paket
          <UIcon name="i-lucide-arrow-right" />
        </a>
      </div>
      <div class="hero-note">
        <UIcon name="i-lucide-circle-check" />
        Pilih jadwal dari rumah, konfirmasi bersama klinik.
      </div>
    </div>
    <div class="hero-visual">
      <img
        class="hero-photo"
        src="/images/clinic.jpg"
        alt="Ilustrasi suasana ruang klinik bernuansa hangat"
        fetchpriority="high"
        width="680"
        height="680"
      />
      <span class="photo-caption">ILUSTRASI SUASANA KLINIK</span>
      <div class="hero-floating-card">
        <span class="floating-icon">
          <UIcon name="i-lucide-heart-handshake" />
        </span>
        <div>
          <strong>Teman di setiap langkah.</strong>
          <p>Untuk si kecil dan keluarga.</p>
        </div>
        <UIcon class="floating-sparkle" name="i-lucide-sparkles" />
      </div>
      <div class="visual-label">
        <UIcon name="i-lucide-heart" />
        <span>
          Perhatian kecil.
          <br />
          <strong>Rasa nyaman yang berarti.</strong>
        </span>
      </div>
    </div>
    <div class="hero-benefits">
      <div v-for="benefit in benefits" :key="benefit.title">
        <span class="benefit-icon"><UIcon :name="benefit.icon" /></span>
        <div>
          <strong>{{ benefit.title }}</strong>
          <p>{{ benefit.text }}</p>
        </div>
      </div>
      <a href="#cara-booking" class="discover-link">
        Kenali cara booking
        <UIcon name="i-lucide-arrow-down-right" />
      </a>
    </div>
  </section>
</template>
