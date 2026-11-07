<script setup lang="ts">
const { packages, error, status, refresh } = usePublicCatalog()
defineEmits<{ select: [id: string] }>()
</script>
<template>
  <section id="paket" class="section container">
    <div class="section-heading-row">
      <LandingSectionHeading
        eyebrow="PILIHAN UNTUK SETIAP KELUARGA"
        title="Perawatan tepat, hati lebih tenang."
        description="Pilihan paket untuk kebutuhan si kecil. Temukan yang paling sesuai untuk keluarga Anda."
      />
      <span class="soft-tag">
        <UIcon name="i-lucide-wallet" />
        Bayar di tempat
      </span>
    </div>
    <p v-if="status === 'pending'" class="data-note" role="status">
      Memuat pilihan layanan…
    </p>
    <div v-else-if="error" class="data-note" role="alert">
      Pilihan layanan belum dapat dimuat.
      <button class="button button-outline" @click="refresh()">
        Coba Lagi
      </button>
    </div>
    <p v-else-if="!packages.length" class="data-note">
      Belum ada paket yang tersedia. Silakan hubungi klinik untuk informasi
      layanan.
    </p>
    <div class="packages-grid">
      <LandingPackageCard
        v-for="item in packages"
        :key="item.id"
        :item="item"
        @select="$emit('select', $event)"
      />
    </div>
    <p class="data-note">
      <UIcon name="i-lucide-info" />
      Nama dan harga paket mengikuti katalog terbaru klinik. Kesesuaian tindakan
      serta durasi layanan dikonfirmasi bersama tenaga medis.
    </p>
    <div class="method-callout">
      <span class="benefit-icon"><UIcon name="i-lucide-stethoscope" /></span>
      <div>
        <h3>Belum tahu metode yang sesuai?</h3>
        <p>
          Tenaga medis akan membantu menilai pilihan metode berdasarkan kondisi
          dan kebutuhan anak.
        </p>
      </div>
      <a href="#faq">
        Pelajari lebih lanjut
        <UIcon name="i-lucide-arrow-up-right" />
      </a>
    </div>
  </section>
</template>
