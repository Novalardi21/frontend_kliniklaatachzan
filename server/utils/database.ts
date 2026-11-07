import { Pool } from 'pg'
let pool: Pool | undefined
export function database() {
  if (!pool) {
    const config = useRuntimeConfig()
    if (!config.databaseUrl) {
      throw createError({
        statusCode: 503,
        statusMessage:
          'Database belum dikonfigurasi. Atur NUXT_DATABASE_URL pada server.'
      })
    }
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 5,
      connectionTimeoutMillis: 5000
    })
    pool.on('error', () => {
      /* Request berikutnya menangani koneksi yang terputus. */
    })
  }
  return pool
}
