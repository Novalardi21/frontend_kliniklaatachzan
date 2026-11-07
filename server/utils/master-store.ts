import { randomUUID } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'
import type {
  MasterKind,
  MasterRecord,
  MasterSnapshot
} from '../../shared/types/master.ts'

export class MasterError extends Error {
  statusCode: number
  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}
type Actor = { id: number, name: string }
type DB = Pool | PoolClient
const tables = {
  packages: 'clinic.packages',
  methods: 'clinic.methods',
  providers: 'clinic.providers'
} as const
function text(value: unknown, name: string, max: number, required = true) {
  if (
    typeof value !== 'string'
    || value.trim().length > max
    || (required && !value.trim())
  )
    throw new MasterError(
      400,
      `${name} tidak valid (maksimal ${max} karakter).`
    )
  return value.trim()
}
function integer(value: unknown, name: string, max: number) {
  if (
    typeof value !== 'number'
    || !Number.isSafeInteger(value)
    || value < 1
    || value > max
  )
    throw new MasterError(
      400,
      `${name} harus bilangan bulat antara 1 dan ${max}.`
    )
  return value
}
export function validateMaster(kind: MasterKind, input: unknown): MasterRecord {
  if (
    !Object.hasOwn(tables, kind)
    || !input
    || typeof input !== 'object'
    || Array.isArray(input)
  )
    throw new MasterError(400, 'Jenis atau data master tidak valid.')
  const v = input as Record<string, unknown>
  if (typeof v.active !== 'boolean')
    throw new MasterError(400, 'Status aktif tidak valid.')
  const item: MasterRecord = {
    id: '',
    name: text(v.name, 'Nama', 100),
    description: text(v.description, 'Deskripsi', 500, false),
    price: 0,
    duration: '',
    benefits: [],
    active: v.active
  }
  if (v.id !== undefined && v.id !== '') {
    item.id = text(v.id, 'ID', 100)
    if (
      kind === 'providers'
        ? !/^[1-9]\d{0,17}$/.test(item.id)
        : !/^[a-zA-Z0-9_-]+$/.test(item.id)
    )
      throw new MasterError(400, 'ID tidak valid.')
  }
  if (kind === 'packages') {
    item.price = integer(v.price, 'Tarif', 99999999999999)
    item.duration = text(v.duration, 'Durasi', 60, false)
    item.methodId = text(v.methodId, 'Metode paket', 100)
    if (!Array.isArray(v.benefits) || v.benefits.length > 30)
      throw new MasterError(400, 'Benefit tidak valid.')
    item.benefits = v.benefits.map(b => text(b, 'Benefit', 300))
    if (item.benefits.join('\n').length > 1500)
      throw new MasterError(400, 'Benefit terlalu panjang.')
  }
  if (kind === 'methods') {
    if (
      !['needle', 'spray'].includes(String(v.anesthesia))
      || typeof v.usesStitches !== 'boolean'
    )
      throw new MasterError(
        400,
        'Jenis bius dan penggunaan jahitan wajib diisi.'
      )
    item.anesthesia = v.anesthesia as 'needle' | 'spray'
    item.usesStitches = v.usesStitches
  }
  if (kind === 'providers') {
    item.role = text(v.role, 'Peran', 100)
    item.capacity = integer(v.capacity, 'Kuota', 100)
    item.image = text(v.image ?? '/images/doctor-ridwan.jpg', 'Foto', 200)
    if (!/^\/images\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(item.image))
      throw new MasterError(400, 'Gunakan foto dari katalog gambar klinik.')
  }
  return item
}
export async function readMaster(db: DB): Promise<MasterSnapshot> {
  const packages = await db.query(
    `SELECT id,name,description,price::float8,duration,benefits,active,method_id AS "methodId" FROM clinic.packages ORDER BY price,id`
  )
  const methods = await db.query(
    `SELECT id,name,description,active,anesthesia,uses_stitches AS "usesStitches",0 AS price,'' AS duration,ARRAY[]::text[] AS benefits FROM clinic.methods ORDER BY name,id`
  )
  const providers = await db.query(
    `SELECT id::text,full_name AS name,description,role,daily_capacity AS capacity,image,active,0 AS price,'' AS duration,ARRAY[]::text[] AS benefits FROM clinic.providers ORDER BY full_name,id`
  )
  const sessions = await db.query(
    `SELECT id,name,capacity,CASE WHEN starts_at IS NULL THEN 'Sesuai kesepakatan' ELSE to_char(starts_at,'HH24.MI') || '–' || to_char(ends_at,'HH24.MI') || ' WIB' END AS time FROM clinic.service_sessions ORDER BY CASE id WHEN 'morning' THEN 1 WHEN 'afternoon' THEN 2 ELSE 3 END`
  )
  const history = await db.query(
    `SELECT id::text,name,CASE WHEN before_data IS NULL THEN 'Data baru ditambahkan.' ELSE 'Data diperbarui.' END AS detail,actor_name AS actor,created_at AS at FROM clinic.master_history ORDER BY id DESC LIMIT 100`
  )
  return {
    packages: packages.rows,
    methods: methods.rows,
    providers: providers.rows,
    sessions: sessions.rows,
    history: history.rows.map(row => ({ ...row, at: row.at.toISOString() }))
  }
}
async function transaction<T>(pool: Pool, fn: (db: PoolClient) => Promise<T>) {
  const db = await pool.connect()
  try {
    await db.query('BEGIN')
    await db.query('SELECT pg_advisory_xact_lock(hashtext(\'clinic.master\'))')
    const result = await fn(db)
    await db.query('COMMIT')
    return result
  } catch (error) {
    await db.query('ROLLBACK')
    throw error
  } finally {
    db.release()
  }
}
async function audit(
  db: PoolClient,
  kind: string,
  id: string,
  name: string,
  actor: Actor,
  before: unknown,
  after: unknown
) {
  await db.query(
    `INSERT INTO clinic.master_history(kind,record_id,name,actor_id,actor_name,before_data,after_data) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      kind,
      id,
      name,
      actor.id,
      actor.name,
      before ? JSON.stringify(before) : null,
      JSON.stringify(after)
    ]
  )
}
export async function saveMaster(
  pool: Pool,
  kind: MasterKind,
  input: unknown,
  actor: Actor
) {
  const item = validateMaster(kind, input)
  return transaction(pool, async (db) => {
    const previous = item.id
      ? (
          await db.query(
            `SELECT * FROM ${tables[kind]} WHERE id=$1 FOR UPDATE`,
            [item.id]
          )
        ).rows[0]
      : null
    if (item.id && !previous)
      throw new MasterError(404, 'Data tidak ditemukan. Muat ulang halaman.')
    if (kind === 'packages') {
      const method = (
        await db.query(
          'SELECT active FROM clinic.methods WHERE id=$1 FOR SHARE',
          [item.methodId]
        )
      ).rows[0]
      if (!method) throw new MasterError(400, 'Metode paket tidak ditemukan.')
      if (item.active && !method.active)
        throw new MasterError(
          400,
          'Paket aktif harus menggunakan metode yang aktif.'
        )
      item.id ||= `pkg-${randomUUID()}`
      await db.query(
        `INSERT INTO clinic.packages(id,name,description,price,duration,benefits,active,method_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,price=EXCLUDED.price,duration=EXCLUDED.duration,benefits=EXCLUDED.benefits,active=EXCLUDED.active,method_id=EXCLUDED.method_id`,
        [
          item.id,
          item.name,
          item.description,
          item.price,
          item.duration,
          item.benefits,
          item.active,
          item.methodId
        ]
      )
    } else if (kind === 'methods') {
      if (
        !item.active
        && previous
        && (
          await db.query(
            'SELECT 1 FROM clinic.packages WHERE method_id=$1 AND active LIMIT 1',
            [item.id]
          )
        ).rowCount
      )
        throw new MasterError(
          409,
          'Nonaktifkan paket yang menggunakan metode ini terlebih dahulu.'
        )
      item.id ||= `method-${randomUUID()}`
      await db.query(
        `INSERT INTO clinic.methods(id,name,description,anesthesia,uses_stitches,active) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,anesthesia=EXCLUDED.anesthesia,uses_stitches=EXCLUDED.uses_stitches,active=EXCLUDED.active`,
        [
          item.id,
          item.name,
          item.description,
          item.anesthesia,
          item.usesStitches,
          item.active
        ]
      )
    } else if (previous) {
      await db.query(
        'UPDATE clinic.providers SET full_name=$2,description=$3,role=$4,daily_capacity=$5,image=$6,active=$7 WHERE id=$1',
        [
          item.id,
          item.name,
          item.description,
          item.role,
          item.capacity,
          item.image,
          item.active
        ]
      )
    } else {
      item.id = (
        await db.query(
          'INSERT INTO clinic.providers(full_name,description,role,daily_capacity,image,active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id::text',
          [
            item.name,
            item.description,
            item.role,
            item.capacity,
            item.image,
            item.active
          ]
        )
      ).rows[0].id
    }
    await audit(db, kind, item.id, item.name, actor, previous, item)
    return readMaster(db)
  })
}
export async function saveCapacity(pool: Pool, input: unknown, actor: Actor) {
  const ids = ['morning', 'afternoon', 'flexible'] as const
  if (!input || typeof input !== 'object' || Array.isArray(input))
    throw new MasterError(400, 'Kapasitas tidak valid.')
  const values = ids.map(id =>
    integer((input as Record<string, unknown>)[id], 'Kapasitas sesi', 100)
  )
  return transaction(pool, async (db) => {
    for (const [index, id] of ids.entries()) {
      const before = (
        await db.query(
          'SELECT * FROM clinic.service_sessions WHERE id=$1 FOR UPDATE',
          [id]
        )
      ).rows[0]
      if (!before)
        throw new MasterError(
          409,
          'Sesi layanan belum tersedia. Jalankan seed katalog.'
        )
      await db.query(
        'UPDATE clinic.service_sessions SET capacity=$2 WHERE id=$1',
        [id, values[index]]
      )
      await audit(db, 'sessions', id, `Sesi ${before.name}`, actor, before, {
        ...before,
        capacity: values[index]
      })
    }
    return readMaster(db)
  })
}
