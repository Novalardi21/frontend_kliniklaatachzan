// Data presentasi sementara. Ganti dengan data klinik/API sebelum peluncuran.
export interface KhitanPackage {
  id: string
  name: string
  label: string
  description: string
  methodId: string
  price: number
  duration: string
  icon: string
  featured?: boolean
  benefits: string[]
}
export const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value)
export const packages: KhitanPackage[] = [
  {
    id: 'reguler',
    name: 'Bius Jarum & Jahitan',
    label: 'PAKET 1 · DENGAN JAHITAN',
    description: 'Paket khitan dengan bius jarum dan jahitan.',
    methodId: 'needle-stitches',
    price: 500000,
    duration: 'Durasi dikonfirmasi klinik',
    icon: 'i-lucide-heart',
    benefits: [
      'Bius menggunakan jarum',
      'Tindakan dengan jahitan',
      'Pembayaran di tempat'
    ]
  },
  {
    id: 'premium',
    name: 'Bius Jarum & Tanpa Jahitan',
    label: 'PAKET 2 · TANPA JAHITAN',
    description: 'Paket khitan dengan bius jarum, tanpa jahitan.',
    methodId: 'needle-no-stitches',
    price: 800000,
    duration: 'Durasi dikonfirmasi klinik',
    icon: 'i-lucide-sparkles',
    featured: true,
    benefits: [
      'Bius menggunakan jarum',
      'Tindakan tanpa jahitan',
      'Pembayaran di tempat'
    ]
  },
  {
    id: 'super-premium',
    name: 'Bius Semprot (Tanpa Jarum) & Tanpa Jahitan',
    label: 'PAKET 3 · BIUS SEMPROT',
    description: 'Paket khitan dengan bius semprot tanpa jarum, tanpa jahitan.',
    methodId: 'spray-no-stitches',
    price: 1100000,
    duration: 'Durasi dikonfirmasi klinik',
    icon: 'i-lucide-crown',
    benefits: [
      'Bius semprot tanpa jarum',
      'Tindakan tanpa jahitan',
      'Pembayaran di tempat'
    ]
  }
]
export const bookingSteps = [
  {
    icon: 'i-lucide-clipboard-list',
    title: 'Lengkapi data',
    description: 'Isi jumlah anak, data pasien, dan kontak orang tua atau wali.'
  },
  {
    icon: 'i-lucide-heart-handshake',
    title: 'Pilih layanan',
    description: 'Tentukan paket, metode, dan preferensi tenaga medis.'
  },
  {
    icon: 'i-lucide-calendar-days',
    title: 'Ajukan jadwal',
    description:
      'Pilih tanggal serta preferensi sesi pagi, sore, atau fleksibel.'
  },
  {
    icon: 'i-lucide-badge-check',
    title: 'Konfirmasi & datang',
    description: 'Tunggu konfirmasi klinik. Pembayaran dilakukan di tempat.'
  }
]
export const providers = [
  {
    name: 'dr. Ridwan Pratama',
    role: 'Dokter umum',
    image: '/images/doctor-ridwan.jpg',
    description:
      'Mendampingi konsultasi dan perencanaan tindakan bersama keluarga.'
  },
  {
    name: 'dr. Ratna Dewi',
    role: 'Dokter pendamping',
    image: '/images/doctor-ratna.jpg',
    description:
      'Membantu keluarga memahami persiapan dan rencana perawatan anak.'
  },
  {
    name: 'Ns. Aisyah Putri',
    role: 'Perawat pendamping',
    image: '/images/nurse-aisyah.jpg',
    description:
      'Menemani si kecil serta membantu edukasi perawatan untuk orang tua.'
  }
]
export const sessions = [
  {
    name: 'Sesi pagi',
    time: '06.00–08.00 WIB',
    description: 'Awali hari dengan suasana yang tenang.',
    icon: 'i-lucide-sun'
  },
  {
    name: 'Sesi sore',
    time: '16.00–17.00 WIB',
    description: 'Pilihan setelah aktivitas keluarga.',
    icon: 'i-lucide-sunset'
  },
  {
    name: 'Sesi fleksibel',
    time: 'Sesuai kesepakatan',
    description: 'Diskusikan kebutuhan waktu dengan klinik.',
    icon: 'i-lucide-calendar-clock'
  }
]
export const faqs = [
  {
    question: 'Bagaimana cara booking khitan di MyLaaTachzan?',
    answer:
      'Alurnya dimulai dari data anak dan wali, pilihan paket dan metode, lalu preferensi tenaga medis serta jadwal. Klinik akan memeriksa pengajuan sebelum mengonfirmasi jadwal final. Pada versi demo ini, Anda dapat mencoba simulasi pilihan paket dan jadwal.'
  },
  {
    question: 'Apakah bisa mendaftarkan lebih dari satu anak?',
    answer:
      'Bisa. Rancangan booking memungkinkan beberapa anak dalam satu pengajuan, dengan data, paket, dan metode terpisah untuk setiap anak. Pengaturan kunjungan akan dikonfirmasi oleh klinik.'
  },
  {
    question: 'Apakah jadwal langsung pasti setelah booking?',
    answer:
      'Belum. Tanggal dan sesi yang dipilih adalah preferensi. Jadwal menjadi pasti setelah klinik memeriksa ketersediaan dan jadwal disepakati bersama.'
  },
  {
    question: 'Bagaimana metode pembayarannya?',
    answer:
      'Pembayaran dilakukan di tempat setelah layanan. Pilihan tunai, QRIS, atau transfer mengikuti fasilitas yang nantinya dikonfirmasi oleh klinik. Demo ini tidak meminta pembayaran.'
  },
  {
    question: 'Bagaimana memilih metode khitan yang sesuai?',
    answer:
      'Spesifikasi bius dan jahitan mengikuti paket yang dipilih. Kesesuaian tindakan perlu dibicarakan dengan tenaga medis berdasarkan kondisi anak.'
  }
]
