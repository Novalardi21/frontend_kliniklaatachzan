import type { H3Event } from 'h3'
import { authCookie, noCache, requireSameOrigin } from './auth-http'
import { findSession } from './auth-store'
import { database } from './database'
import { MasterError } from './master-store'

export async function masterRequest<T>(
  event: H3Event,
  write: boolean,
  fn: (
    pool: ReturnType<typeof database>,
    actor: NonNullable<Awaited<ReturnType<typeof findSession>>>
  ) => Promise<T>
) {
  noCache(event)
  if (write) requireSameOrigin(event)
  const token = getCookie(event, authCookie)
  if (!token)
    throw createError({
      statusCode: 401,
      statusMessage: 'Silakan masuk sebagai admin.'
    })
  try {
    const pool = database()
    const user = await findSession(pool, token)
    if (!user || user.role !== 'admin')
      throw new MasterError(401, 'Sesi berakhir. Silakan masuk kembali.')
    return await fn(pool, user)
  } catch (error) {
    if (error instanceof MasterError)
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.message
      })
    const code = (error as { code?: string }).code
    if (code === '23505')
      throw createError({
        statusCode: 409,
        statusMessage: 'Nama atau kode sudah digunakan.'
      })
    if (code === '23503')
      throw createError({
        statusCode: 409,
        statusMessage:
          'Data terkait sudah digunakan pada reservasi. Buat data baru untuk mengubah relasinya.'
      })
    throw createError({
      statusCode: 503,
      statusMessage:
        'Master data belum dapat diakses. Periksa koneksi PostgreSQL dan migrasi 006.'
    })
  }
}
