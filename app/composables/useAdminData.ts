import {
  createAdminState,
  shortDate,
  statusLabels,
  type AdminBooking,
  type AdminState,
  type ReservationStatus,
  type PaymentMethod
} from '~/data/admin'

export function useAdminData() {
  const data = useState<AdminState>('admin-preview-data', createAdminState)
  const notices = useState<
    { id: number; text: string; tone: 'success' | 'error' }[]
  >('admin-notices', () => [])
  const backups = useState<
    { id: string; name: string; at: string; data: AdminState }[]
  >('admin-preview-backups', () => [])
  const syncing = useState('admin-syncing', () => false)
  const { name } = useAdminSession()
  const pending = computed(() =>
    data.value.bookings.filter((item) => item.status === 'pending')
  )
  const todayBookings = computed(() =>
    data.value.bookings.filter(
      (item) => item.date === data.value.today && item.status !== 'rejected'
    )
  )
  const revenue = computed(() =>
    data.value.payments.reduce((total, payment) => total + payment.amount, 0)
  )

  function notify(text: string, tone: 'success' | 'error' = 'success') {
    const id = Date.now() + Math.random()
    notices.value.push({ id, text, tone })
    if (import.meta.client)
      setTimeout(() => {
        notices.value = notices.value.filter((item) => item.id !== id)
      }, 6000)
  }
  function occupied(date: string, session: string, excluding?: string) {
    return data.value.bookings
      .filter(
        (item) =>
          item.id !== excluding &&
          item.date === date &&
          item.session === session &&
          ['confirmed', 'completed'].includes(item.status)
      )
      .reduce((sum, item) => sum + item.count, 0)
  }
  function capacity(session: string) {
    return session === 'Pagi'
      ? data.value.capacity.morning
      : session === 'Sore'
        ? data.value.capacity.afternoon
        : data.value.capacity.flexible
  }
  function renderMessage(booking: AdminBooking, templateId: string) {
    const template =
      data.value.templates.find((item) => item.id === templateId) ??
      data.value.templates[0]!
    return template.content
      .replaceAll('{nama_wali}', booking.guardian)
      .replaceAll('{kode}', booking.id)
      .replaceAll(
        '{tanggal}',
        shortDate(
          templateId === 'reschedule'
            ? (booking.proposedDate ?? booking.date)
            : booking.date
        )
      )
      .replaceAll(
        '{sesi}',
        templateId === 'reschedule'
          ? (booking.proposedSession ?? booking.session)
          : booking.session
      )
  }
  function addMessage(
    booking: AdminBooking,
    templateId: string,
    text?: string
  ) {
    const template =
      data.value.templates.find((item) => item.id === templateId) ??
      data.value.templates[0]!
    data.value.messages.unshift({
      id: `MSG-${crypto.randomUUID().slice(0, 8)}`,
      bookingId: booking.id,
      recipient: booking.guardian,
      phone: booking.phone,
      template: template.name,
      text: text ?? renderMessage(booking, templateId),
      status: 'queued',
      at: new Date().toISOString()
    })
  }
  function changeStatus(
    booking: AdminBooking,
    status: ReservationStatus,
    reason: string,
    proposedDate?: string,
    proposedSession?: string
  ) {
    if (booking.status === 'completed' || booking.status === 'rejected')
      throw new Error(
        'Pengajuan yang sudah selesai atau ditolak tidak dapat diubah.'
      )
    if (status === 'completed' && booking.status !== 'confirmed')
      throw new Error(
        'Layanan hanya dapat diselesaikan dari reservasi terkonfirmasi.'
      )
    if (status === 'confirmed' && !booking.verified)
      throw new Error('Selesaikan verifikasi identitas terlebih dahulu.')
    const serviceDate =
      booking.status === 'reschedule' && status === 'confirmed'
        ? (booking.proposedDate ?? booking.date)
        : booking.date
    const serviceSession =
      booking.status === 'reschedule' && status === 'confirmed'
        ? (booking.proposedSession ?? booking.session)
        : booking.session
    if (
      status === 'confirmed' &&
      occupied(serviceDate, serviceSession, booking.id) + booking.count >
        capacity(serviceSession)
    )
      throw new Error(
        'Kapasitas sesi tidak cukup. Silakan usulkan jadwal lain.'
      )
    if (status === 'reschedule' && (!proposedDate || !proposedSession))
      throw new Error('Tanggal dan sesi usulan wajib diisi.')
    if ((status === 'reschedule' || status === 'rejected') && !reason.trim())
      throw new Error('Alasan perubahan wajib diisi.')
    const previous = booking.status
    if (previous === 'reschedule' && status === 'confirmed') {
      booking.date = serviceDate
      booking.session = serviceSession
      delete booking.proposedDate
      delete booking.proposedSession
    }
    if (status === 'reschedule') {
      booking.proposedDate = proposedDate
      booking.proposedSession = proposedSession
    }
    booking.status = status
    data.value.audit.unshift({
      id: crypto.randomUUID(),
      bookingId: booking.id,
      from: statusLabels[previous],
      to: statusLabels[status],
      reason,
      actor: name.value,
      at: new Date().toISOString()
    })
    if (status === 'confirmed' || status === 'reschedule')
      addMessage(booking, status === 'confirmed' ? 'confirmed' : 'reschedule')
    notify(`Status ${booking.id} diperbarui menjadi ${statusLabels[status]}.`)
  }
  function addBooking(values: Omit<AdminBooking, 'id' | 'status' | 'paid'>) {
    const prefix = `KHT-${values.date.replaceAll('-', '')}-`
    const sequence =
      Math.max(
        0,
        ...data.value.bookings
          .filter((item) => item.id.startsWith(prefix))
          .map((item) => Number(item.id.split('-').at(-1)) || 0)
      ) + 1
    const booking: AdminBooking = {
      ...values,
      id: prefix + String(sequence).padStart(4, '0'),
      status: 'pending',
      paid: false
    }
    data.value.bookings.unshift(booking)
    addMessage(booking, 'received')
    data.value.audit.unshift({
      id: crypto.randomUUID(),
      bookingId: booking.id,
      from: 'Pengajuan Baru',
      to: statusLabels.pending,
      reason: 'Pengajuan manual pada mode pratinjau.',
      actor: name.value,
      at: new Date().toISOString()
    })
    notify(`Pengajuan ${booking.id} berhasil ditambahkan.`)
    return booking
  }
  function recordPayment(
    booking: AdminBooking,
    method: PaymentMethod,
    received: number
  ) {
    if (
      booking.paid ||
      data.value.payments.some((item) => item.bookingId === booking.id)
    )
      throw new Error('Pembayaran pengajuan ini sudah tercatat.')
    if (booking.status !== 'completed')
      throw new Error('Pembayaran dicatat setelah layanan selesai.')
    if (!Number.isFinite(received) || received < booking.amount)
      throw new Error('Jumlah pembayaran belum mencukupi tagihan.')
    const receipt = {
      id: `KW-${data.value.today.replaceAll('-', '')}-${String(data.value.payments.length + 1).padStart(4, '0')}`,
      bookingId: booking.id,
      amount: booking.amount,
      method,
      received,
      change: method === 'Tunai' ? received - booking.amount : 0,
      at: new Date().toISOString(),
      actor: name.value
    }
    data.value.payments.unshift(receipt)
    booking.paid = true
    addMessage(booking, 'payment')
    data.value.audit.unshift({
      id: crypto.randomUUID(),
      bookingId: booking.id,
      from: 'Belum Dibayar',
      to: 'Sudah Dibayar',
      reason: `Pembayaran ${method}, ${receipt.id}.`,
      actor: name.value,
      at: receipt.at
    })
    notify(`Pembayaran tercatat. Kuitansi ${receipt.id}.`)
    return receipt
  }
  function createBackup() {
    const backup = {
      id: crypto.randomUUID(),
      name: `Snapshot ${backups.value.length + 1}`,
      at: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(data.value)) as AdminState
    }
    backups.value.unshift(backup)
    notify('Cadangan data contoh dibuat dalam sesi ini.')
    return backup
  }
  async function synchronize() {
    if (syncing.value) return
    syncing.value = true
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      const at = new Date().toISOString()
      data.value.lastSync = at
      data.value.syncLogs.unshift({
        id: crypto.randomUUID(),
        at,
        actor: name.value,
        rows: data.value.bookings.length,
        status: 'success',
        detail: 'Simulasi sinkronisasi dataset contoh selesai.'
      })
      notify(
        'Simulasi sinkronisasi selesai. Tidak ada workbook eksternal diubah.'
      )
    } finally {
      syncing.value = false
    }
  }
  return {
    data,
    notices,
    backups,
    syncing,
    pending,
    todayBookings,
    revenue,
    notify,
    occupied,
    capacity,
    renderMessage,
    addMessage,
    changeStatus,
    addBooking,
    recordPayment,
    createBackup,
    synchronize
  }
}
