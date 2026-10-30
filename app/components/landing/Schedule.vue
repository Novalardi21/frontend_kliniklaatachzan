<script setup lang="ts">
import { sessions } from '~/data/landing'
defineEmits<{ book: [] }>()
</script>
<template>
  <section id="kontak" class="schedule-section container">
    <div class="schedule-copy">
      <LandingSectionHeading
        eyebrow="WAKTU UNTUK SI KECIL"
        title="Sesuaikan dengan ritme keluarga."
        description="Pilih preferensi waktu kunjungan. Kami akan membantu mencocokkannya dengan ketersediaan klinik."
      />
      <div class="sessions">
        <div
          v-for="session in sessions"
          :key="session.name"
          class="session-row"
        >
          <span class="session-icon"><UIcon :name="session.icon" /></span>
          <div>
            <h3>{{ session.name }}</h3>
            <p>{{ session.description }}</p>
          </div>
          <strong>{{ session.time }}</strong>
        </div>
      </div>
      <p class="data-note">
        <UIcon name="i-lucide-clock-3" />
        Rentang waktu adalah preferensi, bukan slot pasti.
      </p>
    </div>
    <aside class="visit-card">
      <div class="visit-icon"><UIcon name="i-lucide-map-pin" /></div>
      <span class="eyebrow">SAMPAI BERTEMU DI KLINIK</span>
      <h3>
        Rencanakan kunjungan
        <br />
        tanpa terburu-buru.
      </h3>
      <p>
        Alamat, kontak resmi, dan jam operasional lengkap akan ditampilkan
        setelah data klinik tersedia.
      </p>
      <div class="visit-detail">
        <UIcon name="i-lucide-building-2" />
        <div>
          <strong>Klinik LaaTachzan</strong>
          <span>Informasi lokasi segera tersedia</span>
        </div>
      </div>
      <div class="visit-detail">
        <UIcon name="i-lucide-calendar-check" />
        <div>
          <strong>Layanan berdasarkan konfirmasi</strong>
          <span>Sesuaikan jadwal bersama tim klinik</span>
        </div>
      </div>
      <button class="button button-primary" @click="$emit('book')">
        Coba pilih jadwal
        <UIcon name="i-lucide-arrow-up-right" />
      </button>
    </aside>
  </section>
</template>
