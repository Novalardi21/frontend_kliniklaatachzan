// Creates its own local disposable database; never mutates application records.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { loadEnvFile } from 'node:process'
import { readFile } from 'node:fs/promises'
import pg from 'pg'
import { readCatalog } from '../server/utils/catalog-store.ts'
import {
  readMaster,
  saveMaster,
  saveCapacity,
  validateMaster
} from '../server/utils/master-store.ts'

test('master PostgreSQL: persistence, validation, relations, history and snapshot protection', async () => {
  try {
    loadEnvFile(new URL('../.env', import.meta.url))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const url = new URL(process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL)
  assert.ok(
    ['127.0.0.1', 'localhost'].includes(url.hostname),
    'Integration tests require local PostgreSQL'
  )
  const databaseName = `mylaatachzan_master_test_${Date.now()}`
  const adminUrl = new URL(url)
  adminUrl.pathname = '/postgres'
  const admin = new pg.Client({ connectionString: adminUrl.toString() })
  await admin.connect()
  let pool
  let created = false
  try {
    await admin.query(`CREATE DATABASE ${databaseName}`)
    created = true
    url.pathname = `/${databaseName}`
    pool = new pg.Pool({ connectionString: url.toString() })
    for (const file of [
      '001_schema.sql',
      '002_catalog.sql',
      '003_sample.sql',
      '005_auth.sql',
      '006_master_data.sql',
      '006_master_data.sql'
    ])
      await pool.query(
        await readFile(
          new URL(`../../backend/database/${file}`, import.meta.url),
          'utf8'
        )
      )
    await pool.query(
      "INSERT INTO clinic.users(email,full_name,password_hash) VALUES ('master@example.test','Test Admin','unusable-test-only')"
    )
    const actor = { id: 1, name: 'Test Admin' }
    const initial = await readMaster(pool)
    assert.equal(initial.packages.length, 3)
    assert.equal(initial.packages[0].price, 500000)
    const beforeSnapshot = (
      await pool.query(
        'SELECT package_name_snapshot,price_snapshot FROM clinic.booking_children'
      )
    ).rows
    let state = await saveMaster(
      pool,
      'packages',
      { ...initial.packages[0], price: 550000, duration: '20 menit' },
      actor
    )
    assert.equal(state.packages.find((p) => p.id === 'reguler').price, 550000)
    assert.deepEqual(
      (
        await pool.query(
          'SELECT package_name_snapshot,price_snapshot FROM clinic.booking_children'
        )
      ).rows,
      beforeSnapshot
    )
    assert.equal(state.history[0].actor, 'Test Admin')
    await assert.rejects(
      saveMaster(pool, 'packages', { ...state.packages[0], price: -1 }, actor),
      { statusCode: 400 }
    )
    await assert.rejects(
      saveMaster(
        pool,
        'packages',
        { ...state.packages[0], methodId: 'missing' },
        actor
      ),
      { statusCode: 400 }
    )
    const method = state.methods.find((m) => m.id === 'needle-stitches')
    await assert.rejects(
      saveMaster(pool, 'methods', { ...method, active: false }, actor),
      { statusCode: 409 }
    )
    assert.equal(
      (await readMaster(pool)).history.length,
      1,
      'Failed writes do not add history'
    )
    state = await saveMaster(
      pool,
      'methods',
      {
        name: 'Metode uji',
        description: 'Contoh',
        active: true,
        anesthesia: 'spray',
        usesStitches: false
      },
      actor
    )
    const newMethod = state.methods.find((m) => m.name === 'Metode uji')
    state = await saveMaster(
      pool,
      'packages',
      {
        name: 'Paket uji',
        description: 'Contoh',
        active: true,
        price: 750000,
        duration: '25 menit',
        benefits: ['Konsultasi'],
        methodId: newMethod.id
      },
      actor
    )
    const newPackage = state.packages.find((p) => p.name === 'Paket uji')
    assert.equal(newPackage.methodId, newMethod.id)
    state = await saveMaster(
      pool,
      'packages',
      { ...newPackage, active: false },
      actor
    )
    assert.equal(
      state.packages.find((p) => p.id === newPackage.id).active,
      false
    )
    state = await saveMaster(
      pool,
      'methods',
      { ...newMethod, active: false },
      actor
    )
    state = await saveMaster(
      pool,
      'providers',
      {
        name: 'Dokter Uji',
        description: 'Profil uji',
        active: true,
        role: 'Dokter',
        capacity: 10,
        image: '/images/doctor-ratna.jpg'
      },
      actor
    )
    const provider = state.providers.find((p) => p.name === 'Dokter Uji')
    state = await saveMaster(
      pool,
      'providers',
      { ...provider, capacity: 12, active: false },
      actor
    )
    assert.equal(state.providers.find((p) => p.id === provider.id).capacity, 12)
    assert.throws(
      () => validateMaster('providers', { ...provider, capacity: 0 }),
      { statusCode: 400 }
    )
    assert.throws(
      () =>
        validateMaster('providers', {
          ...provider,
          image: 'https://example.test/pic.jpg'
        }),
      { statusCode: 400 }
    )
    state = await saveCapacity(
      pool,
      { morning: 10, afternoon: 7, flexible: 3 },
      actor
    )
    assert.deepEqual(
      state.sessions.map((s) => s.capacity),
      [10, 7, 3]
    )
    await assert.rejects(
      saveCapacity(pool, { morning: 0, afternoon: 7, flexible: 3 }, actor),
      { statusCode: 400 }
    )
    const secondPool = new pg.Pool({ connectionString: url.toString() })
    try {
      const persisted = await readMaster(secondPool)
      assert.equal(
        persisted.packages.find((p) => p.id === 'reguler').price,
        550000
      )
      assert.equal(
        persisted.providers.find((p) => p.id === provider.id).active,
        false
      )
      assert.equal(persisted.history.length, 10)
      const catalog = await readCatalog(secondPool)
      assert.equal(
        catalog.packages.find((p) => p.id === 'reguler').price,
        550000
      )
      assert.equal(
        catalog.packages.some((p) => p.id === newPackage.id),
        false
      )
      assert.equal(
        catalog.methods.some((m) => m.id === newMethod.id),
        false
      )
      assert.equal(
        catalog.providers.some((p) => p.id === provider.id),
        false
      )
      assert.deepEqual(Object.keys(catalog).sort(), [
        'methods',
        'packages',
        'providers',
        'sessions'
      ])
      assert.ok(
        catalog.providers.every((p) => !('capacity' in p) && !('active' in p))
      )
    } finally {
      await secondPool.end()
    }
  } finally {
    if (pool) await pool.end()
    if (created) await admin.query(`DROP DATABASE ${databaseName}`)
    await admin.end()
  }
})
