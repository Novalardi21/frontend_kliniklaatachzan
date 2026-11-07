<script setup lang="ts">
const { providers } = usePublicCatalog()
</script>
<template>
  <section id="tentang" class="section container">
    <div class="section-heading-row">
      <LandingSectionHeading
        eyebrow="KENALI LEBIH DEKAT"
        title="Pendamping untuk momen berani."
        description="Pendekatan yang hangat dimulai dari saling mengenal. Kenali tim yang mendampingi keluarga Anda."
      />
      <span class="soft-tag">Tim klinik</span>
    </div>
    <p v-if="!providers.length" class="data-note">
      Informasi tenaga medis akan dikonfirmasi oleh klinik.
    </p>
    <div class="providers-grid">
      <article
        v-for="provider in providers"
        :key="provider.id"
        class="provider-card"
      >
        <div class="provider-image">
          <img
            :src="provider.image"
            :alt="`Ilustrasi profil ${provider.role.toLowerCase()}`"
            width="500"
            height="350"
            loading="lazy"
          />
          <span>{{ provider.role }}</span>
        </div>
        <div class="provider-content">
          <h3>{{ provider.name }}</h3>
          <p>{{ provider.description }}</p>
          <div class="provider-footer">
            <UIcon name="i-lucide-stethoscope" />
            <span>Tenaga medis klinik</span>
            <UIcon name="i-lucide-arrow-up-right" />
          </div>
        </div>
      </article>
    </div>
    <div class="about-values">
      <div>
        <UIcon name="i-lucide-armchair" />
        <span>
          <strong>Suasana yang menenangkan</strong>
          <small>Ruang untuk kenyamanan keluarga</small>
        </span>
      </div>
      <div>
        <UIcon name="i-lucide-heart-handshake" />
        <span>
          <strong>Pendampingan orang tua</strong>
          <small>Terlibat dalam setiap persiapan</small>
        </span>
      </div>
      <div>
        <UIcon name="i-lucide-message-circle-heart" />
        <span>
          <strong>Komunikasi yang terbuka</strong>
          <small>Kenali proses sebelum memutuskan</small>
        </span>
      </div>
    </div>
  </section>
</template>
