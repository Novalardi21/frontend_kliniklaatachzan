import { requireSameOrigin } from '../utils/auth-http'
import { database } from '../utils/database'
import { BookingError, savePublicBooking } from '../utils/public-booking'
import { deliverBookingWhatsApp } from '../utils/whatsapp-delivery'

export default defineEventHandler(async (event) => {
  requireSameOrigin(event)
  const payload = await readBody(event)
  try {
    const pool = database()
    const config = useRuntimeConfig()
    const receipt = await savePublicBooking(
      pool,
      payload,
      config.bookingStaffPhone
    )
    await deliverBookingWhatsApp(
      pool,
      receipt.code,
      config.whatsapp,
      config.bookingStaffPhone
    ).catch(() => {
      console.error('Status notifikasi booking tidak dapat diproses.')
    })
    return receipt
  } catch (error) {
    if (error instanceof BookingError)
      throw createError({
        statusCode: error.status,
        data: { message: error.message }
      })
    throw createError({
      statusCode: 503,
      data: { message: 'Pengajuan belum dapat diproses. Silakan coba lagi.' }
    })
  }
})
