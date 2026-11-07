import { relativeDate, type AdminState } from '~/data/admin'

export function getSheetRows(
  data: AdminState,
  name: string
): Record<string, unknown>[] {
  const customerId = (index: number) =>
    `CUS-${String(index + 1).padStart(4, '0')}`
  const patientRows = data.bookings.flatMap((booking, index) =>
    Array.from({ length: booking.count }, (_, child) => ({
      booking,
      child,
      customer: customerId(index),
      id: `CH-${String(index + 1).padStart(4, '0')}-${child + 1}`
    }))
  )
  switch (name) {
    case 'Customers':
      return data.bookings.map((booking, index) => ({
        customer_id: customerId(index),
        nama: booking.guardian,
        whatsapp: booking.phone,
        alamat: booking.address
      }))
    case 'Children':
      return patientRows.map(({ booking, child, customer, id }) => ({
        child_id: id,
        customer_id: customer,
        nama_sesuai_kia: child
          ? `Anak ${child + 1} keluarga ${booking.guardian} (Contoh)`
          : booking.patient,
        tanggal_lahir: `${Number(data.today.slice(0, 4)) - booking.age}-05-14`
      }))
    case 'Packages':
      return data.packages.map((item) => ({
        package_id: item.id,
        nama_paket: item.name,
        harga: item.price,
        benefit: item.benefits.join('; '),
        aktif: item.active
      }))
    case 'Methods':
      return data.methods.map((item) => ({
        method_id: item.id,
        nama_metode: item.name,
        aktif: item.active
      }))
    case 'Providers':
      return data.providers.map((item) => ({
        provider_id: item.id,
        nama: item.name,
        peran: item.role,
        aktif: item.active
      }))
    case 'Bookings':
      return data.bookings.map((item, index) => ({
        booking_id: item.id,
        kode_registrasi: item.id,
        customer_id: customerId(index),
        tanggal_diminta: item.date,
        sesi_diminta: item.session,
        status: item.status
      }))
    case 'BookingChildren':
      return patientRows.map(({ booking, id }) => ({
        booking_id: booking.id,
        child_id: id,
        package_id: booking.packageId,
        method_id:
          data.methods.find((item) => item.name === booking.method)?.id ?? ''
      }))
    case 'Payments':
      return data.payments.map((item) => ({
        payment_id: item.id,
        booking_id: item.bookingId,
        metode: item.method,
        jumlah: item.amount,
        status: 'Sudah Dibayar',
        paid_at: item.at
      }))
    case 'StatusHistory':
      return data.audit.map((item) => ({
        booking_id: item.bookingId,
        status_lama: item.from,
        status_baru: item.to,
        alasan: item.reason,
        actor: item.actor,
        timestamp: item.at
      }))
    case 'Availability':
      return data.providers.flatMap((provider) =>
        Array.from({ length: 7 }, (_, index) =>
          ['Pagi', 'Sore', 'Fleksibel'].map((session) => ({
            tanggal: relativeDate(data.today, index),
            sesi: session,
            provider_id: provider.id,
            kapasitas:
              session === 'Pagi'
                ? data.capacity.morning
                : session === 'Sore'
                  ? data.capacity.afternoon
                  : data.capacity.flexible,
            status: provider.active ? 'Aktif' : 'Nonaktif'
          }))
        ).flat()
      )
    default:
      return []
  }
}
