import { requireSameOrigin } from '../../utils/auth-http'
import { requireClinicAdmin } from '../../utils/require-clinic-admin'

export default defineEventHandler(async (event) => {
  requireSameOrigin(event)
  const { pool } = await requireClinicAdmin(event)
  const capacities: unknown = await readBody(event)
  if (!capacities || typeof capacities !== 'object' || Array.isArray(capacities))
    throw createError({ statusCode: 400 })
  const entries = Object.entries(capacities)
  if (!entries.length || entries.some(([, value]) =>
    typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 100
  ))
    throw createError({ statusCode: 400, data: { message: 'Isi kapasitas antara 1 dan 100 anak.' } })

  const db = await pool.connect()
  try {
    await db.query('BEGIN')
    await db.query("SELECT pg_advisory_xact_lock(hashtext('clinic.booking-review.capacity'))")
    const ids = entries.map(([id]) => id)
    const { rows } = await db.query<{ id: string }>(
      'SELECT id FROM clinic.service_sessions WHERE id=ANY($1::text[]) FOR UPDATE',
      [ids]
    )
    if (rows.length !== ids.length)
      throw createError({ statusCode: 400, data: { message: 'Sesi layanan tidak valid.' } })

    for (const [id, capacity] of entries) {
      const { rowCount } = await db.query(
        `SELECT 1 FROM clinic.bookings b
         JOIN clinic.booking_children bc ON bc.booking_id=b.id
         WHERE b.session_id=$1 AND b.status IN ('confirmed','completed')
           AND b.service_date >= (now() AT TIME ZONE 'Asia/Jakarta')::date
         GROUP BY b.service_date HAVING count(*) > $2::int LIMIT 1`,
        [id, capacity]
      )
      if (rowCount)
        throw createError({ statusCode: 409, data: { message: 'Kapasitas lebih kecil dari jumlah anak yang sudah terjadwal.' } })
      await db.query('UPDATE clinic.service_sessions SET capacity=$2 WHERE id=$1', [id, capacity])
    }
    await db.query('COMMIT')
    return { saved: true }
  } catch (error) {
    await db.query('ROLLBACK')
    throw error
  } finally {
    db.release()
  }
})
