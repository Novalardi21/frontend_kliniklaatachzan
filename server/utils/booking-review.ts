import type { Pool } from 'pg'
import { BookingError } from './public-booking.ts'

interface ReviewInput {
  action?: string
  expectedStatus?: string
  expectedVersion?: string
  providerId?: string | null
  verified?: boolean
  date?: string
  sessionId?: string
  reason?: string
  guardianAccepted?: boolean
}

export async function reviewBooking(
  pool: Pool,
  code: string,
  input: ReviewInput,
  actorId: number
) {
  const action = input?.action
  if (action !== 'confirm' && action !== 'propose' && action !== 'reject')
    throw new BookingError('Aksi pengajuan tidak valid.')
  const reason = typeof input.reason === 'string' ? input.reason.trim() : ''
  if (reason.length > 500 || (action !== 'confirm' && !reason))
    throw new BookingError('Isi alasan perubahan, maksimal 500 karakter.')
  const provider = input.providerId ?? null
  if (
    provider !== null &&
    (typeof provider !== 'string' || !/^[1-9]\d{0,17}$/.test(provider))
  )
    throw new BookingError('Pilihan tenaga medis tidak valid.')
  const db = await pool.connect()
  try {
    await db.query('BEGIN')
    const booking = (
      await db.query(
        `
      SELECT b.id,b.status,b.updated_at::text AS version,b.service_date::text,b.session_id,b.proposed_date::text,
             b.proposed_session_id,b.identity_verified,c.full_name AS guardian,c.whatsapp,
             (SELECT count(*)::int FROM clinic.booking_children WHERE booking_id=b.id) AS patients,
             (now() AT TIME ZONE 'Asia/Jakarta')::date::text AS today
      FROM clinic.bookings b JOIN clinic.customers c ON c.id=b.customer_id
      WHERE b.registration_code=$1 FOR UPDATE OF b
    `,
        [code]
      )
    ).rows[0]
    if (!booking) throw new BookingError('Pengajuan tidak ditemukan.', 404)
    if (
      input.expectedStatus !== booking.status ||
      input.expectedVersion !== booking.version ||
      !['pending', 'reschedule'].includes(booking.status)
    )
      throw new BookingError(
        'Status pengajuan sudah berubah. Muat ulang dan tinjau kembali.',
        409
      )
    const next =
      action === 'confirm'
        ? 'confirmed'
        : action === 'propose'
          ? 'reschedule'
          : 'rejected'
    const useProposal = action === 'confirm' && booking.status === 'reschedule'
    const date =
      action === 'propose'
        ? input.date
        : useProposal
          ? booking.proposed_date
          : booking.service_date
    const sessionId =
      action === 'propose'
        ? input.sessionId
        : useProposal
          ? booking.proposed_session_id
          : booking.session_id
    let sessionName = ''
    if (action !== 'reject') {
      const parsed =
        typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
          ? new Date(date)
          : null
      if (
        !parsed ||
        !Number.isFinite(+parsed) ||
        parsed.toISOString().slice(0, 10) !== date ||
        date < booking.today
      )
        throw new BookingError('Pilih tanggal kunjungan mulai hari ini.')
      if (typeof sessionId !== 'string')
        throw new BookingError('Pilih sesi layanan.')
      if (action === 'confirm' && input.verified !== true)
        throw new BookingError(
          'Verifikasi identitas anak dan wali terlebih dahulu.'
        )
      if (useProposal && input.guardianAccepted !== true)
        throw new BookingError('Catat persetujuan wali atas jadwal usulan.')
      // Serialize decisions affecting capacity. Counts are read after obtaining the lock.
      await db.query(
        "SELECT pg_advisory_xact_lock(hashtext('clinic.booking-review.capacity'))"
      )
      const session = (
        await db.query(
          'SELECT name,capacity FROM clinic.service_sessions WHERE id=$1 FOR SHARE',
          [sessionId]
        )
      ).rows[0]
      if (!session) throw new BookingError('Sesi tidak tersedia.')
      sessionName = session.name
      const clinician = provider
        ? (
            await db.query(
              'SELECT daily_capacity FROM clinic.providers WHERE id=$1 AND active FOR SHARE',
              [provider]
            )
          ).rows[0]
        : null
      if (provider && !clinician)
        throw new BookingError('Tenaga medis tidak aktif.')
      if (action === 'confirm') {
        const {
          rows: [used]
        } = await db.query(
          `
          SELECT count(*) FILTER (WHERE b.session_id=$2)::int AS session,
                 count(*) FILTER (WHERE b.provider_id=$3)::int AS provider,
                 count(*) FILTER (WHERE b.provider_id=$3 AND b.session_id=$2)::int AS provider_session
          FROM clinic.bookings b JOIN clinic.booking_children bc ON bc.booking_id=b.id
          WHERE b.service_date=$1 AND b.status IN ('confirmed','completed')
        `,
          [date, sessionId, provider]
        )
        if (used.session + booking.patients > session.capacity)
          throw new BookingError(
            'Kuota sesi tidak cukup. Usulkan jadwal lain.',
            409
          )
        if (
          clinician &&
          used.provider + booking.patients > clinician.daily_capacity
        )
          throw new BookingError('Kuota harian tenaga medis tidak cukup.', 409)
        if (provider) {
          const availability = (
            await db.query(
              'SELECT capacity,active FROM clinic.availability WHERE service_date=$1 AND session_id=$2 AND provider_id=$3 FOR SHARE',
              [date, sessionId, provider]
            )
          ).rows[0]
          if (
            availability &&
            (!availability.active ||
              used.provider_session + booking.patients > availability.capacity)
          )
            throw new BookingError(
              'Tenaga medis tidak tersedia untuk kuota sesi tersebut.',
              409
            )
        }
      }
    }
    await db.query(
      `
      UPDATE clinic.bookings SET status=$2,
        identity_verified=CASE WHEN $2='confirmed' THEN true ELSE identity_verified END,
        provider_id=CASE WHEN $2='rejected' THEN provider_id ELSE $3 END,
        service_date=CASE WHEN $2='confirmed' THEN $4::date ELSE service_date END,
        session_id=CASE WHEN $2='confirmed' THEN $5 ELSE session_id END,
        proposed_date=CASE WHEN $2='reschedule' THEN $4::date END,
        proposed_session_id=CASE WHEN $2='reschedule' THEN $5 END,
        guardian_accepted_at=CASE WHEN $6 THEN now() ELSE guardian_accepted_at END,
        updated_at=now()
      WHERE id=$1
    `,
      [booking.id, next, provider, date, sessionId, useProposal]
    )
    await db.query(
      `
      INSERT INTO clinic.status_history(booking_id,previous_status,next_status,reason,admin_user_id)
      VALUES ($1,$2,$3,$4,$5)
    `,
      [
        booking.id,
        booking.status,
        next,
        reason || 'Verifikasi dan konfirmasi jadwal oleh petugas.',
        actorId
      ]
    )
    await db.query(
      `UPDATE clinic.notifications SET status='cancelled'
      WHERE booking_id=$1 AND status='queued' AND template_id IN ('booking-guardian','reschedule')`,
      [booking.id]
    )
    const template = (
      await db.query(
        'SELECT body FROM clinic.message_templates WHERE id=$1 AND active',
        [next]
      )
    ).rows[0]
    if (template) {
      const values: Record<string, string> = {
        nama_wali: booking.guardian,
        kode: code,
        tanggal: date,
        sesi: sessionName
      }
      const body = String(template.body).replace(
        /\{(nama_wali|kode|tanggal|sesi)\}/g,
        (_, key: string) => values[key]!
      )
      await db.query(
        'INSERT INTO clinic.notifications(booking_id,template_id,recipient_phone,body) VALUES ($1,$2,$3,$4)',
        [
          booking.id,
          next,
          String(booking.whatsapp).replace(/^0/, '62').replace(/^\+/, ''),
          body
        ]
      )
    }
    await db.query('COMMIT')
    return { status: next }
  } catch (error) {
    await db.query('ROLLBACK')
    throw error
  } finally {
    db.release()
  }
}
