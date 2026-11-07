import type { H3Event } from 'h3'
export const authCookie = 'laatachzan-session'
export function noCache(event: H3Event) {
  setHeader(event, 'Cache-Control', 'no-store')
}
export function requireSameOrigin(event: H3Event) {
  noCache(event)
  const configured = useRuntimeConfig().siteUrl
  const origin = getHeader(event, 'origin')
  const expected = configured
    ? new URL(configured).origin
    : getRequestURL(event).origin
  if (!origin || origin !== expected) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Permintaan login tidak diizinkan.'
    })
  }
}
