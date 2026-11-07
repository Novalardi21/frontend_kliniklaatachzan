import { test } from 'node:test'
import assert from 'node:assert/strict'
import pg from 'pg'

test('HTTP auth, CSRF, protected page, cookie flags and logout', async () => {
  const url = new URL(process.env.AUTH_TEST_DATABASE_URL)
  assert.equal(url.pathname, '/mylaatachzan_auth_test')
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname))
  const pool = new pg.Pool({ connectionString: url.toString() })
  const base = 'http://127.0.0.1:3101'
  const credentials = {
    email: 'test@example.test',
    password: 'OnlyForIsolatedTests123!'
  }
  const post = (path, body, cookie, origin = base) =>
    fetch(base + path, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin,
        ...(cookie ? { cookie } : {})
      },
      body: JSON.stringify(body)
    })
  try {
    await pool.query('UPDATE clinic.users SET active=true')
    await pool.query('DELETE FROM clinic.login_attempts')
    const page = await fetch(base + '/admin', { redirect: 'manual' })
    assert.ok([302, 303].includes(page.status))
    assert.match(page.headers.get('location'), /\/admin\/login/)
    const loginPage = await (await fetch(base + '/admin/login')).text()
    assert.doesNotMatch(loginPage, /<div[^>]*class=["'][^"']*admin-quick-access/)
    assert.equal(loginPage.includes('KlinikDemo123!'), false)
    assert.equal(loginPage.includes('postgresql://'), false)
    const forged = await fetch(base + '/api/auth/session', {
      headers: { cookie: 'laatachzan-preview-role=admin' }
    })
    assert.equal((await forged.json()).user, null)
    assert.equal(
      (
        await post(
          '/api/auth/login',
          credentials,
          undefined,
          'https://other.example'
        )
      ).status,
      403
    )
    assert.equal(
      (await post('/api/auth/login', { ...credentials, password: 'wrong' }))
        .status,
      401
    )
    const signedIn = await post('/api/auth/login', credentials)
    assert.equal(signedIn.status, 200)
    const payload = await signedIn.json()
    assert.equal(payload.user.email, credentials.email)
    assert.equal('password_hash' in payload.user, false)
    const cookies = signedIn.headers.getSetCookie()
    const sessionCookie = cookies.find((value) =>
      value.startsWith('laatachzan-session=')
    )
    assert.match(sessionCookie, /HttpOnly/i)
    assert.match(sessionCookie, /SameSite=Lax/i)
    assert.match(sessionCookie, /Max-Age=28800/i)
    assert.equal(signedIn.headers.get('cache-control'), 'no-store')
    const cookie = sessionCookie.split(';')[0]
    const current = await fetch(base + '/api/auth/session', {
      headers: { cookie }
    })
    assert.equal((await current.json()).user.email, credentials.email)
    assert.equal(
      (
        await fetch(base + '/admin', {
          headers: { cookie },
          redirect: 'manual'
        })
      ).status,
      200
    )
    assert.equal((await post('/api/auth/logout', {}, cookie)).status, 200)
    const revoked = await fetch(base + '/api/auth/session', {
      headers: { cookie }
    })
    assert.equal((await revoked.json()).user, null)
  } finally {
    await pool.end()
  }
})
