import {
  createBookingChild,
  formatRegistration,
  localDate,
  type BookingDraft
} from '~/data/booking'

export function useBookingForm() {
  const { packages, methods, providers, sessions, status } = usePublicCatalog()
  // Personal/medical fields stay in memory; never write them to browser storage.
  const draft = useState<BookingDraft>('booking-draft', () => ({
    children: [createBookingChild(1)],
    customer: { name: '', whatsapp: '', address: '', locationNotes: '' },
    provider: 'clinic',
    date: '',
    session: 'Sesi pagi',
    flexibleNotes: '',
    notes: '',
    consent: false
  }))
  const catalogWarning = useState('booking-catalog-warning', () => '')
  watch(
    [
      packages,
      providers,
      sessions,
      () => draft.value,
      () => draft.value.children.length
    ],
    () => {
      if (status.value !== 'success') return
      for (const child of draft.value.children) {
        if (!child.packageId) child.packageId = packages.value[0]?.id ?? ''
        else if (!packages.value.some((item) => item.id === child.packageId)) {
          child.packageId = ''
          catalogWarning.value =
            'Salah satu paket tidak lagi tersedia. Silakan pilih kembali.'
        }
        const pkg = packages.value.find((item) => item.id === child.packageId)
        if (
          child.methodId !== 'clinic' &&
          (child.methodId !== pkg?.methodId ||
            !methods.value.some((item) => item.id === child.methodId))
        )
          child.methodId = 'clinic'
      }
      if (
        draft.value.provider !== 'clinic' &&
        !providers.value.some((item) => item.id === draft.value.provider)
      ) {
        draft.value.provider = 'clinic'
        catalogWarning.value =
          'Tenaga medis sebelumnya tidak tersedia. Pilihan dikembalikan ke rekomendasi klinik.'
      }
      if (!sessions.value.some((item) => item.name === draft.value.session))
        draft.value.session = sessions.value[0]?.name ?? ''
    },
    { immediate: true }
  )
  // Demo counters are local to this app session, not a production allocator.
  const sequences = useState<Record<string, number>>(
    'booking-demo-sequences',
    () => ({})
  )
  const registration = useState<string>('booking-registration', () => '')
  const originalDate = useState<string>('booking-original-date', () => '')

  function register() {
    // Editing/rescheduling the current application keeps its original identity.
    if (registration.value) return registration.value
    const date = draft.value.date
    const nextSequence = (sequences.value[date] ?? 0) + 1
    const code = formatRegistration(date, nextSequence)
    sequences.value[date] = nextSequence
    originalDate.value = date
    registration.value = code
    return code
  }

  function startNewBooking() {
    registration.value = ''
    catalogWarning.value = ''
    originalDate.value = ''
    draft.value = {
      children: [createBookingChild(1)],
      customer: { name: '', whatsapp: '', address: '', locationNotes: '' },
      provider: 'clinic',
      date: '',
      session: 'Sesi pagi',
      flexibleNotes: '',
      notes: '',
      consent: false
    }
  }
  const total = computed(() =>
    draft.value.children.reduce(
      (sum, child) =>
        sum +
        (packages.value.find((item) => item.id === child.packageId)?.price ??
          0),
      0
    )
  )

  function setQuantity(quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return
    const children = draft.value.children
    while (children.length < quantity) {
      children.push(
        createBookingChild(Math.max(...children.map((child) => child.id)) + 1)
      )
    }
    if (children.length > quantity) children.splice(quantity)
  }

  function fillSampleData() {
    const requestedDate = new Date()
    requestedDate.setDate(requestedDate.getDate() + 7)
    draft.value.children.forEach((child, index) => {
      Object.assign(child, {
        name:
          index === 0
            ? 'Muhammad Rayyan (Contoh)'
            : `Adik Rayyan ${index + 1} (Contoh)`,
        nik: '',
        birthPlace: 'Bandung',
        birthDate: `${2018 + (index % 4)}-05-14`,
        guardian: 'Farhan Pratama (Contoh)',
        healthNotes: 'Contoh: tidak ada alergi yang diketahui'
      })
    })
    Object.assign(draft.value.customer, {
      name: 'Farhan Pratama (Contoh)',
      whatsapp: '081200000000',
      address:
        'Jl. Contoh No. 10, RT 01/RW 02, Kelurahan Contoh, Kecamatan Contoh, Bandung 40111',
      locationNotes: 'Alamat contoh untuk demonstrasi'
    })
    draft.value.date = localDate(requestedDate)
    draft.value.notes =
      'Contoh: ananda sedikit pemalu, mohon didampingi orang tua.'
    draft.value.consent = false
  }

  return {
    draft,
    catalogWarning,
    total,
    setQuantity,
    fillSampleData,
    registration,
    originalDate,
    register,
    startNewBooking
  }
}
