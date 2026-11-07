import { database } from '../utils/database'
import { readCatalog } from '../utils/catalog-store'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  try {
    return await readCatalog(database())
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Katalog layanan belum dapat dimuat. Silakan coba kembali.'
    })
  }
})
