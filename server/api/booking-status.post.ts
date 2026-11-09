import { noCache } from '../utils/auth-http'
import { tokenHash } from '../utils/auth-store'
import { database } from '../utils/database'

export default defineEventHandler(async (event) => {
  noCache(event)
  const input = await readBody(event)
  const code = typeof input?.code === 'string' ? input.code.trim().toUpperCase() : ''
  const phone = typeof input?.phone === 'string' ? input.phone.replace(/[\s()-]/g, '') : ''
  if (!/^KHT-\d{8}-\d{4}$/.test(code) || !/^(?:\+62|62|0)8\d{8,11}$/.test(phone))
    throw createError({ statusCode: 400, data: { message: 'Periksa format kode registrasi dan nomor WhatsApp.' } })

  const pool = database()
  const key = tokenHash(`booking-status:${getRequestIP(event) ?? 'unknown'}`)
  const { rows: [attempt] } = await pool.query<{ attempts: number }>(
    `INSERT INTO clinic.login_attempts(key_hash, attempts) VALUES ($1, 1)
     ON CONFLICT (key_hash) DO UPDATE SET
       attempts = CASE WHEN clinic.login_attempts.window_started_at < now() - interval '15 minutes'
         THEN 1 ELSE least(clinic.login_attempts.attempts + 1, 31) END,
       window_started_at = CASE WHEN clinic.login_attempts.window_started_at < now() - interval '15 minutes'
         THEN now() ELSE clinic.login_attempts.window_started_at END
     RETURNING attempts`,
    [key]
  )
  if (attempt!.attempts > 30)
    throw createError({ statusCode: 429, data: { message: 'Terlalu banyak pencarian. Coba lagi dalam beberapa menit.' } })

  const normalizedPhone = phone.replace(/^0/, '62').replace(/^\+/, '')
  const { rows: [booking] } = await pool.query<{
    status: 'pending' | 'confirmed' | 'reschedule' | 'completed' | 'rejected'
    date: string | null
    session: string | null
  }>(
    `SELECT b.status,
            CASE WHEN b.status='reschedule' THEN b.proposed_date
                 WHEN b.status <> 'rejected' THEN b.service_date END::text AS date,
            s.name AS session
     FROM clinic.bookings b
     JOIN clinic.customers c ON c.id=b.customer_id
     LEFT JOIN clinic.service_sessions s ON s.id=CASE
       WHEN b.status='reschedule' THEN b.proposed_session_id
       WHEN b.status <> 'rejected' THEN b.session_id END
     WHERE b.registration_code=$1
       AND c.whatsapp IN ($2::text, '+' || $2::text, '0' || substr($2::text, 3))`,
    [code, normalizedPhone]
  )
  if (!booking)
    throw createError({ statusCode: 404, data: { message: 'Kode registrasi dan nomor WhatsApp tidak cocok dengan booking yang tersimpan.' } })
  return booking
})
