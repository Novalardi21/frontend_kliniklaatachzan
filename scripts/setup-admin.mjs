import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { hashPassword } from '../server/utils/password.ts'

const input = []
for await (const part of process.stdin) input.push(part)
const settings = JSON.parse(Buffer.concat(input).toString('utf8'))
if (
  !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email) ||
  settings.email.length > 254 ||
  typeof settings.password !== 'string' ||
  settings.password.length < 12 ||
  settings.password.length > 128
) {
  throw new Error('Email tidak valid atau password harus 12–128 karakter.')
}
const url = new URL('postgresql://127.0.0.1')
url.hostname = settings.host
url.port = String(settings.port)
url.username = encodeURIComponent(settings.dbUser)
url.password = encodeURIComponent(settings.dbPassword)
url.pathname = `/${encodeURIComponent(settings.database)}`
const client = new pg.Client({
  connectionString: url.toString(),
  connectionTimeoutMillis: 5000
})
try {
  await client.connect()
  const migration = await readFile(
    new URL('../../backend/database/005_auth.sql', import.meta.url),
    'utf8'
  )
  await client.query(migration)
  const existing = await client.query(
    'SELECT email FROM clinic.users WHERE id = 1'
  )
  if (existing.rowCount === 0) {
    const hash = await hashPassword(settings.password)
    await client.query(
      `INSERT INTO clinic.users(id,email,full_name,password_hash)
      VALUES (1,$1,$2,$3)`,
      [settings.email.toLowerCase().trim(), 'Admin Klinik', hash]
    )
    console.log(
      'Satu akun admin berhasil dibuat. Password hanya disimpan sebagai hash.'
    )
  } else {
    console.log('Akun admin sudah ada; email dan password lama dipertahankan.')
  }
  const envPath = fileURLToPath(new URL('../.env', import.meta.url))
  let contents = ''
  try {
    contents = await readFile(envPath, 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const line = `NUXT_DATABASE_URL=${url.toString()}`
  contents = /^NUXT_DATABASE_URL=.*$/m.test(contents)
    ? contents.replace(/^NUXT_DATABASE_URL=.*$/m, () => line)
    : `${contents.trimEnd()}\n${line}\n`
  await writeFile(envPath, contents, { mode: 0o600 })
  console.log('Koneksi server disimpan di frontend/.env (diabaikan Git).')
  console.log(
    'Restart pnpm dev, lalu masuk menggunakan email dan password yang Anda buat.'
  )
} catch (error) {
  // Jangan mencetak connection string atau isi request.
  console.error(
    `Setup gagal: ${error.code ?? 'periksa koneksi database dan migrasi'}.`
  )
  process.exitCode = 1
} finally {
  settings.password = ''
  settings.dbPassword = ''
  await client.end()
}
