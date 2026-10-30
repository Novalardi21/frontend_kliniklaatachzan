export interface BookingChild {
  id: number
  name: string
  nik: string
  birthPlace: string
  birthDate: string
  gender: string
  guardian: string
  healthNotes: string
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
    description:
      'Tim medis membantu menentukan metode yang sesuai dengan kondisi anak.',
    icon: 'i-lucide-stethoscope'
  },
  {
    id: 'sealer',
    name: 'Metode Lem / Sealer',
    description:
      'Contoh pilihan metode. Kesesuaian tindakan dikonfirmasi tenaga medis.',
    icon: 'i-lucide-droplet'
  },
  {
    id: 'clamp',
    name: 'Metode Klem / Cincin',
    description:
      'Contoh pilihan metode klem modern untuk didiskusikan bersama klinik.',
    icon: 'i-lucide-circle-dot'
  },
  {
    id: 'cauter',
    name: 'Metode Cauter',
    description:
      'Contoh pilihan metode cauter berdasarkan penilaian tenaga medis.',
    icon: 'i-lucide-zap'
  }
]

export const createBookingChild = (
  id: number,
  packageId = 'premium'
): BookingChild => ({
  id,
  name: '',
  nik: '',
  birthPlace: '',
  birthDate: '',
  gender: 'Laki-laki',
  guardian: '',
  healthNotes: '',
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
