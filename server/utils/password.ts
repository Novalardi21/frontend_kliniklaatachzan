import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const options = { N: 65536, r: 8, p: 1, maxmem: 96 * 1024 * 1024 }
function derive(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, options, (error, result) => {
      if (error) reject(error)
      else resolve(result)
    })
  })
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  return `scrypt$${salt}$${(await derive(password, salt)).toString('hex')}`
}
const dummyHash = `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`
export async function verifyPassword(password: string, hash = dummyHash) {
  const parts = hash.split('$')
  if (
    parts.length !== 3 ||
    parts[0] !== 'scrypt' ||
    !/^[a-f0-9]{32}$/.test(parts[1]!) ||
    !/^[a-f0-9]{128}$/.test(parts[2]!)
  ) {
    await derive(password, '0'.repeat(32))
    return false
  }
  return timingSafeEqual(
    await derive(password, parts[1]!),
    Buffer.from(parts[2]!, 'hex')
  )
}
