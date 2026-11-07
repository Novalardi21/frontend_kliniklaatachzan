import { authCookie, requireSameOrigin } from '../../utils/auth-http'
import { findSession } from '../../utils/auth-store'
import { database } from '../../utils/database'
import {
  deliverBookingWhatsApp,
  whatsappConfigured
} from '../../utils/whatsapp-delivery'

export default defineEventHandler(async (event) => {
  requireSameOrigin(event)
  const token = getCookie(event, authCookie)
  if (!token) throw createError({ statusCode: 401 })
  const pool = database()
  const user = await findSession(pool, token)
  if (!user || user.role !== 'admin') throw createError({ statusCode: 401 })
  const body = await readBody<{ code?: string }>(event)
  if (typeof body?.code !== 'string' || !/^KHT-\d{8}-\d{4}$/.test(body.code))
    throw createError({ statusCode: 400 })
  const config = useRuntimeConfig()
  if (!whatsappConfigured(config.whatsapp))
    throw createError({
      statusCode: 503,
      data: {
        message: import.meta.dev
          ? 'Pengirim WhatsApp lokal belum dikonfigurasi. Periksa provider dan token di frontend/.env, lalu restart Nuxt.'
          : 'Konfigurasi pengirim WhatsApp di Railway belum lengkap.'
      }
    })
  await deliverBookingWhatsApp(
    pool,
    body.code,
    config.whatsapp,
    config.bookingStaffPhone
  )
  return { processed: true }
})
