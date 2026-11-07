import { authCookie, noCache } from '../../utils/auth-http'
import { findSession } from '../../utils/auth-store'
import { database } from '../../utils/database'

interface DashboardSummary {
  today: string
  pending: number
  proposed: number
  scheduled: number
  patients: number
  revenue: string
  queued: number
  failed: number
  review: {
    code: string
    patient: string
    count: number
    date: string
    session: string
    provider: string
  }[]
}

export default defineEventHandler(async (event) => {
  noCache(event)
  const token = getCookie(event, authCookie)
  if (!token) throw createError({ statusCode: 401 })
  const pool = database()
  const user = await findSession(pool, token)
  if (!user || user.role !== 'admin') throw createError({ statusCode: 401 })
  const { rows } = await pool.query<DashboardSummary>(`
    WITH clinic_day AS (SELECT (now() AT TIME ZONE 'Asia/Jakarta')::date AS today),
    scheduled AS (
      SELECT b.id FROM clinic.bookings b, clinic_day d
      WHERE b.service_date=d.today AND b.status IN ('confirmed','completed')
    ),
    review AS (
      SELECT b.registration_code AS code, b.service_date::text AS date, s.name AS session,
             coalesce(p.full_name,'Ditentukan Klinik') AS provider,
             coalesce(k.patient,'Nama belum tersedia') AS patient, k.count,
             b.created_at, b.id
      FROM clinic.bookings b
      JOIN clinic.service_sessions s ON s.id=b.session_id
      LEFT JOIN clinic.providers p ON p.id=b.provider_id
      CROSS JOIN LATERAL (
        SELECT string_agg(c.full_name, ', ' ORDER BY c.id) AS patient, count(*)::int AS count
        FROM clinic.booking_children bc JOIN clinic.children c ON c.id=bc.child_id
        WHERE bc.booking_id=b.id
      ) k
      WHERE b.status='pending'
      ORDER BY b.created_at DESC, b.id DESC LIMIT 3
    )
    SELECT (SELECT today::text FROM clinic_day) AS today,
           (SELECT count(*)::int FROM clinic.bookings WHERE status='pending') AS pending,
           (SELECT count(*)::int FROM clinic.bookings WHERE status='reschedule') AS proposed,
           (SELECT count(*)::int FROM scheduled) AS scheduled,
           (SELECT count(*)::int FROM clinic.booking_children bc JOIN scheduled s ON s.id=bc.booking_id) AS patients,
           (SELECT coalesce(sum(amount),0)::text FROM clinic.payments) AS revenue,
           (SELECT count(*)::int FROM clinic.notifications WHERE status='queued') AS queued,
           (SELECT count(*)::int FROM clinic.notifications WHERE status='failed') AS failed,
           coalesce((SELECT json_agg(json_build_object(
             'code',code,'date',date,'session',session,'provider',provider,'patient',patient,'count',count
           ) ORDER BY created_at DESC,id DESC) FROM review),'[]'::json) AS review
  `)
  return rows[0]!
})
