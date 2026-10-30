<template>
  <footer class="site-footer">
    <div class="container footer-top">
      <div class="footer-brand">
        <LandingBrand />
        <p>
          Daftar Mudah, Khitan Nyaman,
          <br />
          Keluarga Tenang.
        </p>
      </div>
      <div>
        <h3>Jelajahi</h3>
        <a href="/#paket">Paket Khitan</a>
        <a href="/#cara-booking">Cara Booking</a>
        <a href="/#tentang">Tentang Klinik</a>
      </div>
      <div>
        <h3>Informasi</h3>
        <a href="/#kontak">Jadwal & Kontak</a>
        <a href="/#faq">Pertanyaan Umum</a>
        <a href="/#beranda">
          Kembali ke Atas
          <UIcon name="i-lucide-arrow-up-right" />
        </a>
      </div>
      <div class="footer-note">
        <span class="soft-tag">
          <span class="status-dot" />
          Versi pratinjau
        </span>
        <p>
          Seluruh harga, benefit, dan profil menggunakan data contoh untuk
          demonstrasi.
        </p>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>
        © {{ new Date().getFullYear() }} MyLaaTachzan. Semua hak dilindungi.
      </span>
      <span>
        Dibuat dengan perhatian untuk keluarga
        <UIcon name="i-lucide-heart" />
      </span>
    </div>
  </footer>
</template>
