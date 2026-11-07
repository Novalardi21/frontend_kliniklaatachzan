import { revokeSession } from '../../utils/auth-store'
import { authCookie, requireSameOrigin } from '../../utils/auth-http'
import { database } from '../../utils/database'
export default defineEventHandler(async (event) => {
  requireSameOrigin(event)
  const token = getCookie(event, authCookie)
  if (token) {
    try {
      await revokeSession(database(), token)
    } catch {
      throw createError({
        statusCode: 503,
        statusMessage: 'Belum dapat keluar. Coba kembali.'
      })
    }
  }
  deleteCookie(event, authCookie, { path: '/' })
  deleteCookie(event, 'laatachzan-preview-role', { path: '/' })
  return { ok: true }
})
