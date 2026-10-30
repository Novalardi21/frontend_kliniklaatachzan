<script setup lang="ts">
import { childAge, type BookingChild } from '~/data/booking'
const child = defineModel<BookingChild>({ required: true })
defineProps<{ index: number; today: string }>()
</script>

<template>
  <fieldset class="booking-fieldset">
    <legend>
      <UIcon name="i-lucide-contact-round" />
      PASIEN ANAK {{ index + 1 }}
    </legend>
    <div class="booking-fields-grid">
      <label :for="`child-name-${child.id}`">
        Nama lengkap anak
        <span>*</span>
        <input
          :id="`child-name-${child.id}`"
          v-model.trim="child.name"
          autocomplete="off"
          placeholder="Sesuai Akta Kelahiran / KIA"
          required
          maxlength="100"
          pattern=".*\S.*"
        />
      </label>
      <label :for="`child-nik-${child.id}`">
        NIK anak
        <small>(opsional)</small>
        <input
          :id="`child-nik-${child.id}`"
          v-model.trim="child.nik"
          inputmode="numeric"
          placeholder="16 digit, bila diperlukan klinik"
          pattern="[0-9]{16}"
          maxlength="16"
          title="NIK terdiri dari 16 digit angka"
        />
      </label>
      <label :for="`child-place-${child.id}`">
        Tempat lahir
        <span>*</span>
        <input
          :id="`child-place-${child.id}`"
          v-model.trim="child.birthPlace"
          placeholder="Kota kelahiran"
          required
          maxlength="100"
          pattern=".*\S.*"
        />
      </label>
      <label :for="`child-date-${child.id}`">
        Tanggal lahir & usia
        <span>*</span>
        <div class="birth-date-field">
          <input
            :id="`child-date-${child.id}`"
            v-model="child.birthDate"
            type="date"
            :max="today"
            min="1900-01-01"
            required
          />
          <output>{{ childAge(child.birthDate, today) }}</output>
        </div>
      </label>
      <label :for="`child-gender-${child.id}`">
        Jenis kelamin
        <span>*</span>
        <select
          :id="`child-gender-${child.id}`"
          v-model="child.gender"
          required
        >
          <option>Laki-laki</option>
          <option>Perempuan</option>
        </select>
      </label>
      <label :for="`child-guardian-${child.id}`">
        Nama orang tua / wali sesuai KIA
        <span>*</span>
        <input
          :id="`child-guardian-${child.id}`"
          v-model.trim="child.guardian"
          placeholder="Nama sesuai dokumen anak"
          required
          maxlength="100"
          pattern=".*\S.*"
        />
      </label>
      <label :for="`child-health-${child.id}`" class="field-full">
        Riwayat alergi / kondisi khusus
        <small>(opsional)</small>
        <textarea
          :id="`child-health-${child.id}`"
          v-model.trim="child.healthNotes"
          placeholder="Contoh: alergi obat atau kondisi yang perlu diketahui tenaga medis"
          rows="2"
          maxlength="1000"
        />
      </label>
    </div>
  </fieldset>
</template>
