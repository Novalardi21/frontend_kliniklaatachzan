import { createBookingChild, type BookingDraft } from '~/data/booking'

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
  const receipt = useState<{
    code: string
    date: string
    total: number
  } | null>('booking-receipt', () => null)
  let lastRequest: { fingerprint: string; key: string } | undefined

  async function register() {
    const payload = {
      ...draft.value,
      children: draft.value.children.map(
        ({
          name,
          birthPlace,
          birthDate,
          gender,
          guardian,
          packageId,
          methodId
        }) => ({
          name,
          birthPlace,
          birthDate,
          gender,
          guardian,
          packageId,
          methodId
        })
      ),
      expectedTotal: total.value
    }
    const fingerprint = JSON.stringify(payload)
    if (!lastRequest || lastRequest.fingerprint !== fingerprint)
      lastRequest = { fingerprint, key: crypto.randomUUID() }
    receipt.value = await $fetch('/api/bookings', {
      method: 'POST',
      body: { ...payload, requestKey: lastRequest.key }
    })
  }

  function startNewBooking() {
    receipt.value = null
    lastRequest = undefined
    catalogWarning.value = ''
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

  return {
    draft,
    catalogWarning,
    total,
    setQuantity,
    receipt,
    register,
    startNewBooking
  }
}
