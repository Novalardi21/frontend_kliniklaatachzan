export interface BookingChild {
  id: number
  name: string
  birthPlace: string
  birthDate: string
  gender: string
  guardian: string
  packageId: string
  methodId: string
}

export interface BookingDraft {
  children: BookingChild[]
  customer: {
    name: string
    whatsapp: string
    address: string
    locationNotes: string
  }
  provider: string
  date: string
  session: string
  flexibleNotes: string
  notes: string
  consent: boolean
}

export const bookingStages = [
  'Jumlah Pasien',
  'Data Pasien & KIA',
  'Paket & Metode',
  'Tenaga Medis',
  'Jadwal & Sesi',
  'Review & Kirim'
]

export const methods = [
  {
    id: 'clinic',
    name: 'Konsultasikan dengan klinik',
    description: 'Konfirmasikan kesesuaian paket bersama tenaga medis.',
    icon: 'i-lucide-stethoscope'
  },
  {
    id: 'needle-stitches',
    name: 'Bius Jarum & Jahitan',
    description: 'Spesifikasi tindakan sesuai paket 1.',
    icon: 'i-lucide-heart'
  },
  {
    id: 'needle-no-stitches',
    name: 'Bius Jarum & Tanpa Jahitan',
    description: 'Spesifikasi tindakan sesuai paket 2.',
    icon: 'i-lucide-sparkles'
  },
  {
    id: 'spray-no-stitches',
    name: 'Bius Semprot (Tanpa Jarum) & Tanpa Jahitan',
    description: 'Spesifikasi tindakan sesuai paket 3.',
    icon: 'i-lucide-wind'
  }
]

export const createBookingChild = (
  id: number,
  packageId = ''
): BookingChild => ({
  id,
  name: '',
  birthPlace: '',
  birthDate: '',
  gender: 'Laki-laki',
  guardian: '',
  packageId,
  methodId: 'clinic'
})

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function formatRegistration(date: string, sequence: number) {
  const parsed = new Date(`${date}T12:00:00`)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    localDate(parsed) !== date
  ) {
    throw new Error('Tanggal reservasi tidak valid.')
  }
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 9999) {
    throw new Error('Nomor urut demo untuk tanggal ini sudah mencapai batas.')
  }
  return `KHT-${date.replaceAll('-', '')}-${String(sequence).padStart(4, '0')}`
}

export function displayDate(value: string) {
  return value
    ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(
        new Date(`${value}T12:00:00`)
      )
    : 'Belum dipilih'
}

export function childAge(value: string, reference = localDate()) {
  if (!value || value > reference) return 'Usia otomatis'
  const birth = new Date(`${value}T12:00:00`)
  const today = new Date(`${reference}T12:00:00`)
  let months =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    today.getMonth() -
    birth.getMonth()
  if (today.getDate() < birth.getDate()) months--
  return `${Math.floor(months / 12)} thn ${months % 12} bln`
}
