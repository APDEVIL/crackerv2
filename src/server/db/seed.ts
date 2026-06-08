import { scrypt } from 'node:crypto'
import { db } from './index'
import { categories } from './schema'
import { accounts, users } from './schema/auth'

// ── Exact replica of oslo's Scrypt.hash() ─────────────────
// better-auth uses oslo internally; format is `salt:hash` (both hex-encoded)
// params: N=16384, r=16, p=1, dkLen=64, password normalized to NFKC
function encodeHex(buf: Buffer | Uint8Array): string {
  return Buffer.from(buf).toString('hex')
}

async function hashPassword(password: string): Promise<string> {
  const N = 16384,
    r = 16,
    p = 1,
    dkLen = 64
  // oslo uses crypto.getRandomValues(new Uint8Array(16)) for salt
  const saltBytes = new Uint8Array(16)
  crypto.getRandomValues(saltBytes)
  const salt = encodeHex(saltBytes) // 32-char hex string

  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password.normalize('NFKC'), // oslo normalizes to NFKC
      salt,
      dkLen,
      { N, r, p, maxmem: 128 * N * r * 2 },
      (err, buf) => (err ? reject(err) : resolve(buf)),
    )
  })

  return `${salt}:${encodeHex(key)}` // "salt:hash"
}

// ── Config — change before running ───────────────────────
const ADMIN_EMAIL = 'admin@crack.com'
const ADMIN_PASSWORD = 'Admin@1234'
const ADMIN_NAME = 'Admin'

async function seed() {
  console.log('🌱 Seeding database...')

  // ── Admin user ───────────────────────────────────────────
  const adminId = crypto.randomUUID()
  const hashedPassword = await hashPassword(ADMIN_PASSWORD)

  const [insertedAdmin] = await db
    .insert(users)
    .values({
      id: adminId,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      emailVerified: true,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning()

  if (insertedAdmin) {
    await db
      .insert(accounts)
      .values({
        id: crypto.randomUUID(),
        accountId: insertedAdmin.id,
        providerId: 'credential',
        userId: insertedAdmin.id,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing()

    console.log(`✅ Admin seeded → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
  } else {
    console.log(`⚠️  Admin already exists — skipped`)
  }

  // ── Categories ───────────────────────────────────────────
  const categoryData = [
    { name: 'One Sound Crackers', slug: 'one-sound-crackers' },
    { name: 'Flower Pots (10pcs)', slug: 'flower-pots' },
    { name: 'Ground Chakkars', slug: 'ground-chakkars' },
    { name: 'Sparklers', slug: 'sparklers' },
    { name: 'Pencil Sparkling Varieties', slug: 'pencil-sparkling-varieties' },
    { name: 'Sky Rockets', slug: 'sky-rockets' },
    { name: 'Bijili Crackers', slug: 'bijili-crackers' },
    { name: 'Bomb Crackers', slug: 'bomb-crackers' },
    { name: 'Paper Bomb', slug: 'paper-bomb' },
    { name: 'Wala Garland', slug: 'wala-garland' },
    { name: 'Sky Night Celebration', slug: 'sky-night-celebration' },
    { name: 'Night Fancy Celebration', slug: 'night-fancy-celebration' },
    { name: 'Fancy Flower Balls', slug: 'fancy-flower-balls' },
    { name: 'Color Matches', slug: 'color-matches' },
    { name: 'Children Gun Items', slug: 'children-gun-items' },
    { name: 'New Arrivals', slug: 'new-arrivals' },
    { name: 'New Arrivals 2026', slug: 'new-arrivals-2026' },
    { name: 'Combo Pack', slug: 'combo-pack' },
  ]

  const insertedCategories = await db
    .insert(categories)
    .values(categoryData.map((c) => ({ ...c, image: '' })))
    .onConflictDoNothing()
    .returning()

  console.log(`✅ ${insertedCategories.length} categories seeded`)
  console.log('🎉 Seed complete')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
