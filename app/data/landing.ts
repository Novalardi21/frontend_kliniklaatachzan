// Data presentasi sementara. Ganti dengan data klinik/API sebelum peluncuran.
export interface KhitanPackage {
  id: string
  name: string
  label: string
  description: string
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
    name: 'Reguler',
    label: 'PERAWATAN ESENSIAL',
    description: 'Pilihan sederhana untuk memulai momen berani si kecil.',
    price: 1250000,
    duration: '± 20–30 menit',
    icon: 'i-lucide-heart',
    benefits: [
      'Konsultasi sebelum tindakan',
      'Perlengkapan perawatan dasar',
      '1 celana khitan',
      'Kontrol setelah tindakan',
      'Sertifikat keberanian anak'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    label: 'KENYAMANAN LEBIH',
    description: 'Pendampingan lebih lengkap untuk anak dan orang tua.',
    price: 1850000,
    duration: '± 15–30 menit',
    icon: 'i-lucide-sparkles',
    featured: true,
    benefits: [
      'Semua benefit paket Reguler',
      'Perlengkapan perawatan tambahan',
      '2 celana khitan',
      'Pendampingan kontrol berkala',
      'Bingkisan untuk si pemberani'
    ]
  },
  {
    id: 'super-premium',
    name: 'Super Premium',
    label: 'PENDAMPINGAN MENYELURUH',
    description: 'Perhatian ekstra, dari persiapan hingga masa perawatan.',
    price: 2600000,
    duration: '± 15–30 menit',
    icon: 'i-lucide-crown',
    benefits: [
      'Semua benefit paket Premium',
      'Perlengkapan perawatan lengkap',
      '3 celana khitan',
      'Pendampingan perawatan lanjutan',
      'Bingkisan spesial untuk anak'
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
      'Metode dipilih terpisah dari paket dan perlu dibicarakan dengan tenaga medis berdasarkan kondisi anak. Daftar metode serta kesesuaiannya akan ditentukan oleh klinik.'
  }
]
