<script setup lang="ts">
defineProps<{ title?: string; description?: string }>()
</script>
<template>
  <div class="admin-empty">
    <UIcon name="i-lucide-inbox" />
    <strong>{{ title ?? 'Belum ada data yang sesuai' }}</strong>
    <p>
      {{ description ?? 'Coba ubah pencarian atau filter yang digunakan.' }}
    </p>
    <slot />
  </div>
</template>
