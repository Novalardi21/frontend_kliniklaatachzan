import {
  authenticate,
  LoginRejected,
  sessionSeconds
} from '../../utils/auth-store'
import { authCookie, requireSameOrigin } from '../../utils/auth-http'
import { database } from '../../utils/database'
export default defineEventHandler(async (event) => {
  requireSameOrigin(event)
  const body = await readBody(event)
  if (
    !body ||
    typeof body.email !== 'string' ||
    typeof body.password !== 'string' ||
    body.email.length > 254 ||
    body.password.length < 1 ||
    body.password.length > 128
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Isi email dan kata sandi yang valid.'
    })
  }
  try {
    const { token, user } = await authenticate(
      database(),
      body.email,
      body.password,
      getRequestIP(event) ?? 'unknown'
    )
    setCookie(event, authCookie, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: useRuntimeConfig().authCookieSecure,
      path: '/',
      maxAge: sessionSeconds
    })
    deleteCookie(event, 'laatachzan-preview-role', { path: '/' })
    return { user }
  } catch (error) {
    if (error instanceof LoginRejected)
      throw createError({
        statusCode: error.statusCode,
        statusMessage: error.message
      })
    throw createError({
      statusCode: 503,
      statusMessage:
        'Layanan login belum tersedia. Periksa koneksi database dan setup akun.'
    })
  }
})
