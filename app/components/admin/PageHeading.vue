<script setup lang="ts">
defineProps<{ eyebrow: string; title: string; description: string }>()
</script>
<template>
  <div class="admin-page-heading">
    <div>
      <span class="admin-eyebrow">{{ eyebrow }}</span>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>
    </div>
    <div class="admin-heading-actions"><slot /></div>
  </div>
</template>
