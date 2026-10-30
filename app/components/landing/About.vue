<script setup lang="ts">
import { providers } from '~/data/landing'
</script>
<template>
  <section id="tentang" class="section container">
    <div class="section-heading-row">
      <LandingSectionHeading
        eyebrow="KENALI LEBIH DEKAT"
        title="Pendamping untuk momen berani."
        description="Pendekatan yang hangat dimulai dari saling mengenal. Berikut contoh tampilan profil tim klinik."
      />
      <span class="soft-tag">Profil ilustrasi</span>
    </div>
    <div class="providers-grid">
      <article
        v-for="provider in providers"
        :key="provider.name"
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
            <span>Profil contoh</span>
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
