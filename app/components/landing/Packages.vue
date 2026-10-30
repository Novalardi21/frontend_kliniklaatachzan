<script setup lang="ts">
import { packages } from '~/data/landing'
defineEmits<{ select: [id: string] }>()
</script>
<template>
  <section id="paket" class="section container">
    <div class="section-heading-row">
      <LandingSectionHeading
        eyebrow="PILIHAN UNTUK SETIAP KELUARGA"
        title="Perawatan tepat, hati lebih tenang."
        description="Tiga pilihan paket untuk kebutuhan si kecil. Temukan yang paling sesuai untuk keluarga Anda."
      />
      <span class="soft-tag">
        <UIcon name="i-lucide-wallet" />
        Bayar di tempat
      </span>
    </div>
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
      Harga, benefit, dan durasi adalah data contoh. Metode dipilih terpisah dari
      paket dan dikonfirmasi bersama klinik.
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
