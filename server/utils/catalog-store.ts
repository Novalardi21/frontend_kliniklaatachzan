import type { Pool } from 'pg'
import type { PublicCatalog } from '../../shared/types/catalog.ts'

// Explicit public fields only. No staff, history, patients, or availability data.
export async function readCatalog(pool: Pool): Promise<PublicCatalog> {
  const db = await pool.connect()
  try {
    await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    const packages
      = await db.query(`SELECT p.id,p.name,p.description,p.method_id AS "methodId",p.price::float8,p.duration,p.benefits
      FROM clinic.packages p JOIN clinic.methods m ON m.id=p.method_id
      WHERE p.active AND m.active ORDER BY p.price,p.id`)
    const methods = await db.query(
      'SELECT id,name,description FROM clinic.methods WHERE active ORDER BY name,id'
    )
    const providers = await db.query(
      'SELECT id::text,full_name AS name,role,description,image FROM clinic.providers WHERE active ORDER BY full_name,id'
    )
    const sessions
      = await db.query(`SELECT id,name,CASE WHEN starts_at IS NULL THEN 'Sesuai kesepakatan'
      ELSE to_char(starts_at,'HH24.MI') || '–' || to_char(ends_at,'HH24.MI') || ' WIB' END AS time
      FROM clinic.service_sessions ORDER BY CASE id WHEN 'morning' THEN 1 WHEN 'afternoon' THEN 2 ELSE 3 END`)
    await db.query('COMMIT')
    return {
      packages: packages.rows.map((p, index) => ({
        ...p,
        label: `PAKET ${index + 1}`,
        duration: p.duration || 'Durasi dikonfirmasi klinik',
        icon: 'i-lucide-heart',
        featured: p.id === 'premium'
      })),
      methods: [
        {
          id: 'clinic',
          name: 'Konsultasikan dengan klinik',
          description: 'Konfirmasikan kesesuaian paket bersama tenaga medis.',
          icon: 'i-lucide-stethoscope'
        },
        ...methods.rows.map(m => ({ ...m, icon: 'i-lucide-heart-handshake' }))
      ],
      providers: providers.rows,
      sessions: sessions.rows.map(s => ({
        ...s,
        name: `Sesi ${s.name.toLowerCase()}`,
        description: 'Preferensi waktu; jadwal final dikonfirmasi klinik.',
        icon:
          s.id === 'morning'
            ? 'i-lucide-sun'
            : s.id === 'afternoon'
              ? 'i-lucide-sunset'
              : 'i-lucide-calendar-clock'
      }))
    }
  } catch (error) {
    await db.query('ROLLBACK')
    throw error
  } finally {
    db.release()
  }
}
