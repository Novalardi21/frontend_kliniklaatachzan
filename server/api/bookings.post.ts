import { requireSameOrigin } from '../utils/auth-http'
import { database } from '../utils/database'
import { BookingError, savePublicBooking } from '../utils/public-booking'

export default defineEventHandler(async (event) => {
  requireSameOrigin(event)
  const payload = await readBody(event)
  try {
    return await savePublicBooking(
      database(),
      payload,
      useRuntimeConfig().bookingStaffPhone
    )
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
