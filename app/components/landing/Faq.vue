<script setup lang="ts">
import { faqs } from '~/data/landing'
</script>
<template>
  <section id="faq" class="section faq-section container">
    <div>
      <LandingSectionHeading
        eyebrow="KAMI BANTU JAWAB"
        title="Ada yang ingin ditanyakan?"
        description="Kenali prosesnya agar Anda dan si kecil bisa mempersiapkan diri dengan lebih tenang."
      />
      <div class="faq-aside">
        <UIcon name="i-lucide-messages-square" />
        <p>
          Keputusan tindakan dan metode perlu dibicarakan langsung dengan tenaga
          medis.
        </p>
      </div>
    </div>
    <div class="faq-list">
      <details
        v-for="(faq, index) in faqs"
        :key="faq.question"
        :open="index === 0"
        name="landing-faq"
      >
        <summary>
          {{ faq.question }}
          <UIcon name="i-lucide-plus" />
        </summary>
        <p>{{ faq.answer }}</p>
      </details>
    </div>
  </section>
</template>
