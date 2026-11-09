import { requireSameOrigin } from '../../utils/auth-http'
import { requireClinicAdmin } from '../../utils/require-clinic-admin'

export default defineEventHandler(async (event) => {
  requireSameOrigin(event)
  const { pool, user } = await requireClinicAdmin(event)
  const { code } = (await readBody(event)) ?? {}
  if (typeof code !== 'string' || !code || code.length > 64)
    throw createError({ statusCode: 400 })

  const { rowCount } = await pool.query(`
    WITH completed AS (
      UPDATE clinic.bookings SET status='completed', updated_at=now()
      WHERE registration_code=$1 AND status='confirmed'
        AND service_date <= (now() AT TIME ZONE 'Asia/Jakarta')::date
      RETURNING id
    )
    INSERT INTO clinic.status_history(booking_id,previous_status,next_status,reason,admin_user_id)
    SELECT id,'confirmed','completed','Layanan ditandai selesai oleh petugas.', $2 FROM completed
  `, [code, user.id])
  if (!rowCount)
    throw createError({ statusCode: 409, data: { message: 'Layanan belum bisa ditandai selesai. Periksa tanggal dan status booking.' } })
  return { status: 'completed' }
})
