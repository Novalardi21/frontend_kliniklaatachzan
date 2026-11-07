<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  hint: string
  icon: string
  tone?: string
}>()
</script>
<template>
  <article class="admin-stat" :class="tone">
    <div>
      <span>{{ label }}</span>
      <span class="admin-stat-icon"><UIcon :name="icon" /></span>
    </div>
    <strong>{{ value }}</strong>
    <small>{{ hint }}</small>
  </article>
</template>
