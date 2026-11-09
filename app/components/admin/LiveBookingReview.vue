<script setup lang="ts">
import { shortDate, statusLabels, type AdminBooking } from '~/data/admin'

const props = defineProps<{
  booking: {
    code: string
    date: string
    session: string
    guardian: string
    phone: string
    children: string[]
    status: string
    version: string
    address: string
    verified: boolean
    providerId: string | null
    sessionId: string
    proposedDate: string | null
    proposedSessionId: string | null
  }
}>()
const emit = defineEmits<{ updated: [] }>()
const catalog = usePublicCatalog()
const verified = ref(props.booking.verified)
const providerId = ref(props.booking.providerId ?? '')
const guardianAccepted = ref(false)
const mode = ref<'propose' | 'reject' | null>(null)
const reason = ref('')
function openDecision(action: 'propose' | 'reject') {
  mode.value = action
  reason.value = ''
}
const date = ref(props.booking.proposedDate ?? props.booking.date)
const sessionId = ref(
  props.booking.proposedSessionId ?? props.booking.sessionId
)
const saving = ref(false)
const message = ref('')
const canReview = computed(() =>
  ['pending', 'reschedule'].includes(props.booking.status)
)
async function submit(action: 'confirm' | 'propose' | 'reject') {
  if (saving.value) return
  saving.value = true
  message.value = ''
  try {
    await $fetch('/api/admin/booking-review', {
      method: 'POST',
      body: {
        action,
        code: props.booking.code,
        expectedStatus: props.booking.status,
        expectedVersion: props.booking.version,
        verified: verified.value,
        guardianAccepted: guardianAccepted.value,
        providerId: providerId.value || null,
        reason: action === 'confirm' ? '' : reason.value,
        date: date.value,
        sessionId: sessionId.value
      }
    })
    mode.value = null
    emit('updated')
  } catch (error) {
    message.value =
      (error as { data?: { data?: { message?: string } } }).data?.data
        ?.message ?? 'Perubahan belum dapat disimpan.'
  } finally {
    saving.value = false
  }
}

async function complete() {
  if (saving.value) return
  saving.value = true
  message.value = ''
  try {
    await $fetch('/api/admin/booking-complete', {
      method: 'POST',
      body: { code: props.booking.code }
    })
    emit('updated')
  } catch (error) {
    message.value =
      (error as { data?: { data?: { message?: string } } }).data?.data
        ?.message ?? 'Status layanan belum dapat disimpan.'
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <div class="admin-card admin-review-detail">
    <div class="admin-card-heading">
      <div>
        <h3>Verifikasi &amp; Tinjauan</h3>
        <p>{{ booking.code }}</p>
      </div>
      <AdminBadge
        :status="booking.status as AdminBooking['status']"
        :label="statusLabels[booking.status as AdminBooking['status']]"
      />
    </div>
    <dl class="admin-detail-list">
      <div>
        <dt>Pasien</dt>
        <dd>{{ booking.children.join(', ') }}</dd>
      </div>
      <div>
        <dt>Wali</dt>
        <dd>{{ booking.guardian }} · {{ booking.phone }}</dd>
      </div>
      <div>
        <dt>Alamat</dt>
        <dd>{{ booking.address }}</dd>
      </div>
      <div>
        <dt>Jadwal</dt>
        <dd>{{ shortDate(booking.date) }} · {{ booking.session }}</dd>
      </div>
      <div v-if="booking.proposedDate">
        <dt>Usulan</dt>
        <dd>
          {{ shortDate(booking.proposedDate) }} ·
          {{
            catalog.sessions.value.find(
              (item) => item.id === booking.proposedSessionId
            )?.name
          }}
        </dd>
      </div>
    </dl>
    <template v-if="canReview">
      <div class="admin-form">
        <label class="admin-check">
          <input v-model="verified" type="checkbox" :disabled="saving" />
          Identitas anak dan wali sudah ditinjau.
        </label>
        <label v-if="booking.status === 'reschedule'" class="admin-check">
          <input
            v-model="guardianAccepted"
            type="checkbox"
            :disabled="saving"
          />
          Wali sudah menyetujui jadwal usulan.
        </label>
        <label class="admin-field">
          Tenaga medis
          <select v-model="providerId" :disabled="saving">
            <option value="">Ditentukan klinik</option>
            <option
              v-if="
                providerId &&
                !catalog.providers.value.some((item) => item.id === providerId)
              "
              :value="providerId"
            >
              Tenaga medis tersimpan
            </option>
            <option
              v-for="item in catalog.providers.value"
              :key="item.id"
              :value="item.id"
            >
              {{ item.name }}
            </option>
          </select>
        </label>
      </div>
      <div class="admin-card-actions">
        <button
          type="button"
          class="admin-button success"
          :disabled="
            saving ||
            !verified ||
            (booking.status === 'reschedule' && !guardianAccepted)
          "
          @click="submit('confirm')"
        >
          Setujui Pengajuan
        </button>
        <button
          type="button"
          class="admin-button warm"
          :disabled="saving"
          @click="openDecision('propose')"
        >
          Usulkan Jadwal
        </button>
        <button
          type="button"
          class="admin-button secondary"
          :disabled="saving"
          @click="openDecision('reject')"
        >
          Tolak
        </button>
      </div>
      <form v-if="mode" class="admin-form" @submit.prevent="submit(mode)">
        <template v-if="mode === 'propose'">
          <label class="admin-field">
            Tanggal usulan
            <input v-model="date" type="date" required />
          </label>
          <label class="admin-field">
            Sesi
            <select v-model="sessionId" required>
              <option
                v-for="item in catalog.sessions.value"
                :key="item.id"
                :value="item.id"
              >
                {{ item.name }}
              </option>
            </select>
          </label>
        </template>
        <label class="admin-field">
          Alasan untuk riwayat internal
          <textarea v-model.trim="reason" maxlength="500" required />
        </label>
        <button type="submit" class="admin-button primary" :disabled="saving">
          {{ mode === 'propose' ? 'Simpan Usulan' : 'Tolak Pengajuan' }}
        </button>
      </form>
    </template>
    <div v-else-if="booking.status === 'confirmed'" class="admin-form">
      <p class="admin-hint">Tandai selesai setelah layanan diberikan agar tagihan muncul di kasir.</p>
      <button type="button" class="admin-button success" :disabled="saving" @click="complete">
        {{ saving ? 'Menyimpan…' : 'Tandai Layanan Selesai' }}
      </button>
    </div>
    <NuxtLink v-else-if="booking.status === 'completed'" to="/admin/payments" class="admin-button secondary">
      Buka Pembayaran di Tempat
    </NuxtLink>
    <p v-if="message" class="admin-alert error" role="alert">{{ message }}</p>
  </div>
</template>

<style scoped>
.admin-review-detail {
  display: grid;
  gap: 20px;
  margin-top: 20px;
}

.admin-review-detail .admin-card-heading {
  margin-bottom: 0;
}

.admin-detail-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
}

.admin-detail-list dt {
  font-size: 11px;
}

.admin-detail-list dd {
  font-size: 12px;
}

.admin-form {
  border-top: 1px solid #eeecea;
  padding-top: 20px;
}

.admin-card-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 600px) {
  .admin-detail-list,
  .admin-card-actions {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
