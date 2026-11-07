import { authCookie, noCache } from '../../utils/auth-http'
import { findSession } from '../../utils/auth-store'
import { database } from '../../utils/database'

export default defineEventHandler(async (event) => {
  noCache(event)
  const token = getCookie(event, authCookie)
  if (!token) throw createError({ statusCode: 401 })
  const pool = database()
  if (!(await findSession(pool, token))) throw createError({ statusCode: 401 })
  const query = getQuery(event)
  const selected =
    typeof query.selected === 'string' ? query.selected.slice(0, 64) : ''
  const search =
    typeof query.search === 'string'
      ? query.search.trim().toLowerCase().slice(0, 100)
      : ''
  const limit = query.compact === 'true' ? 6 : 100
  const result = await pool.query<{
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
    notifications: {
      audience: string
      status: string
      error: string | null
      hasRecipient: boolean
    }[]
  }>(
    `
    SELECT b.registration_code AS code, b.service_date::text AS date,
           s.name AS session, c.full_name AS guardian, c.whatsapp AS phone, b.status,
           b.updated_at::text AS version, c.address, b.identity_verified AS verified,
           b.provider_id::text AS "providerId", b.session_id AS "sessionId",
           b.proposed_date::text AS "proposedDate", b.proposed_session_id AS "proposedSessionId",
           ARRAY(SELECT ch.full_name FROM clinic.booking_children bc
                 JOIN clinic.children ch ON ch.id=bc.child_id
                 WHERE bc.booking_id=b.id ORDER BY ch.id) AS children,
           coalesce((SELECT json_agg(json_build_object(
             'audience', CASE n.template_id WHEN 'booking-staff' THEN 'Petugas' WHEN 'booking-guardian' THEN 'Wali' ELSE 'Wali · ' || n.template_id END,
             'status', n.status, 'error', n.last_error,
             'hasRecipient', n.recipient_phone IS NOT NULL
           ) ORDER BY n.id) FROM clinic.notifications n WHERE n.booking_id=b.id
             AND n.template_id IN ('booking-guardian','booking-staff','confirmed','reschedule','rejected')), '[]'::json) AS notifications
    FROM clinic.bookings b JOIN clinic.customers c ON c.id=b.customer_id
    JOIN clinic.service_sessions s ON s.id=b.session_id
    WHERE (($1::text <> '' AND b.registration_code=$1)
           OR ($1='' AND b.request_key IS NOT NULL))
      AND ($2::text='' OR strpos(lower(concat_ws(' ', b.registration_code, c.full_name, c.whatsapp)), $2)>0
           OR EXISTS (SELECT 1 FROM clinic.booking_children bc JOIN clinic.children ch ON ch.id=bc.child_id
                      WHERE bc.booking_id=b.id AND strpos(lower(ch.full_name), $2)>0))
    ORDER BY b.created_at DESC, b.id DESC LIMIT $3
  `,
    [selected, search, limit]
  )
  return result.rows
})
