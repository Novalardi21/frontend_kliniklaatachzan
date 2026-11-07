import { requireClinicAdmin } from '../../utils/require-clinic-admin'
import { whatsappConfigured } from '../../utils/whatsapp-delivery'

export default defineEventHandler(async (event) => {
  const { pool } = await requireClinicAdmin(event)
  const config = useRuntimeConfig()
  const [logs, totals, templates] = await Promise.all([
    pool.query<{
      id: string
      code: string
      recipient: string
      phone: string | null
      template: string
      templateId: string
      status: string
      body: string
      at: Date
      error: string | null
    }>(`
      SELECT n.id::text,b.registration_code AS code,
             CASE WHEN n.template_id='booking-staff' THEN 'Petugas' ELSE c.full_name END AS recipient,
             n.recipient_phone AS phone,t.name AS template,n.template_id AS "templateId",
             n.status,n.body,n.created_at AS at,n.last_error AS error
      FROM clinic.notifications n JOIN clinic.bookings b ON b.id=n.booking_id
      JOIN clinic.customers c ON c.id=b.customer_id JOIN clinic.message_templates t ON t.id=n.template_id
      ORDER BY n.created_at DESC,n.id DESC LIMIT 100
    `),
    pool.query<{ status: string; count: number }>(
      'SELECT status,count(*)::int AS count FROM clinic.notifications GROUP BY status'
    ),
    pool.query<{ id: string; name: string; body: string; active: boolean }>(
      'SELECT id,name,body,active FROM clinic.message_templates ORDER BY name'
    )
  ])
  return {
    logs: logs.rows.map((row) => ({ ...row, at: row.at.toISOString() })),
    totals: totals.rows,
    templates: templates.rows,
    gateway: {
      provider: config.whatsapp.provider,
      ready: whatsappConfigured(config.whatsapp),
      staffConfigured: /^62\d{8,13}$/.test(config.bookingStaffPhone)
    }
  }
})
