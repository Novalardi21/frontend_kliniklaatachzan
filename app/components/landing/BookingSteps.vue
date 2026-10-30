<script setup lang="ts">
import { bookingSteps } from '~/data/landing'
defineEmits<{ book: [] }>()
</script>
<template>
  <section id="cara-booking" class="booking-section">
    <div class="container">
      <LandingSectionHeading
        eyebrow="MUDAH DARI LANGKAH PERTAMA"
        title="Dari rumah, dalam empat langkah."
        description="Lebih sedikit urusan administrasi, lebih banyak waktu untuk mempersiapkan si kecil."
        centered
      />
      <ol class="steps-grid">
        <li v-for="(step, index) in bookingSteps" :key="step.title">
          <div class="step-top">
            <span class="step-icon"><UIcon :name="step.icon" /></span>
            <span class="step-number">0{{ index + 1 }}</span>
          </div>
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </li>
      </ol>
      <div class="booking-bottom">
        <span>
          <UIcon name="i-lucide-info" />
          Pengajuan diterima terlebih dahulu. Jadwal final menunggu konfirmasi
          klinik.
        </span>
        <button class="text-button" @click="$emit('book')">
          Mulai booking
          <UIcon name="i-lucide-arrow-right" />
        </button>
      </div>
    </div>
  </section>
</template>
