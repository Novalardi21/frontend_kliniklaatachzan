<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Booking & Reservasi — LaaTachzan' })
</script>

<template>
  <div>
    <AdminPageHeading
      eyebrow="OPERASIONAL KLINIK / RESERVASI & TINJAUAN"
      title="Manajemen Booking & Reservasi Pasien"
      description="Tinjau pengajuan, verifikasi identitas, dan konfirmasi jadwal keluarga."
    />
    <AdminBookingInbox />
  </div>
</template>
