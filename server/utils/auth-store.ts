import { createHash, randomBytes } from 'node:crypto'
import type { Pool } from 'pg'
import { verifyPassword } from './password.ts'

export interface AuthUser {
  id: number
  email: string
  name: string
  role: 'admin'
}
export const sessionSeconds = 8 * 60 * 60
export const tokenHash = (value: string) =>
  createHash('sha256').update(value).digest('hex')
export class LoginRejected extends Error {
  statusCode: number
  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}
export async function authenticate(
  pool: Pool,
  email: string,
  password: string,
  address: string
) {
  const key = tokenHash(`login:${address}`)
  const attempt = await pool.query(
    `
    INSERT INTO clinic.login_attempts(key_hash, attempts) VALUES ($1, 1)
    ON CONFLICT (key_hash) DO UPDATE SET
      attempts = CASE WHEN clinic.login_attempts.window_started_at < now() - interval '15 minutes'
        THEN 1 ELSE clinic.login_attempts.attempts + 1 END,
      window_started_at = CASE WHEN clinic.login_attempts.window_started_at < now() - interval '15 minutes'
        THEN now() ELSE clinic.login_attempts.window_started_at END
    RETURNING attempts`,
    [key]
  )
  if (attempt.rows[0].attempts > 10) {
    throw new LoginRejected(
      429,
      'Terlalu banyak percobaan. Coba kembali dalam 15 menit.'
    )
  }
  const result = await pool.query(
    `SELECT id, email, full_name AS name, role, password_hash, active
    FROM clinic.users WHERE email = $1`,
    [email.trim().toLowerCase()]
  )
  const account = result.rows[0]
  const valid = await verifyPassword(password, account?.password_hash)
  if (!valid || !account?.active)
    throw new LoginRejected(401, 'Email atau kata sandi salah.')
  const token = randomBytes(32).toString('hex')
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      'DELETE FROM clinic.user_sessions WHERE expires_at <= now()'
    )
    await client.query(
      `INSERT INTO clinic.user_sessions(token_hash, user_id, expires_at)
      VALUES ($1, $2, now() + interval '8 hours')`,
      [tokenHash(token), account.id]
    )
    await client.query(
      'UPDATE clinic.users SET last_login_at = now() WHERE id = $1',
      [account.id]
    )
    await client.query(
      'DELETE FROM clinic.login_attempts WHERE key_hash = $1',
      [key]
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
  const user: AuthUser = {
    id: account.id,
    email: account.email,
    name: account.name,
    role: account.role
  }
  return { token, user }
}
export async function findSession(
  pool: Pool,
  token?: string
): Promise<AuthUser | null> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null
  const result = await pool.query(
    `SELECT u.id, u.email, u.full_name AS name, u.role
    FROM clinic.user_sessions s JOIN clinic.users u ON u.id = s.user_id
    WHERE s.token_hash = $1 AND s.expires_at > now() AND u.active`,
    [tokenHash(token)]
  )
  return result.rows[0] ?? null
}
export async function revokeSession(pool: Pool, token?: string) {
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    await pool.query('DELETE FROM clinic.user_sessions WHERE token_hash = $1', [
      tokenHash(token)
    ])
  }
}
