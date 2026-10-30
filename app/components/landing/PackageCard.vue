<script setup lang="ts">
import { formatRupiah, type KhitanPackage } from '~/data/landing'
defineProps<{ item: KhitanPackage }>()
defineEmits<{ select: [id: string] }>()
</script>
<template>
  <article class="package-card" :class="{ 'package-featured': item.featured }">
    <div v-if="item.featured" class="package-ribbon">
      <UIcon name="i-lucide-sparkles" />
      PILIHAN UNTUK KENYAMANAN LEBIH
    </div>
    <div class="package-card-top">
      <span class="package-icon"><UIcon :name="item.icon" /></span>
      <span class="duration">{{ item.duration }}</span>
    </div>
    <span class="eyebrow package-label">{{ item.label }}</span>
    <h3>{{ item.name }}</h3>
    <p class="package-description">{{ item.description }}</p>
    <div class="package-price">
      <span>Contoh harga per anak</span>
      <strong>{{ formatRupiah(item.price) }}</strong>
      <small>Bayar di tempat setelah layanan</small>
    </div>
    <ul class="benefit-list">
      <li v-for="benefit in item.benefits" :key="benefit">
        <UIcon name="i-lucide-circle-check" />
        {{ benefit }}
      </li>
    </ul>
    <button
      class="button"
      :class="item.featured ? 'button-primary' : 'button-outline'"
      @click="$emit('select', item.id)"
    >
      Pilih {{ item.name }}
      <UIcon name="i-lucide-arrow-up-right" />
    </button>
  </article>
</template>
