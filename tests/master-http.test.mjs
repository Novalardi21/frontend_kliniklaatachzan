import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadEnvFile } from 'node:process'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import pg from 'pg'
import { hashPassword } from '../server/utils/password.ts'

test('master HTTP: protected API, origin checks, persistence and validation', async () => {
  try {
    loadEnvFile(new URL('../.env', import.meta.url))
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }
  const url = new URL(process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL)
  assert.ok(['localhost', '127.0.0.1'].includes(url.hostname))
  const name = `mylaatachzan_master_http_test_${Date.now()}`
  const rootUrl = new URL(url)
  rootUrl.pathname = '/postgres'
  const admin = new pg.Client({ connectionString: rootUrl.toString() })
  await admin.connect()
  let pool,
    server,
    created = false
  const base = 'http://127.0.0.1:3102'
  try {
    await admin.query(`CREATE DATABASE ${name}`)
    created = true
    url.pathname = `/${name}`
    pool = new pg.Pool({ connectionString: url.toString() })
    for (const file of [
      '001_schema.sql',
      '002_catalog.sql',
      '005_auth.sql',
      '006_master_data.sql'
    ])
      await pool.query(
        await readFile(
          new URL(`../../backend/database/${file}`, import.meta.url),
          'utf8'
        )
      )
    const credentials = {
      email: 'master@example.test',
      password: 'MasterPreviewTest123!'
    }
    await pool.query(
      'INSERT INTO clinic.users(email,full_name,password_hash) VALUES ($1,$2,$3)',
      [
        credentials.email,
        'Admin Pengujian',
        await hashPassword(credentials.password)
      ]
    )
    server = spawn(process.execPath, ['.output/server/index.mjs'], {
      cwd: new URL('../', import.meta.url),
      env: {
        ...process.env,
        PORT: '3102',
        HOST: '127.0.0.1',
        NUXT_DATABASE_URL: url.toString(),
        DATABASE_URL: url.toString(),
        NUXT_SITE_URL: base,
        NUXT_AUTH_COOKIE_SECURE: 'false'
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    })
    // Do not print server error objects: connection configuration is private.
    let exited = false
    server.on('exit', () => {
      exited = true
    })
    const deadline = Date.now() + 30000
    while (true) {
      if (exited) throw Error('Test server exited before it was ready')
      try {
        if ((await fetch(base + '/api/auth/session')).ok) break
      } catch {}
      if (Date.now() > deadline) throw Error('Test server did not start')
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
    const send = (path, method, body, cookie, origin = base) =>
      fetch(base + path, {
        method,
        headers: {
          'content-type': 'application/json',
          origin,
          ...(cookie ? { cookie } : {})
        },
        body: JSON.stringify(body)
      })
    assert.equal((await fetch(base + '/api/admin/master')).status, 401)
    assert.equal(
      (
        await fetch(base + '/api/admin/master', {
          headers: { cookie: 'laatachzan-preview-role=admin' }
        })
      ).status,
      401
    )
    const login = await send('/api/auth/login', 'POST', credentials)
    assert.equal(login.status, 200)
    const cookie = login.headers
      .getSetCookie()
      .find((v) => v.startsWith('laatachzan-session='))
      .split(';')[0]
    const response = await fetch(base + '/api/admin/master', {
      headers: { cookie }
    })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    const state = await response.json()
    assert.equal(state.packages.length, 3)
    const updated = { ...state.packages[0], price: 525000 }
    assert.equal(
      (
        await send(
          '/api/admin/master/packages',
          'POST',
          updated,
          cookie,
          'https://other.example'
        )
      ).status,
      403
    )
    assert.equal(
      (await send('/api/admin/master/packages', 'POST', updated)).status,
      401
    )
    assert.equal(
      (
        await send(
          '/api/admin/master/packages',
          'POST',
          { ...updated, price: -1 },
          cookie
        )
      ).status,
      400
    )
    const saved = await send(
      '/api/admin/master/packages',
      'POST',
      updated,
      cookie
    )
    assert.equal(saved.status, 200)
    assert.equal((await saved.json()).packages[0].price, 525000)
    assert.equal(
      (await pool.query("SELECT price FROM clinic.packages WHERE id='reguler'"))
        .rows[0].price,
      '525000'
    )
    const reloaded = await (
      await fetch(base + '/api/admin/master', { headers: { cookie } })
    ).json()
    assert.equal(reloaded.packages[0].price, 525000)
    assert.equal(reloaded.history[0].actor, 'Admin Pengujian')
    const publicResponse = await fetch(base + '/api/catalog')
    assert.equal(
      publicResponse.status,
      200,
      'Public catalog does not require login'
    )
    assert.equal(publicResponse.headers.get('cache-control'), 'no-store')
    const catalog = await publicResponse.json()
    assert.equal(catalog.packages.find((p) => p.id === 'reguler').price, 525000)
    assert.deepEqual(Object.keys(catalog).sort(), [
      'methods',
      'packages',
      'providers',
      'sessions'
    ])
    assert.equal(JSON.stringify(catalog).includes('Admin Pengujian'), false)
    const clinician = await send(
      '/api/admin/master/providers',
      'POST',
      {
        name: 'Dokter Katalog Uji',
        description: 'Profil sintetis',
        role: 'Dokter operator',
        capacity: 8,
        active: true,
        image: '/images/doctor-ridwan.jpg'
      },
      cookie
    )
    assert.equal(clinician.status, 200)
    const provider = (await clinician.json()).providers.find(
      (p) => p.name === 'Dokter Katalog Uji'
    )
    const publicProvider = (
      await (await fetch(base + '/api/catalog')).json()
    ).providers.find((p) => p.id === provider.id)
    assert.equal(publicProvider.name, 'Dokter Katalog Uji')
    assert.equal('capacity' in publicProvider, false)
    const landing = await (await fetch(base + '/')).text()
    assert.ok(
      landing.includes('525.000'),
      'Landing renders updated database price'
    )
    assert.ok(
      landing.includes('Dokter Katalog Uji'),
      'Landing renders database providers'
    )
    const booking = await (await fetch(base + '/booking?paket=reguler')).text()
    assert.ok(
      booking.includes('525.000'),
      'Booking renders updated database price'
    )
    assert.ok(
      booking.includes('Dokter Katalog Uji'),
      'Booking renders database providers'
    )
    assert.equal(
      (
        await send(
          '/api/admin/master/providers',
          'POST',
          { ...provider, active: false },
          cookie
        )
      ).status,
      200
    )
    assert.equal(
      (await (await fetch(base + '/api/catalog')).json()).providers.some(
        (p) => p.id === provider.id
      ),
      false
    )
    assert.equal(
      (
        await send(
          '/api/admin/master/packages',
          'POST',
          { ...updated, active: false },
          cookie
        )
      ).status,
      200
    )
    const hidden = await (await fetch(base + '/api/catalog')).json()
    assert.equal(
      hidden.packages.some((p) => p.id === 'reguler'),
      false
    )
    assert.equal(
      (await send('/api/admin/master/packages', 'POST', updated, cookie))
        .status,
      200
    )
    assert.equal(
      (
        await send(
          '/api/admin/master/capacity',
          'PUT',
          { morning: 11, afternoon: 7, flexible: 3 },
          cookie
        )
      ).status,
      200
    )
    assert.equal(
      (
        await send(
          '/api/admin/master/capacity',
          'PUT',
          { morning: 0, afternoon: 7, flexible: 3 },
          cookie
        )
      ).status,
      400
    )
    const page = await fetch(base + '/admin/master-data', {
      headers: { cookie }
    })
    assert.equal(page.status, 200)
    const html = await page.text()
    assert.ok(html.includes('Bius Jarum'))
    assert.equal(html.includes('postgresql://'), false)
    await pool.query('UPDATE clinic.packages SET active=false')
    assert.equal(
      (await (await fetch(base + '/api/catalog')).json()).packages.length,
      0
    )
    assert.ok(
      (await (await fetch(base + '/')).text()).includes(
        'Belum ada paket yang tersedia'
      )
    )
    const noPackages = await (await fetch(base + '/booking')).text()
    assert.ok(noPackages.includes('Pilihan layanan belum tersedia'))
    assert.equal(noPackages.includes('class="booking-layout"'), false)
    await pool.query('UPDATE clinic.packages SET active=true')
    await pool.query(
      'ALTER TABLE clinic.packages RENAME TO packages_unavailable_test'
    )
    assert.equal((await fetch(base + '/api/catalog')).status, 503)
    assert.ok(
      (await (await fetch(base + '/')).text()).includes(
        'Pilihan layanan belum dapat dimuat'
      )
    )
    await pool.query(
      'ALTER TABLE clinic.packages_unavailable_test RENAME TO packages'
    )
    console.log(
      'HTTP assertions passed: authentication, CSRF, SQL persistence, validation, SSR.'
    )
    if (process.env.CATALOG_UI_STOP_FILE) {
      console.log(
        'UI test ready: http://127.0.0.1:3102/ — synthetic admin master@example.test / MasterPreviewTest123!'
      )
      const deadline = Date.now() + 300000
      while (
        !existsSync(process.env.CATALOG_UI_STOP_FILE) &&
        Date.now() < deadline
      )
        await new Promise((resolve) => setTimeout(resolve, 500))
    }
  } finally {
    if (server && server.exitCode === null) {
      const stopped = new Promise((resolve) => server.once('exit', resolve))
      server.kill()
      await stopped
    }
    if (pool) await pool.end()
    if (created) await admin.query(`DROP DATABASE ${name}`)
    await admin.end()
  }
})
