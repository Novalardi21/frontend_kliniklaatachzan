import type { AdminPayment } from '../../../app/data/admin'
import { requireClinicAdmin } from '../../utils/require-clinic-admin'

export default defineEventHandler(async (event) => {
  const { pool } = await requireClinicAdmin(event)
  const { rows } = await pool.query<{
    id: string
    date: string
    patient: string
    guardian: string
    packages: string
    count: number
    amount: number
    status: string
    payment: AdminPayment | null
  }>(`
    SELECT b.registration_code AS id, b.service_date::text AS date,
           c.full_name AS guardian, b.status, k.patient, k.packages, k.count,
           coalesce(p.amount, k.amount)::float8 AS amount,
           CASE WHEN p.id IS NOT NULL THEN json_build_object(
             'id', p.receipt_code, 'bookingId', b.registration_code,
             'amount', p.amount, 'received', p.received, 'change', p.change_amount,
             'method', CASE p.method WHEN 'cash' THEN 'Tunai' WHEN 'qris' THEN 'QRIS' ELSE 'Transfer' END,
             'actor', coalesce(u.full_name, s.full_name), 'at', p.paid_at
           ) END AS payment
    FROM clinic.bookings b
    JOIN clinic.customers c ON c.id=b.customer_id
    LEFT JOIN clinic.payments p ON p.booking_id=b.id
    LEFT JOIN clinic.staff s ON s.id=p.recorded_by
    LEFT JOIN clinic.users u ON u.id=p.admin_user_id
    CROSS JOIN LATERAL (
      SELECT string_agg(ch.full_name, ', ' ORDER BY ch.id) AS patient,
             string_agg(DISTINCT bc.package_name_snapshot, ', ') AS packages,
             count(*)::int AS count, coalesce(sum(bc.price_snapshot),0) AS amount
      FROM clinic.booking_children bc JOIN clinic.children ch ON ch.id=bc.child_id
      WHERE bc.booking_id=b.id
    ) k
    WHERE b.status='completed' OR p.id IS NOT NULL
    ORDER BY p.paid_at DESC NULLS FIRST, b.service_date DESC, b.id DESC
  `)
  return rows
})
