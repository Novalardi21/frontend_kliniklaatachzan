import { findSession } from '../../utils/auth-store'
import { authCookie, noCache } from '../../utils/auth-http'
import { database } from '../../utils/database'
export default defineEventHandler(async (event) => {
  noCache(event)
  const token = getCookie(event, authCookie)
  if (!token) return { user: null }
  try {
    return { user: await findSession(database(), token) }
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Sesi belum dapat diperiksa. Coba kembali.'
    })
  }
})
