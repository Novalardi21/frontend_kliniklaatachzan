<script setup lang="ts">
import { methods, displayDate, type BookingDraft } from '~/data/booking'
import { packages, providers, sessions, formatRupiah } from '~/data/landing'
const props = defineProps<{
  draft: BookingDraft
  total: number
  draftSaved: boolean
}>()
defineEmits<{ save: [] }>()
const consent = defineModel<boolean>('consent', { required: true })
const providerName = computed(() =>
  props.draft.provider === 'clinic'
    ? 'Ditentukan Klinik'
    : providers.find((item) => item.name === props.draft.provider)?.name
)
const selectedSession = computed(() =>
  sessions.find((item) => item.name === props.draft.session)
)
</script>

<template>
  <aside class="booking-sidebar" aria-label="Ringkasan booking">
    <section class="booking-panel booking-summary">
      <div class="booking-summary-title">
        <div>
          <span class="eyebrow">IKHTISAR PENGAJUAN</span>
          <h2>Resume Booking Khitan</h2>
        </div>
        <span><UIcon name="i-lucide-receipt-text" /></span>
      </div>
      <div class="booking-summary-patients">
        <div v-for="(child, index) in draft.children" :key="child.id">
          <span class="summary-label">Pasien anak {{ index + 1 }}</span>
          <strong>{{ child.name || 'Nama belum diisi' }}</strong>
          <p>
            {{ packages.find((item) => item.id === child.packageId)?.name }} ·
            {{
              formatRupiah(
                packages.find((item) => item.id === child.packageId)?.price ?? 0
              )
            }}
          </p>
          <small>
            {{ methods.find((item) => item.id === child.methodId)?.name }}
          </small>
        </div>
        <span class="soft-tag">{{ draft.children.length }} pasien</span>
      </div>
      <dl class="booking-summary-details">
        <div>
          <dt>Tenaga medis</dt>
          <dd>{{ providerName }}</dd>
        </div>
        <div>
          <dt>Rencana tanggal & sesi</dt>
          <dd>
            <UIcon name="i-lucide-calendar-days" />
            {{ displayDate(draft.date) }}
            <small>
              {{ selectedSession?.name }} · {{ selectedSession?.time }}
            </small>
          </dd>
        </div>
      </dl>
      <div class="booking-cost">
        <div>
          <span>Biaya tindakan ({{ draft.children.length }} anak)</span>
          <strong>{{ formatRupiah(total) }}</strong>
        </div>
        <div>
          <span>Perlengkapan perawatan</span>
          <span class="cost-included">Sesuai paket</span>
        </div>
        <div>
          <span>Administrasi demo</span>
          <span class="cost-included">Rp 0</span>
        </div>
        <div class="booking-cost-total">
          <span>ESTIMASI TOTAL</span>
          <strong>{{ formatRupiah(total) }}</strong>
        </div>
      </div>
      <div class="booking-payment-note">
        <UIcon name="i-lucide-shield-check" />
        <p>
          <strong>Tanpa DP / Bayar di tempat</strong>
          Opsi tunai, QRIS, atau transfer mengikuti fasilitas klinik. Demo ini
          tidak meminta pembayaran.
        </p>
      </div>
      <label class="booking-consent">
        <input v-model="consent" type="checkbox" required />
        <span>
          Saya telah membaca
          <a href="#booking-privacy">keterangan privasi demo</a>
          dan mengonfirmasi kebenaran data yang diisi.
        </span>
      </label>
      <button class="button button-primary booking-submit" type="submit">
        <UIcon name="i-lucide-send" />
        Ajukan Booking Demo
      </button>
      <button
        class="button button-outline booking-save"
        type="button"
        @click="$emit('save')"
      >
        <UIcon name="i-lucide-bookmark" />
        Simpan Draft Sementara
      </button>
      <p v-if="draftSaved" class="booking-draft-message" role="status">
        Draft tersimpan di memori tab ini. Muat ulang atau tutup tab akan
        menghapusnya.
      </p>
      <p class="booking-summary-footnote">
        Harga contoh. Jadwal & tenaga medis menunggu konfirmasi klinik.
      </p>
    </section>
    <section class="booking-panel booking-after">
      <h3>
        <UIcon name="i-lucide-route" />
        Alur setelah pengajuan
      </h3>
      <ol>
        <li>
          <span>1</span>
          <p>Tinjau ringkasan dan buat pengajuan demo.</p>
        </li>
        <li>
          <span>2</span>
          <p>
            Status contoh:
            <strong>Menunggu Konfirmasi Klinik</strong>
            .
          </p>
        </li>
        <li>
          <span>3</span>
          <p>
            Pada layanan aktif, klinik menghubungi wali untuk menyepakati jadwal
            final.
          </p>
        </li>
      </ol>
    </section>
    <div class="booking-help">
      <UIcon name="i-lucide-message-circle-question-mark" />
      <div>
        <strong>Butuh bantuan booking?</strong>
        <p>Kenali alur dan pertanyaan umum.</p>
      </div>
      <NuxtLink to="/#faq">
        Lihat FAQ
        <UIcon name="i-lucide-arrow-up-right" />
      </NuxtLink>
    </div>
  </aside>
</template>
