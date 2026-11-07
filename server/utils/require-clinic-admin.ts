import type { H3Event } from 'h3'
import { authCookie, noCache } from './auth-http'
import { findSession } from './auth-store'
import { database } from './database'

export async function requireClinicAdmin(event: H3Event) {
  noCache(event)
  const token = getCookie(event, authCookie)
  if (!token) throw createError({ statusCode: 401 })
  const pool = database()
  const user = await findSession(pool, token)
  if (!user || user.role !== 'admin') throw createError({ statusCode: 401 })
  return { pool, user }
}
