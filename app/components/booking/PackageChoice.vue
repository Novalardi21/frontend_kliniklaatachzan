<script setup lang="ts">
import { methods, type BookingChild } from '~/data/booking'
import { packages, formatRupiah } from '~/data/landing'
const child = defineModel<BookingChild>({ required: true })
defineProps<{ index: number; multiple: boolean }>()
</script>

<template>
  <fieldset class="booking-package-group">
    <legend v-if="multiple">
      PAKET UNTUK ANAK {{ index + 1 }}
      <span>{{ child.name || 'Nama belum diisi' }}</span>
    </legend>
    <div class="booking-package-grid">
      <label
        v-for="item in packages"
        :key="item.id"
        class="booking-package-option"
        :class="{ selected: child.packageId === item.id }"
      >
        <input
          v-model="child.packageId"
          type="radio"
          :name="`package-${child.id}`"
          :value="item.id"
        />
        <span class="booking-option-tag">
          {{ item.featured ? 'KENYAMANAN LEBIH' : item.label }}
        </span>
        <strong>Paket {{ item.name }}</strong>
        <span class="booking-option-price">{{ formatRupiah(item.price) }}</span>
        <ul>
          <li v-for="benefit in item.benefits.slice(0, 4)" :key="benefit">
            <UIcon name="i-lucide-check" />
            {{ benefit }}
          </li>
        </ul>
        <span class="booking-option-button">
          {{ child.packageId === item.id ? 'Terpilih' : `Pilih ${item.name}` }}
          <UIcon
            :name="
              child.packageId === item.id
                ? 'i-lucide-circle-check'
                : 'i-lucide-arrow-right'
            "
          />
        </span>
      </label>
    </div>
    <div class="booking-methods">
      <h3>PILIH SPESIFIKASI METODE KLINIS</h3>
      <p>
        Metode terpisah dari paket. Pilihan berikut merupakan contoh dan perlu
        penilaian tenaga medis.
      </p>
      <label
        v-for="method in methods"
        :key="method.id"
        class="booking-method-option"
        :class="{ selected: child.methodId === method.id }"
      >
        <input
          v-model="child.methodId"
          type="radio"
          :name="`method-${child.id}`"
          :value="method.id"
        />
        <UIcon :name="method.icon" />
        <span>
          <strong>{{ method.name }}</strong>
          <small>{{ method.description }}</small>
        </span>
      </label>
    </div>
  </fieldset>
</template>
