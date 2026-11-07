import { packages, providers } from './landing'
import { localDate, methods } from './booking'

export type AdminRole = 'admin' | 'frontdesk' | 'operator'
export type ReservationStatus =
  'pending' | 'confirmed' | 'reschedule' | 'rejected' | 'completed'
export type PaymentMethod = 'Tunai' | 'QRIS' | 'Transfer'
export interface AdminBooking {
  id: string
  patient: string
  age: number
  guardian: string
  phone: string
  address: string
  count: number
  packageId: string
  method: string
  provider: string
  date: string
  session: string
  status: ReservationStatus
  amount: number
  paid: boolean
  verified: boolean
  notes: string
  proposedDate?: string
  proposedSession?: string
}
export interface AdminPayment {
  id: string
  bookingId: string
  amount: number
  method: PaymentMethod
  received: number
  change: number
  at: string
  actor: string
}
export interface AdminMessage {
  id: string
  bookingId: string
  recipient: string
  phone: string
  template: string
  text: string
  status: 'sent' | 'read' | 'queued' | 'failed'
  at: string
}
export interface AdminAudit {
  id: string
  bookingId: string
  from: string
  to: string
  reason: string
  actor: string
  at: string
}
export interface MasterItem {
  id: string
  name: string
  description: string
  price: number
  duration: string
  benefits: string[]
  active: boolean
  image?: string
  role?: string
  capacity?: number
}
export interface SyncLog {
  id: string
  at: string
  actor: string
  rows: number
  status: 'success' | 'error'
  detail: string
}
export interface MessageTemplate {
  id: string
  name: string
  content: string
}
export interface AdminState {
  today: string
  bookings: AdminBooking[]
  payments: AdminPayment[]
  messages: AdminMessage[]
  audit: AdminAudit[]
  packages: MasterItem[]
  methods: MasterItem[]
  providers: MasterItem[]
  capacity: { morning: number; afternoon: number; flexible: number }
  syncLogs: SyncLog[]
  lastSync: string
  templates: MessageTemplate[]
  gateway: { enabled: boolean; delay: number; phone: string }
}

export const roleLabels: Record<AdminRole, string> = {
  admin: 'Super Admin',
  frontdesk: 'Frontdesk',
  operator: 'Dokter Operator'
}
export const statusLabels: Record<ReservationStatus, string> = {
  pending: 'Menunggu Konfirmasi',
  confirmed: 'Terkonfirmasi',
  reschedule: 'Usulan Jadwal Baru',
  rejected: 'Ditolak',
  completed: 'Selesai'
}
export const messageLabels = {
  sent: 'Terkirim',
  read: 'Dibaca',
  queued: 'Dalam Antrean',
  failed: 'Gagal'
}
export const adminNavigation = [
  { label: 'Dashboard', to: '/admin', icon: 'i-lucide-layout-dashboard' },
  {
    label: 'Booking & Reservasi',
    to: '/admin/bookings',
    icon: 'i-lucide-calendar-check'
  },
  {
    label: 'Jadwal Layanan',
    to: '/admin/schedule',
    icon: 'i-lucide-calendar-days'
  },
  {
    label: 'Master Data',
    to: '/admin/master-data',
    icon: 'i-lucide-briefcase-medical'
  },
  {
    label: 'Pembayaran di Tempat',
    to: '/admin/payments',
    icon: 'i-lucide-banknote'
  },
  { label: 'Sinkronisasi Excel', to: '/admin/excel', icon: 'i-lucide-table-2' },
  {
    label: 'WhatsApp Notifikasi',
    to: '/admin/notifications',
    icon: 'i-lucide-messages-square'
  }
]

export const sheetSchema = [
  {
    name: 'Customers',
    description: 'Data wali, nomor WhatsApp, dan alamat.',
    columns: ['customer_id', 'nama', 'whatsapp', 'alamat']
  },
  {
    name: 'Children',
    description: 'Identitas anak dan relasi penanggung jawab.',
    columns: ['child_id', 'customer_id', 'nama_sesuai_kia', 'tanggal_lahir']
  },
  {
    name: 'Packages',
    description: 'Paket, tarif, dan benefit layanan.',
    columns: ['package_id', 'nama_paket', 'harga', 'benefit', 'aktif']
  },
  {
    name: 'Methods',
    description: 'Katalog metode khitan.',
    columns: ['method_id', 'nama_metode', 'aktif']
  },
  {
    name: 'Providers',
    description: 'Tenaga medis dan kuota praktik.',
    columns: ['provider_id', 'nama', 'peran', 'aktif']
  },
  {
    name: 'Bookings',
    description: 'Kode registrasi, jadwal, dan status.',
    columns: [
      'booking_id',
      'kode_registrasi',
      'customer_id',
      'tanggal_diminta',
      'sesi_diminta',
      'status'
    ]
  },
  {
    name: 'BookingChildren',
    description: 'Relasi anak, paket, dan metode per booking.',
    columns: ['booking_id', 'child_id', 'package_id', 'method_id']
  },
  {
    name: 'Payments',
    description: 'Pencatatan pembayaran di tempat.',
    columns: [
      'payment_id',
      'booking_id',
      'metode',
      'jumlah',
      'status',
      'paid_at'
    ]
  },
  {
    name: 'StatusHistory',
    description: 'Jejak perubahan status dan petugas.',
    columns: [
      'booking_id',
      'status_lama',
      'status_baru',
      'alasan',
      'actor',
      'timestamp'
    ]
  },
  {
    name: 'Availability',
    description: 'Tanggal, sesi, kapasitas, dan tenaga medis.',
    columns: ['tanggal', 'sesi', 'provider_id', 'kapasitas', 'status']
  }
]

export function relativeDate(base: string, offset: number) {
  const date = new Date(`${base}T12:00:00`)
  date.setDate(date.getDate() + offset)
  return localDate(date)
}
export function initials(name: string) {
  return name
    .replace(/^(dr\.|Ns\.)\s*/i, '')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
export function shortDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`))
}
export function dateTime(value: string) {
  return (
    new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    }).format(new Date(value)) + ' WIB'
  )
}
export function maskPhone(value: string) {
  return value.length > 6 ? value.slice(0, 4) + ' •••• ' + value.slice(-3) : '—'
}

export function createAdminState(): AdminState {
  const today = localDate()
  const names = [
    'Muhammad Rayyan Al-Fatih',
    'Arshaka Bayu Pratama',
    'Dzakwan Zayyan Malik',
    'Kenzo Danendra',
    'Alvaro Keenan',
    'Zhafran Al-Ayubi',
    'Fathan Bilal Mahesa',
    'Rafa Azka Putra',
    'Arka Bimasena',
    'Mikail Raditya',
    'Zain Al-Fath',
    'Raihan Aditya'
  ]
  const guardians = [
    'Farhan Pratama',
    'Bagus Santoso',
    'Dian Maulana',
    'Bambang Wicaksono',
    'Indra Gunawan',
    'Ahmad Ridwan',
    'Siti Nurlaila',
    'Doni Setiawan',
    'Rizky Prasetyo',
    'Ratna Kumala',
    'Fajar Ramadhan',
    'Maya Anggraini'
  ]
  const statuses: ReservationStatus[] = [
    'pending',
    'pending',
    'pending',
    'confirmed',
    'confirmed',
    'completed',
    'completed',
    'reschedule',
    'completed',
    'completed',
    'rejected',
    'confirmed'
  ]
  const bookings = names.map((patient, index): AdminBooking => {
    const date = relativeDate(today, index === 7 ? 1 : index > 9 ? 2 : 0)
    const pkg = packages[index % 3]!
    return {
      id: `KHT-${date.replaceAll('-', '')}-${String(index + 1).padStart(4, '0')}`,
      patient,
      age: 5 + (index % 6),
      guardian: guardians[index]!,
      phone: `081200000${String(index + 1).padStart(3, '0')}`,
      address: `Jl. Contoh No. ${index + 1}, Kelurahan Contoh, Kecamatan Contoh, Bandung 40111`,
      count: index === 1 ? 2 : 1,
      packageId: pkg.id,
      method: pkg.name,
      provider: providers[index % 2]!.name,
      date,
      session: index % 2 ? 'Sore' : 'Pagi',
      status: statuses[index]!,
      amount: pkg.price * (index === 1 ? 2 : 1),
      paid: index === 5 || index === 6,
      verified: index !== 1,
      notes:
        index === 1
          ? 'Identitas wali perlu ditinjau bersama keluarga.'
          : 'Data contoh untuk pratinjau operasional.'
    }
  })
  const at = new Date().toISOString()
  const templates = [
    {
      id: 'received',
      name: 'Pengajuan diterima',
      content:
        'Halo Bapak/Ibu {nama_wali}, pengajuan {kode} untuk tanggal {tanggal}, sesi {sesi}, sudah diterima. Status: Menunggu Konfirmasi Klinik. Jadwal final akan dikonfirmasi oleh tim klinik.'
    },
    {
      id: 'confirmed',
      name: 'Konfirmasi jadwal',
      content:
        'Halo Bapak/Ibu {nama_wali}, jadwal untuk booking {kode} telah dikonfirmasi pada {tanggal}, sesi {sesi}. Pembayaran dilakukan di tempat. Terima kasih.'
    },
    {
      id: 'reschedule',
      name: 'Usulan jadwal baru',
      content:
        'Halo Bapak/Ibu {nama_wali}, ada usulan penyesuaian jadwal untuk {kode} menjadi {tanggal}, sesi {sesi}. Mohon konfirmasi persetujuan Anda kepada klinik.'
    },
    {
      id: 'payment',
      name: 'Bukti pembayaran',
      content:
        'Halo Bapak/Ibu {nama_wali}, pembayaran di tempat untuk booking {kode} telah dicatat. Terima kasih atas kepercayaan keluarga kepada Klinik LaaTachzan.'
    }
  ]
  return {
    today,
    bookings,
    audit: [],
    payments: bookings
      .filter((item) => item.paid)
      .map((booking, index) => ({
        id: `KW-${today.replaceAll('-', '')}-${String(index + 1).padStart(4, '0')}`,
        bookingId: booking.id,
        amount: booking.amount,
        method: index ? 'QRIS' : 'Tunai',
        received: booking.amount,
        change: 0,
        at,
        actor: 'Admin Klinik'
      })),
    messages: bookings.slice(0, 6).map((booking, index) => ({
      id: `MSG-${index + 1}`,
      bookingId: booking.id,
      recipient: booking.guardian,
      phone: booking.phone,
      template: 'Pengajuan diterima',
      text: templates[0]!.content
        .replace('{nama_wali}', booking.guardian)
        .replace('{kode}', booking.id)
        .replace('{tanggal}', shortDate(booking.date))
        .replace('{sesi}', booking.session),
      status:
        index === 5
          ? 'failed'
          : index === 4
            ? 'queued'
            : index % 2
              ? 'read'
              : 'sent',
      at
    })),
    packages: packages.map((item) => ({ ...item, active: true })),
    methods: methods
      .filter((item) => item.id !== 'clinic')
      .map((item) => ({
        ...item,
        active: true,
        price: 0,
        duration: '',
        benefits: []
      })),
    providers: providers.slice(0, 2).map((item, index) => ({
      ...item,
      id: `provider-${index + 1}`,
      active: true,
      capacity: index ? 10 : 8,
      price: 0,
      duration: '',
      benefits: []
    })),
    capacity: { morning: 8, afternoon: 6, flexible: 4 },
    lastSync: at,
    syncLogs: [
      {
        id: 'SYNC-001',
        at,
        actor: 'Admin Klinik',
        rows: 12,
        status: 'success',
        detail: 'Dataset contoh siap ditinjau.'
      }
    ],
    templates,
    gateway: { enabled: true, delay: 3, phone: '081200000000' }
  }
}
