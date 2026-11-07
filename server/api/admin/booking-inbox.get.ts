import { authCookie, noCache } from '../../utils/auth-http'
import { findSession } from '../../utils/auth-store'
import { database } from '../../utils/database'

export default defineEventHandler(async (event) => {
  noCache(event)
  const token = getCookie(event, authCookie)
  if (!token) throw createError({ statusCode: 401 })
  const pool = database()
  if (!(await findSession(pool, token))) throw createError({ statusCode: 401 })
  const result = await pool.query<{
    code: string
    date: string
    session: string
    guardian: string
    phone: string
    children: string[]
    status: string
    notifications: {
      audience: string
      status: string
      error: string | null
      hasRecipient: boolean
    }[]
  }>(`
    SELECT b.registration_code AS code, b.service_date::text AS date,
           s.name AS session, c.full_name AS guardian, c.whatsapp AS phone, b.status,
           ARRAY(SELECT ch.full_name FROM clinic.booking_children bc
                 JOIN clinic.children ch ON ch.id=bc.child_id
                 WHERE bc.booking_id=b.id ORDER BY ch.id) AS children,
           coalesce((SELECT json_agg(json_build_object(
             'audience', CASE WHEN n.template_id='booking-guardian' THEN 'Wali' ELSE 'Petugas' END,
             'status', n.status, 'error', n.last_error,
             'hasRecipient', n.recipient_phone IS NOT NULL
           ) ORDER BY n.id) FROM clinic.notifications n WHERE n.booking_id=b.id
             AND n.template_id IN ('booking-guardian','booking-staff')), '[]'::json) AS notifications
    FROM clinic.bookings b JOIN clinic.customers c ON c.id=b.customer_id
    JOIN clinic.service_sessions s ON s.id=b.session_id
    WHERE b.request_key IS NOT NULL
    ORDER BY b.created_at DESC, b.id DESC LIMIT 100
  `)
  return result.rows
})
