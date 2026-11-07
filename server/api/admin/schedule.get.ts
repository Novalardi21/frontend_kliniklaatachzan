import type { AdminBooking } from '../../../app/data/admin'
import { requireClinicAdmin } from '../../utils/require-clinic-admin'

export default defineEventHandler(async (event) => {
  const { pool } = await requireClinicAdmin(event)
  const { start } = getQuery(event)
  if (
    typeof start !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !Number.isFinite(Date.parse(start)) ||
    new Date(start).toISOString().slice(0, 10) !== start ||
    start.startsWith('0000-')
  )
    throw createError({ statusCode: 400 })

  const [sessions, providers, bookings] = await Promise.all([
    pool.query<{ id: string; name: string; startTime: string | null; endTime: string | null; capacity: number }>(
      `SELECT id, name, to_char(starts_at, 'HH24:MI') AS "startTime",
              to_char(ends_at, 'HH24:MI') AS "endTime", capacity
       FROM clinic.service_sessions ORDER BY starts_at NULLS LAST, id`
    ),
    pool.query<{ id: string; name: string }>(
      'SELECT id::text, full_name AS name FROM clinic.providers ORDER BY full_name, id'
    ),
    pool.query<{
      code: string
      date: string
      sessionId: string
      status: AdminBooking['status']
      providerId: string | null
      children: string[]
    }>(
      `WITH scheduled AS (
         SELECT id, registration_code, status, provider_id,
                CASE WHEN status='reschedule' THEN proposed_date ELSE service_date END AS day,
                CASE WHEN status='reschedule' THEN proposed_session_id ELSE session_id END AS session_id
         FROM clinic.bookings WHERE status <> 'rejected'
       )
       SELECT b.registration_code AS code, b.day::text AS date,
              b.session_id AS "sessionId", b.status, b.provider_id::text AS "providerId",
              ARRAY(SELECT ch.full_name FROM clinic.booking_children bc
                    JOIN clinic.children ch ON ch.id=bc.child_id
                    WHERE bc.booking_id=b.id ORDER BY ch.id) AS children
       FROM scheduled b
       WHERE b.day >= $1::date AND b.day < $1::date + 7
       ORDER BY b.day, b.id`,
      [start]
    )
  ])
  return { sessions: sessions.rows, providers: providers.rows, bookings: bookings.rows }
})
