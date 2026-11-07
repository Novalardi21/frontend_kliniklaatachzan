<script setup lang="ts">
import { statusLabels, messageLabels } from '~/data/admin'
const props = defineProps<{ status: string; label?: string }>()
const text = computed(
  () =>
    props.label ??
    (
      {
        ...statusLabels,
        ...messageLabels,
        paid: 'Lunas',
        unpaid: 'Belum Dibayar',
        active: 'Aktif',
        inactive: 'Nonaktif',
        success: 'Berhasil',
        error: 'Perlu Ditinjau'
      } as Record<string, string>
    )[props.status] ??
    props.status
)
</script>
<template>
  <span class="admin-badge" :class="`badge-${status}`">
    <span />
    {{ text }}
  </span>
</template>
