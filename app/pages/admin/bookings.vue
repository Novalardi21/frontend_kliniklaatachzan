<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Booking & Reservasi — LaaTachzan' })
const route = useRoute()
const { data, pending, todayBookings, occupied, capacity } = useAdminData()
const selectedId = ref(
  typeof route.query.selected === 'string'
    ? route.query.selected
    : data.value.bookings[0]?.id
)
const selected = computed(() =>
  data.value.bookings.find((item) => item.id === selectedId.value)
)
const manualOpen = ref(false)
watch(
  () => route.query.selected,
  (value) => {
    if (typeof value === 'string') selectedId.value = value
  }
)
function created(id: string) {
  selectedId.value = id
}
</script>
<template>
  <div>
    <AdminPageHeading
      eyebrow="OPERASIONAL KLINIK / RESERVASI & TINJAUAN"
      title="Manajemen Booking & Reservasi Pasien"
      description="Kelola pengajuan masuk, verifikasi data keluarga, dan kesepakatan jadwal layanan."
    >
      <NuxtLink to="/admin/excel" class="admin-button secondary">
        <UIcon name="i-lucide-download" />
        Ekspor Data
      </NuxtLink>
      <button class="admin-button primary" @click="manualOpen = true">
        <UIcon name="i-lucide-plus" />
        Input Booking Manual
      </button>
    </AdminPageHeading>
    <div class="admin-stats-grid">
      <AdminStatCard
        label="Total Reservasi"
        :value="data.bookings.length"
        hint="Seluruh pengajuan pada sesi ini"
        icon="i-lucide-calendar-check"
      />
      <AdminStatCard
        label="Perlu Verifikasi"
        :value="pending.length"
        hint="Pengajuan menunggu konfirmasi"
        icon="i-lucide-clipboard-check"
        tone="warm"
      />
      <AdminStatCard
        label="Permintaan Hari Ini"
        :value="todayBookings.length"
        hint="Sesi pagi, sore, dan fleksibel"
        icon="i-lucide-calendar-days"
        tone="green"
      />
      <AdminStatCard
        label="Kuota Tersisa Hari Ini"
        :value="
          Math.max(
            0,
            capacity('Pagi') +
              capacity('Sore') -
              occupied(data.today, 'Pagi') -
              occupied(data.today, 'Sore')
          )
        "
        hint="Untuk sesi pagi dan sore"
        icon="i-lucide-pie-chart"
      />
    </div>
    <div class="admin-bookings-layout">
      <AdminBookingTable
        :items="data.bookings"
        :selected-id="selectedId"
        @select="selectedId = $event.id"
      />
      <AdminBookingDetail :booking="selected" />
    </div>
    <AdminManualBooking v-model="manualOpen" @created="created" />
  </div>
</template>
