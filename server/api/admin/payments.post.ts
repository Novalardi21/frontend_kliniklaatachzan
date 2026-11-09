import type { AdminPayment } from '../../../app/data/admin'
import { requireSameOrigin } from '../../utils/auth-http'
import { requireClinicAdmin } from '../../utils/require-clinic-admin'

const methods = { Tunai: 'cash', QRIS: 'qris', Transfer: 'transfer' } as const

export default defineEventHandler(async (event) => {
  requireSameOrigin(event)
  const { pool, user } = await requireClinicAdmin(event)
  const input = await readBody(event)
  const code = input?.code
  const method = input?.method
  const received = input?.received
  if (typeof code !== 'string' || !code || code.length > 64 ||
      (method !== 'Tunai' && method !== 'QRIS' && method !== 'Transfer') ||
      (method === 'Tunai' &&
        (!Number.isSafeInteger(received) || received < 1 || received > 99_999_999_999_999)))
    throw createError({ statusCode: 400, data: { message: 'Periksa metode dan nominal pembayaran.' } })

  const { rows } = await pool.query<AdminPayment>(`
    WITH bill AS (
      SELECT b.id, b.registration_code, sum(bc.price_snapshot) AS amount
      FROM clinic.bookings b JOIN clinic.booking_children bc ON bc.booking_id=b.id
      WHERE b.registration_code=$1 AND b.status='completed'
      GROUP BY b.id
    ), saved AS (
      INSERT INTO clinic.payments(receipt_code, booking_id, method, amount, received, admin_user_id)
      SELECT 'KWT-' || id, id, $2, amount,
             CASE WHEN $2='cash' THEN $3::numeric ELSE amount END, $4
      FROM bill
      WHERE amount BETWEEN 1 AND 99999999999999 AND ($2 <> 'cash' OR $3::numeric >= amount)
      ON CONFLICT (booking_id) DO NOTHING
      RETURNING receipt_code, amount, received, change_amount, paid_at
    )
    SELECT receipt_code AS id, $1::text AS "bookingId", $5::text AS method,
           amount::float8, received::float8, change_amount::float8 AS change,
           paid_at AS at, $6::text AS actor FROM saved
  `, [code, methods[method as keyof typeof methods], method === 'Tunai' ? received : null, user.id, method, user.name])
  if (!rows[0])
    throw createError({
      statusCode: 409,
      data: { message: 'Tagihan belum dapat dibayar, uang tunai kurang, atau pembayaran sudah tercatat.' }
    })
  return rows[0]
})
