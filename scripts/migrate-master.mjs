import { readFile } from 'node:fs/promises'
import { loadEnvFile } from 'node:process'
import pg from 'pg'
try {
  loadEnvFile(new URL('../.env', import.meta.url))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const connectionString =
  process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL
if (!connectionString)
  throw new Error('Atur NUXT_DATABASE_URL pada frontend/.env terlebih dahulu.')
const client = new pg.Client({
  connectionString,
  connectionTimeoutMillis: 5000
})
try {
  await client.connect()
  await client.query(
    await readFile(
      new URL('../../backend/database/006_master_data.sql', import.meta.url),
      'utf8'
    )
  )
  console.log(
    'Migrasi 006 berhasil. Data katalog dan transaksi lama dipertahankan.'
  )
} catch (error) {
  console.error(
    `Migrasi belum berhasil (${error.code ?? 'koneksi'}). Periksa konfigurasi database dan jalankan migrasi 001 serta 005 dahulu.`
  )
  process.exitCode = 1
} finally {
  await client.end()
}
