import type { Pool } from 'pg'

export interface WhatsAppConfig {
  provider: string
  fonnteToken: string
  accessToken: string
  phoneNumberId: string
  graphVersion: string
  guardianTemplate: string
  staffTemplate: string
  language: string
}

export function whatsappConfigured(config: WhatsAppConfig) {
  if (config.provider === 'fonnte') return Boolean(config.fonnteToken.trim())
  return (
    config.provider === 'meta' &&
    Boolean(config.accessToken.trim()) &&
    /^\d+$/.test(config.phoneNumberId) &&
    /^v\d+\.\d+$/.test(config.graphVersion) &&
    /^[a-z0-9_]+$/.test(config.guardianTemplate) &&
    /^[a-z0-9_]+$/.test(config.staffTemplate) &&
    /^[a-z]{2}(?:_[A-Z]{2})?$/.test(config.language)
  )
}

interface MessageRow {
  id: string
  recipient_phone: string
  template_id: string
  service_date: string
  session_name: string
  body: string
}

async function sendFonnte(
  row: MessageRow,
  token: string,
  transport: typeof fetch
) {
  const response = await transport('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { Authorization: token.trim() },
    signal: AbortSignal.timeout(7000),
    body: new URLSearchParams({
      target: row.recipient_phone,
      message: row.body,
      countryCode: '0',
      connectOnly: 'true'
    })
  })
  const result = (await response.json().catch(() => null)) as {
    status?: boolean
    id?: (string | number)[]
  } | null
  const id = Array.isArray(result?.id) ? result.id[0] : undefined
  if (
    response.ok &&
    result?.status === true &&
    (typeof id === 'string' || typeof id === 'number')
  ) {
    return { providerId: String(id) }
  }
  return {
    failure: `Fonnte menolak pesan (HTTP ${response.status}). Periksa token, koneksi Device, dan kuota.`
  }
}

export async function deliverBookingWhatsApp(
  pool: Pool,
  code: string,
  config: WhatsAppConfig,
  staffPhone: string,
  transport: typeof fetch = fetch
) {
  if (!whatsappConfigured(config)) return
  const staffRecipient = /^62\d{8,13}$/.test(staffPhone) ? staffPhone : null
  // Claim before calling the gateway to prevent duplicate sends.
  const { rows } = await pool.query<MessageRow>(
    `
    UPDATE clinic.notifications n
    SET status='sending', attempts=n.attempts+1,
        recipient_phone=coalesce(n.recipient_phone,$2::varchar), last_error=NULL
    FROM clinic.bookings b JOIN clinic.service_sessions s ON s.id=b.session_id
    WHERE n.booking_id=b.id AND b.registration_code=$1 AND n.status='queued'
      AND n.template_id IN ('booking-guardian','booking-staff')
      AND (n.recipient_phone IS NOT NULL OR (n.template_id='booking-staff' AND $2::varchar IS NOT NULL))
    RETURNING n.id,n.recipient_phone,n.template_id,n.body,b.registration_date::text AS service_date,s.name AS session_name
  `,
    [code, staffRecipient]
  )
  await Promise.all(
    rows.map(async (row) => {
      let providerId: string | undefined
      let failure: string | undefined
      try {
        if (config.provider === 'fonnte') {
          const result = await sendFonnte(row, config.fonnteToken, transport)
          providerId = result.providerId
          failure = result.failure
        } else {
          const response = await transport(
            `https://graph.facebook.com/${config.graphVersion}/${config.phoneNumberId}/messages`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${config.accessToken}`,
                'Content-Type': 'application/json'
              },
              signal: AbortSignal.timeout(7000),
              body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: row.recipient_phone,
                type: 'template',
                template: {
                  name:
                    row.template_id === 'booking-guardian'
                      ? config.guardianTemplate
                      : config.staffTemplate,
                  language: { code: config.language },
                  components: [
                    {
                      type: 'body',
                      parameters: [
                        code,
                        row.service_date,
                        row.session_name
                      ].map((text) => ({ type: 'text', text }))
                    }
                  ]
                }
              })
            }
          )
          const result = (await response.json().catch(() => null)) as {
            messages?: { id?: string }[]
            error?: { code?: number }
          } | null
          if (response.ok && typeof result?.messages?.[0]?.id === 'string')
            providerId = result.messages[0].id
          else
            failure = `Meta HTTP ${response.status}${Number.isInteger(result?.error?.code) ? ` (kode ${result?.error?.code})` : ''}`
        }
      } catch {
        // The gateway may have accepted the message before the timeout.
        failure =
          'Koneksi gateway gagal atau habis waktu. Status pengiriman perlu diperiksa.'
      }
      await pool.query(
        `
      UPDATE clinic.notifications SET status=$2, provider_message_id=$3, last_error=$4,
        sent_at=CASE WHEN $2='sent' THEN now() ELSE NULL END
      WHERE id=$1 AND status='sending'
    `,
        [
          row.id,
          providerId ? 'sent' : 'failed',
          providerId ?? null,
          failure ?? null
        ]
      )
    })
  )
}
