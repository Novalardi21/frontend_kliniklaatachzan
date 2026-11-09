<script setup lang="ts">
const props = withDefaults(defineProps<{
  total: number
  pageSize?: number
}>(), { pageSize: 6 })
const page = defineModel<number>({ required: true })
const pages = computed(() => Math.ceil(props.total / props.pageSize))
</script>

<template>
  <nav v-if="pages > 1" class="admin-pagination" aria-label="Navigasi halaman tabel">
    <span aria-live="polite">
      {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, total) }}
      dari {{ total }} baris
    </span>
    <div>
      <button type="button" aria-label="Halaman sebelumnya" :disabled="page <= 1" @click="page--">
        <UIcon name="i-lucide-chevron-left" />
      </button>
      <span>{{ page }} / {{ pages }}</span>
      <button type="button" aria-label="Halaman berikutnya" :disabled="page >= pages" @click="page++">
        <UIcon name="i-lucide-chevron-right" />
      </button>
    </div>
  </nav>
</template>
