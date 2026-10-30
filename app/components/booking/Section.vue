<script setup lang="ts">
defineProps<{ number: number; title: string; description: string }>()
</script>

<template>
  <section
    :id="`booking-step-${number}`"
    class="booking-panel"
    :aria-labelledby="`booking-heading-${number}`"
  >
    <div class="booking-panel-heading">
      <span class="booking-section-number">{{ number }}</span>
      <div>
        <h2 :id="`booking-heading-${number}`">{{ title }}</h2>
        <p>{{ description }}</p>
      </div>
      <slot name="badge" />
    </div>
    <slot />
  </section>
</template>
