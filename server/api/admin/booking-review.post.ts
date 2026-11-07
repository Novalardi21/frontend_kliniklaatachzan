import { requireSameOrigin } from '../../utils/auth-http'
import { requireClinicAdmin } from '../../utils/require-clinic-admin'
import { BookingError } from '../../utils/public-booking'
import { reviewBooking } from '../../utils/booking-review'
import { deliverBookingWhatsApp } from '../../utils/whatsapp-delivery'

export default defineEventHandler(async (event) => {
  requireSameOrigin(event)
  const { pool, user } = await requireClinicAdmin(event)
  const input = await readBody(event)
  if (typeof input?.code !== 'string' || !/^KHT-\d{8}-\d{4}$/.test(input.code))
    throw createError({ statusCode: 400 })
  try {
    const result = await reviewBooking(pool, input.code, input, user.id)
    const config = useRuntimeConfig()
    if (config.whatsapp.provider === 'fonnte') {
      await deliverBookingWhatsApp(
        pool,
        input.code,
        config.whatsapp,
        config.bookingStaffPhone,
        fetch,
        [result.status]
      ).catch(() =>
        console.error('Antrean notifikasi perubahan booking belum diproses.')
      )
    }
    return result
  } catch (error) {
    if (error instanceof BookingError)
      throw createError({
        statusCode: error.status,
        data: { message: error.message }
      })
    throw createError({
      statusCode: 503,
      data: {
        message: 'Perubahan booking gagal. Periksa koneksi dan migrasi 009.'
      }
    })
  }
})
