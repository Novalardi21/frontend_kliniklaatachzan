import { createHash } from 'node:crypto'
import type { Pool } from 'pg'

export class BookingError extends Error {
  readonly status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

function fields(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new BookingError('Isian pengajuan tidak valid.')
  return value as Record<string, unknown>
}

function field(value: unknown, max: number, optional = false) {
  if (optional && value == null) return ''
  if (
    typeof value !== 'string' ||
    value.includes('\0') ||
    value.length > max ||
    (!optional && !value.trim())
  ) {
    throw new BookingError('Periksa kembali isian wajib dan panjangnya.')
  }
  return value.trim()
}

function date(value: unknown) {
  const input = field(value, 10)
  const parsed = new Date(input)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input) ||
    !Number.isFinite(+parsed) ||
    parsed.toISOString().slice(0, 10) !== input
  ) {
    throw new BookingError('Tanggal tidak valid.')
  }
  return input
}

const sessionIds = new Map([
  ['Sesi pagi', 'morning'],
  ['Sesi sore', 'afternoon'],
  ['Sesi fleksibel', 'flexible']
])

export async function savePublicBooking(
  pool: Pool,
  input: unknown,
  staffPhone: string
) {
  const body = fields(input)
  const requestKey = field(body.requestKey, 36)
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      requestKey
    )
  )
    throw new BookingError('Kode permintaan tidak valid.')
  if (body.consent !== true)
    throw new BookingError('Persetujuan pengajuan wajib diisi.')
  const expectedTotal = body.expectedTotal
  if (
    typeof expectedTotal !== 'number' ||
    !Number.isSafeInteger(expectedTotal) ||
    expectedTotal < 0
  )
    throw new BookingError('Total biaya tidak valid.')
  const serviceDate = date(body.date)
  const today = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Jakarta'
  }).format(new Date())
  const sessionId = sessionIds.get(field(body.session, 80))
  if (!sessionId) throw new BookingError('Pilih sesi yang tersedia.')
  const provider = body.provider === 'clinic' ? null : field(body.provider, 18)
  if (provider && !/^[1-9]\d*$/.test(provider))
    throw new BookingError('Tenaga medis tidak valid.')
  const owner = fields(body.customer)
  const phone = field(owner.whatsapp, 16)
  if (!/^(?:\+62|62|0)8\d{8,11}$/.test(phone))
    throw new BookingError('Nomor WhatsApp tidak valid.')
  const customer = [
    field(owner.name, 100),
    phone.replace(/^0/, '62').replace(/^\+/, ''),
    field(owner.address, 1000),
    field(owner.locationNotes, 300, true)
  ]
  const flexible = field(body.flexibleNotes, 300, sessionId !== 'flexible')
  const notes = [
    sessionId === 'flexible' ? `Preferensi waktu: ${flexible}` : '',
    field(body.notes, 1000, true)
  ]
    .filter(Boolean)
    .join('\n')
  if (
    !Array.isArray(body.children) ||
    body.children.length < 1 ||
    body.children.length > 10
  )
    throw new BookingError('Jumlah anak harus antara 1 dan 10.')
  const children = body.children.map((value) => {
    const child = fields(value)
    if (child.gender !== 'Laki-laki' && child.gender !== 'Perempuan')
      throw new BookingError('Pilih jenis kelamin anak.')
    return {
      name: field(child.name, 100),
      place: field(child.birthPlace, 100),
      birthDate: date(child.birthDate),
      guardian: field(child.guardian, 100),
      gender: child.gender === 'Laki-laki' ? 'male' : 'female',
      packageId: field(child.packageId, 100),
      methodId: field(child.methodId, 100)
    }
  })
  const hash = createHash('sha256')
    .update(
      JSON.stringify({
        serviceDate,
        sessionId,
        provider,
        customer,
        notes,
        children,
        expectedTotal
      })
    )
    .digest('hex')
  const db = await pool.connect()
  try {
    await db.query('BEGIN')
    await db.query('SELECT pg_advisory_xact_lock(hashtext($1))', [requestKey])
    const existing = (
      await db.query(
        'SELECT registration_code, request_hash FROM clinic.bookings WHERE request_key=$1',
        [requestKey]
      )
    ).rows[0]
    if (existing) {
      if (existing.request_hash !== hash)
        throw new BookingError(
          'Isi pengajuan berbeda dari permintaan sebelumnya.',
          409
        )
      await db.query('COMMIT')
      return {
        code: String(existing.registration_code),
        date: serviceDate,
        total: expectedTotal
      }
    }
    if (
      serviceDate < today ||
      children.some(
        (child) => child.birthDate < '1900-01-01' || child.birthDate > today
      )
    )
      throw new BookingError('Periksa tanggal kunjungan dan tanggal lahir.')
    const session = (
      await db.query('SELECT name FROM clinic.service_sessions WHERE id=$1', [
        sessionId
      ])
    ).rows[0]
    if (!session) throw new BookingError('Sesi tidak tersedia.', 409)
    if (
      provider &&
      !(
        await db.query(
          'SELECT id FROM clinic.providers WHERE id=$1 AND active FOR SHARE',
          [provider]
        )
      ).rowCount
    )
      throw new BookingError('Tenaga medis tidak tersedia.', 409)
    const catalogue = await db.query(
      `
      SELECT p.id,p.name,p.price,p.method_id FROM clinic.packages p JOIN clinic.methods m ON m.id=p.method_id
      WHERE p.id=ANY($1::text[]) AND p.active AND m.active ORDER BY p.id FOR SHARE OF p,m
    `,
      [children.map((child) => child.packageId)]
    )
    const chosen = children.map((child) => {
      const item = catalogue.rows.find((row) => row.id === child.packageId)
      if (
        !item ||
        (child.methodId !== 'clinic' && child.methodId !== item.method_id)
      )
        throw new BookingError(
          'Pilihan paket atau metode berubah. Periksa kembali katalog.',
          409
        )
      return item
    })
    const total = chosen.reduce((sum, item) => sum + Number(item.price), 0)
    if (total !== expectedTotal)
      throw new BookingError(
        'Harga paket berubah. Periksa kembali ringkasan.',
        409
      )
    const ownerId = (
      await db.query(
        'INSERT INTO clinic.customers(full_name,whatsapp,address,location_notes) VALUES ($1,$2,$3,$4) RETURNING id',
        customer
      )
    ).rows[0].id
    const booking = (
      await db.query(
        `
      INSERT INTO clinic.bookings(customer_id,service_date,session_id,provider_id,notes,privacy_consent_at,request_key,request_hash)
      VALUES ($1,$2,$3,$4,$5,now(),$6,$7) RETURNING id,registration_code
    `,
        [ownerId, serviceDate, sessionId, provider, notes, requestKey, hash]
      )
    ).rows[0]
    for (const [index, child] of children.entries()) {
      const item = chosen[index]!
      const childId = (
        await db.query(
          `
        INSERT INTO clinic.children(customer_id,full_name,birth_place,birth_date,gender,guardian_name)
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING id
      `,
          [
            ownerId,
            child.name,
            child.place,
            child.birthDate,
            child.gender,
            child.guardian
          ]
        )
      ).rows[0].id
      await db.query(
        `
        INSERT INTO clinic.booking_children(booking_id,child_id,customer_id,package_id,method_id,package_name_snapshot,price_snapshot)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
        [
          booking.id,
          childId,
          ownerId,
          item.id,
          item.method_id,
          item.name,
          item.price
        ]
      )
    }
    await db.query(
      "INSERT INTO clinic.status_history(booking_id,next_status,reason) VALUES ($1,'pending','Pengajuan dari website')",
      [booking.id]
    )
    await db.query(
      `
      INSERT INTO clinic.notifications(booking_id,template_id,recipient_phone,body)
      SELECT $1,id,CASE WHEN id='booking-guardian' THEN $2 ELSE $3 END,
             replace(replace(replace(body,'{kode}',$4),'{tanggal}',$5),'{sesi}',$6)
      FROM clinic.message_templates WHERE id IN ('booking-guardian','booking-staff')
    `,
      [
        booking.id,
        customer[1],
        /^62\d{8,13}$/.test(staffPhone) ? staffPhone : null,
        booking.registration_code,
        serviceDate,
        session.name
      ]
    )
    await db.query('COMMIT')
    return { code: String(booking.registration_code), date: serviceDate, total }
  } catch (error) {
    await db.query('ROLLBACK')
    throw error
  } finally {
    db.release()
  }
}
