// Run only against a disposable PostgreSQL database named mylaatachzan_auth_test.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import pg from 'pg'
import {
  authenticate,
  findSession,
  revokeSession,
  tokenHash
} from '../server/utils/auth-store.ts'
import { hashPassword } from '../server/utils/password.ts'

test('single admin, invalid login, session expiry/revocation and rate limiting', async () => {
  const connectionString = process.env.AUTH_TEST_DATABASE_URL
  assert.ok(
    connectionString,
    'Set AUTH_TEST_DATABASE_URL for an isolated test database'
  )
  const url = new URL(connectionString)
  assert.equal(
    url.pathname,
    '/mylaatachzan_auth_test',
    'Refusing to use a non-test database'
  )
  assert.ok(
    ['127.0.0.1', 'localhost'].includes(url.hostname),
    'Tests must use a local database'
  )
  const pool = new pg.Pool({ connectionString })
  try {
    for (const name of ['001_schema.sql', '005_auth.sql', '005_auth.sql']) {
      await pool.query(
        await readFile(
          new URL(`../../backend/database/${name}`, import.meta.url),
          'utf8'
        )
      )
    }
    const password = 'OnlyForIsolatedTests123!'
    await pool.query(
      `INSERT INTO clinic.users(email,full_name,password_hash)
      VALUES ($1,$2,$3)`,
      ['test@example.test', 'Test Admin', await hashPassword(password)]
    )
    await assert.rejects(
      pool.query(`INSERT INTO clinic.users(id,email,full_name,password_hash)
      VALUES (2,'second@example.test','Other','invalid')`),
      (error) => error.code === '23514'
    )
    await assert.rejects(
      authenticate(pool, 'test@example.test', 'wrong', 'wrong-password'),
      (error) => error.statusCode === 401
    )
    await assert.rejects(
      authenticate(pool, 'missing@example.test', password, 'missing-user'),
      (error) => error.statusCode === 401
    )
    const result = await authenticate(
      pool,
      'TEST@EXAMPLE.TEST',
      password,
      'success'
    )
    assert.equal(result.user.name, 'Test Admin')
    assert.equal('password_hash' in result.user, false)
    assert.equal(
      (await findSession(pool, result.token)).email,
      'test@example.test'
    )
    assert.equal(await findSession(pool, 'forged-cookie'), null)
    assert.equal(await findSession(pool, 'a'.repeat(64)), null)
    const stored = await pool.query(
      'SELECT token_hash FROM clinic.user_sessions'
    )
    assert.equal(stored.rows[0].token_hash, tokenHash(result.token))
    assert.notEqual(stored.rows[0].token_hash, result.token)
    await revokeSession(pool, result.token)
    assert.equal(await findSession(pool, result.token), null)
    const expired = await authenticate(
      pool,
      'test@example.test',
      password,
      'expiry'
    )
    await pool.query(
      `UPDATE clinic.user_sessions SET created_at=now()-interval '10 hours',
      expires_at=now()-interval '1 hour' WHERE token_hash=$1`,
      [tokenHash(expired.token)]
    )
    assert.equal(await findSession(pool, expired.token), null)
    const disabled = await authenticate(
      pool,
      'test@example.test',
      password,
      'disabled'
    )
    await pool.query('UPDATE clinic.users SET active=false')
    assert.equal(await findSession(pool, disabled.token), null)
    await assert.rejects(
      authenticate(pool, 'test@example.test', password, 'disabled'),
      (error) => error.statusCode === 401
    )
    await pool.query(
      `INSERT INTO clinic.login_attempts(key_hash,attempts) VALUES ($1,10)`,
      [tokenHash('login:rate-test')]
    )
    await assert.rejects(
      authenticate(pool, 'test@example.test', password, 'rate-test'),
      (error) => error.statusCode === 429
    )
  } finally {
    await pool.end()
  }
})
