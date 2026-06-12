import { scrypt } from 'node:crypto'
import { db } from './index'
import { categories, products } from './schema'
import { accounts, users } from './schema/auth'

function encodeHex(buf: Buffer | Uint8Array): string {
  return Buffer.from(buf).toString('hex')
}

async function hashPassword(password: string): Promise<string> {
  const N = 16384, r = 16, p = 1, dkLen = 64
  const saltBytes = new Uint8Array(16)
  crypto.getRandomValues(saltBytes)
  const salt = encodeHex(saltBytes)
  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password.normalize('NFKC'), salt, dkLen,
      { N, r, p, maxmem: 128 * N * r * 2 },
      (err, buf) => (err ? reject(err) : resolve(buf)),
    )
  })
  return `${salt}:${encodeHex(key)}`
}

const ADMIN_EMAIL = 'admin@crack.com'
const ADMIN_PASSWORD = 'Admin@1234'
const ADMIN_NAME = 'Admin'

async function seed() {
  console.log('🌱 Seeding database...')

  // ── Admin user ─────────────────────────────────────────────
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
    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      accountId: insertedAdmin.id,
      providerId: 'credential',
      userId: insertedAdmin.id,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing()
    console.log(`✅ Admin seeded → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
  } else {
    console.log(`⚠️  Admin already exists — skipped`)
  }

  // ── Categories ─────────────────────────────────────────────
  const categoryData = [
    { name: 'One Sound Crackers',         slug: 'one-sound-crackers'         },
    { name: 'Flower Pots (10pcs)',         slug: 'flower-pots'                },
    { name: 'Ground Chakkars',            slug: 'ground-chakkars'            },
    { name: 'Sparklers',                  slug: 'sparklers'                  },
    { name: 'Pencil Sparkling Varieties', slug: 'pencil-sparkling-varieties' },
    { name: 'Sky Rockets',                slug: 'sky-rockets'                },
    { name: 'Bijili Crackers',            slug: 'bijili-crackers'            },
    { name: 'Bomb Crackers',              slug: 'bomb-crackers'              },
    { name: 'Paper Bomb',                 slug: 'paper-bomb'                 },
    { name: 'Wala Garland',               slug: 'wala-garland'               },
    { name: 'Sky Night Celebration',      slug: 'sky-night-celebration'      },
    { name: 'Night Fancy Celebration',    slug: 'night-fancy-celebration'    },
    { name: 'Fancy Flower Balls',         slug: 'fancy-flower-balls'         },
    { name: 'Color Matches',              slug: 'color-matches'              },
    { name: 'Children Gun Items',         slug: 'children-gun-items'         },
    { name: 'New Arrivals',               slug: 'new-arrivals'               },
    { name: 'New Arrivals 2026',          slug: 'new-arrivals-2026'          },
    { name: 'Combo Pack',                 slug: 'combo-pack'                 },
  ]

  const insertedCategories = await db
    .insert(categories)
    .values(categoryData.map((c) => ({ ...c, image: '' })))
    .onConflictDoNothing()
    .returning()

  console.log(`✅ ${insertedCategories.length} categories seeded`)

  // Build slug → id map (covers both fresh inserts and pre-existing rows)
  const allCategories = await db.query.categories.findMany()
  const cat = Object.fromEntries(allCategories.map((c) => [c.slug, c.id]))

  // ── Products ───────────────────────────────────────────────
  const productRows = [
    // ── ONE SOUND CRACKERS ────────────────────────────────
    { name: '3½ Lakshmi PKT',       price: 13,  originalPrice: 65,  packSize: '1 PKT',  categoryId: cat['one-sound-crackers'] },
    { name: '4 Lakshmi PKT',        price: 16,  originalPrice: 80,  packSize: '1 PKT',  categoryId: cat['one-sound-crackers'] },
    { name: '4 Lakshmi Deluxe PKT', price: 20,  originalPrice: 100, packSize: '1 PKT',  categoryId: cat['one-sound-crackers'] },
    { name: 'Gold Lakshmi PKT',     price: 32,  originalPrice: 160, packSize: '1 PKT',  categoryId: cat['one-sound-crackers'] },
    { name: 'Hulk Deluxe PKT',      price: 34,  originalPrice: 170, packSize: '1 PKT',  categoryId: cat['one-sound-crackers'] },
    { name: 'Bagubali PKT',         price: 40,  originalPrice: 200, packSize: '1 PKT',  categoryId: cat['one-sound-crackers'] },
    { name: 'Jallikattu PKT',       price: 45,  originalPrice: 225, packSize: '1 PKT',  categoryId: cat['one-sound-crackers'] },
    { name: 'Two Sound PKT',        price: 32,  originalPrice: 160, packSize: '1 PKT',  categoryId: cat['one-sound-crackers'] },
    { name: '2¾ Kuruvi PKT',        price: 9,   originalPrice: 45,  packSize: '1 PKT',  categoryId: cat['one-sound-crackers'] },
    { name: 'Elephant Deluxe BOX',  price: 32,  originalPrice: 160, packSize: '1 BOX',  categoryId: cat['one-sound-crackers'] },

    // ── FLOWER POTS (10pcs) ───────────────────────────────
    { name: 'Flowerpots Small BOX',             price: 48,  originalPrice: 240,  packSize: '10 pcs', categoryId: cat['flower-pots'] },
    { name: 'Flowerpots Big BOX',               price: 90,  originalPrice: 450,  packSize: '10 pcs', categoryId: cat['flower-pots'] },
    { name: 'Flowerpots Special BOX',           price: 135, originalPrice: 675,  packSize: '10 pcs', categoryId: cat['flower-pots'] },
    { name: 'Flowerpots Ashoka BOX',            price: 165, originalPrice: 825,  packSize: '10 pcs', categoryId: cat['flower-pots'] },
    { name: 'Flowerpots Color Koti BOX',        price: 240, originalPrice: 1200, packSize: '10 pcs', categoryId: cat['flower-pots'] },
    { name: 'Flowerpots Multicolor Giant BOX',  price: 325, originalPrice: 1625, packSize: '10 pcs', categoryId: cat['flower-pots'] },
    { name: 'Flowerpots Color Koti Deluxe BOX', price: 320, originalPrice: 1600, packSize: '10 pcs', categoryId: cat['flower-pots'] },
    { name: 'Flower Pots Deluxe BOX',           price: 160, originalPrice: 800,  packSize: '5 pcs',  categoryId: cat['flower-pots'] },
    { name: 'Tri Color BOX',                    price: 240, originalPrice: 1200, packSize: '5 pcs',  categoryId: cat['flower-pots'] },
    { name: 'Lucky Red and Green BOX',          price: 30,  originalPrice: 150,  packSize: '5 pcs',  categoryId: cat['flower-pots'] },

    // ── GROUND CHAKKERS ───────────────────────────────────
    { name: 'Chakker Small BOX',        price: 35,  originalPrice: 175, packSize: '1 BOX',  categoryId: cat['ground-chakkars'] },
    { name: 'Chakker Small 25 Pcs BOX', price: 110, originalPrice: 550, packSize: '25 pcs', categoryId: cat['ground-chakkars'] },
    { name: 'Chakker Ashoka BOX',       price: 75,  originalPrice: 375, packSize: '1 BOX',  categoryId: cat['ground-chakkars'] },
    { name: 'Chakker Special BOX',      price: 120, originalPrice: 600, packSize: '1 BOX',  categoryId: cat['ground-chakkars'] },
    { name: 'Chakker Deluxe BOX',       price: 150, originalPrice: 750, packSize: '1 BOX',  categoryId: cat['ground-chakkars'] },
    { name: 'Disco Wheel BOX',          price: 70,  originalPrice: 350, packSize: '5 pcs',  categoryId: cat['ground-chakkars'] },
    { name: 'Whistling Wheel BOX',      price: 135, originalPrice: 675, packSize: '5 pcs',  categoryId: cat['ground-chakkars'] },

    // ── SPARKLERS ─────────────────────────────────────────
    { name: '7cm Electric Sparklers BOX',  price: 9,   originalPrice: 45,  packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '7cm Color Sparklers BOX',     price: 10,  originalPrice: 50,  packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '7cm Green Sparklers BOX',     price: 12,  originalPrice: 60,  packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '7cm Red Sparklers BOX',       price: 14,  originalPrice: 70,  packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '10cm Electric Sparklers BOX', price: 21,  originalPrice: 105, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '10cm Color Sparklers BOX',    price: 24,  originalPrice: 120, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '10cm Green Sparklers BOX',    price: 25,  originalPrice: 125, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '10cm Red Sparklers BOX',      price: 26,  originalPrice: 130, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '12cm Electric Sparklers BOX', price: 34,  originalPrice: 170, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '12cm Color Sparklers BOX',    price: 35,  originalPrice: 175, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '12cm Green Sparklers BOX',    price: 36,  originalPrice: 180, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '12cm Red Sparklers BOX',      price: 38,  originalPrice: 190, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '15cm Electric Sparklers BOX', price: 48,  originalPrice: 240, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '15cm Color Sparklers BOX',    price: 50,  originalPrice: 250, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '15cm Green Sparklers BOX',    price: 52,  originalPrice: 260, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '15cm Red Sparklers BOX',      price: 54,  originalPrice: 270, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '30cm Electric Sparklers BOX', price: 48,  originalPrice: 240, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '30cm Color Sparklers BOX',    price: 50,  originalPrice: 250, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '30cm Green Sparklers BOX',    price: 52,  originalPrice: 260, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '30cm Red Sparklers BOX',      price: 54,  originalPrice: 270, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '50cm Electric Sparklers BOX', price: 150, originalPrice: 750, packSize: '1 BOX', categoryId: cat['sparklers'] },
    { name: '50cm Color Sparklers BOX',    price: 160, originalPrice: 800, packSize: '1 BOX', categoryId: cat['sparklers'] },

    // ── PENCIL SPARKLING VARIETIES ────────────────────────
    { name: '1½ Twinkling Star BOX',  price: 24,  originalPrice: 120,  packSize: '1 BOX', categoryId: cat['pencil-sparkling-varieties'] },
    { name: '4 Twinkling Star BOX',   price: 60,  originalPrice: 300,  packSize: '1 BOX', categoryId: cat['pencil-sparkling-varieties'] },
    { name: '7" Pencil BOX',          price: 30,  originalPrice: 150,  packSize: '1 BOX', categoryId: cat['pencil-sparkling-varieties'] },
    { name: '10" Pencil BOX',         price: 60,  originalPrice: 300,  packSize: '1 BOX', categoryId: cat['pencil-sparkling-varieties'] },
    { name: 'Ultra-Color Pencil BOX', price: 70,  originalPrice: 350,  packSize: '3 pcs', categoryId: cat['pencil-sparkling-varieties'] },
    { name: 'Sivakasi Special BOX',   price: 210, originalPrice: 1050, packSize: '1 BOX', categoryId: cat['pencil-sparkling-varieties'] },
    { name: 'Pop Corn Pencil BOX',    price: 180, originalPrice: 900,  packSize: '5 pcs', categoryId: cat['pencil-sparkling-varieties'] },
    { name: 'Cartoon Pots BOX',       price: 20,  originalPrice: 100,  packSize: '1 BOX', categoryId: cat['pencil-sparkling-varieties'] },

    // ── SKY ROCKETS ───────────────────────────────────────
    { name: 'Baby Rocket BOX',       price: 35,  originalPrice: 175, packSize: '1 BOX', categoryId: cat['sky-rockets'] },
    { name: 'Rocket Bomb BOX',       price: 80,  originalPrice: 400, packSize: '1 BOX', categoryId: cat['sky-rockets'] },
    { name: 'Lunic Rocket BOX',      price: 120, originalPrice: 600, packSize: '1 BOX', categoryId: cat['sky-rockets'] },
    { name: 'Two Sound Rocket BOX',  price: 130, originalPrice: 650, packSize: '1 BOX', categoryId: cat['sky-rockets'] },
    { name: 'Echo Music Rocket BOX', price: 145, originalPrice: 725, packSize: '1 BOX', categoryId: cat['sky-rockets'] },

    // ── BIJILI CRACKERS ───────────────────────────────────
    { name: 'Red Bijili 50 Pcs BOX',  price: 15, originalPrice: 75,  packSize: '50 pcs',  categoryId: cat['bijili-crackers'] },
    { name: 'Red Bijili 100 Pcs BOX', price: 35, originalPrice: 175, packSize: '100 pcs', categoryId: cat['bijili-crackers'] },

    // ── BOMB CRACKERS ─────────────────────────────────────
    { name: 'Bullet Bomb BOX',         price: 22,  originalPrice: 110,  packSize: '1 BOX', categoryId: cat['bomb-crackers'] },
    { name: 'Atom Bomb BOX',           price: 45,  originalPrice: 225,  packSize: '1 BOX', categoryId: cat['bomb-crackers'] },
    { name: 'Hydro Bomb BOX',          price: 65,  originalPrice: 325,  packSize: '1 BOX', categoryId: cat['bomb-crackers'] },
    { name: 'King Of King BOX',        price: 85,  originalPrice: 425,  packSize: '1 BOX', categoryId: cat['bomb-crackers'] },
    { name: 'Classic Bomb BOX',        price: 110, originalPrice: 550,  packSize: '1 BOX', categoryId: cat['bomb-crackers'] },
    { name: 'Dinosaur Bomb BOX',       price: 198, originalPrice: 990,  packSize: '1 BOX', categoryId: cat['bomb-crackers'] },
    { name: 'Agni Bomb BOX',           price: 190, originalPrice: 950,  packSize: '1 BOX', categoryId: cat['bomb-crackers'] },
    { name: 'Digital Deluxe Bomb BOX', price: 220, originalPrice: 1100, packSize: '1 BOX', categoryId: cat['bomb-crackers'] },

    // ── PAPER BOMB ────────────────────────────────────────
    { name: 'Adiyal ¼ Kg BOX',     price: 60,  originalPrice: 300,  packSize: '¼ kg',   categoryId: cat['paper-bomb'] },
    { name: 'Adiyal ½ Kg BOX',     price: 120, originalPrice: 600,  packSize: '½ kg',   categoryId: cat['paper-bomb'] },
    { name: 'Color Paper Vedi BOX', price: 90,  originalPrice: 450,  packSize: '5 pcs',  categoryId: cat['paper-bomb'] },
    { name: 'Avatar Bomb BOX',      price: 250, originalPrice: 1250, packSize: '10 pcs', categoryId: cat['paper-bomb'] },
    { name: 'Crorepathy Bomb BOX',  price: 294, originalPrice: 1470, packSize: '1 BOX',  categoryId: cat['paper-bomb'] },

    // ── WALA GARLAND ──────────────────────────────────────
    { name: '24 Deluxe PKT',        price: 45,   originalPrice: 225,   packSize: '1 PKT',  categoryId: cat['wala-garland'] },
    { name: '50 Deluxe PKT',        price: 105,  originalPrice: 525,   packSize: '1 PKT',  categoryId: cat['wala-garland'] },
    { name: '100 Deluxe PKT',       price: 210,  originalPrice: 1050,  packSize: '1 PKT',  categoryId: cat['wala-garland'] },
    { name: '28 Chorsa PKT',        price: 15,   originalPrice: 75,    packSize: '1 PKT',  categoryId: cat['wala-garland'] },
    { name: '28 Giant PKT',         price: 30,   originalPrice: 150,   packSize: '1 PKT',  categoryId: cat['wala-garland'] },
    { name: '56 Giant PKT',         price: 45,   originalPrice: 225,   packSize: '1 PKT',  categoryId: cat['wala-garland'] },
    { name: '100 Wala BOX',         price: 40,   originalPrice: 200,   packSize: '100',    categoryId: cat['wala-garland'] },
    { name: '200 Wala BOX',         price: 80,   originalPrice: 400,   packSize: '200',    categoryId: cat['wala-garland'] },
    { name: '300 Wala BOX',         price: 105,  originalPrice: 525,   packSize: '300',    categoryId: cat['wala-garland'] },
    { name: '600 Wala BOX',         price: 135,  originalPrice: 675,   packSize: '600',    categoryId: cat['wala-garland'] },
    { name: '1000 Wala BOX',        price: 150,  originalPrice: 750,   packSize: '1000',   categoryId: cat['wala-garland'] },
    { name: '1000 Wala Power BOX',  price: 250,  originalPrice: 1250,  packSize: '1000',   categoryId: cat['wala-garland'] },
    { name: '2000 Wala BOX',        price: 520,  originalPrice: 2600,  packSize: '2000',   categoryId: cat['wala-garland'] },
    { name: '5000 Wala BOX',        price: 950,  originalPrice: 4750,  packSize: '5000',   categoryId: cat['wala-garland'] },
    { name: '5000 Wala Power BOX',  price: 1450, originalPrice: 7250,  packSize: '5000',   categoryId: cat['wala-garland'] },
    { name: '10000 Wala BOX',       price: 1800, originalPrice: 9000,  packSize: '10000',  categoryId: cat['wala-garland'] },
    { name: '10000 Wala Power BOX', price: 2400, originalPrice: 12000, packSize: '10000',  categoryId: cat['wala-garland'] },

    // ── SKY NIGHT CELEBRATION ─────────────────────────────
    { name: 'Chota Pipe Multi Color BOX',     price: 45,   originalPrice: 225,   packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: '7 Shot BOX',                     price: 110,  originalPrice: 550,   packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: 'Sky King Multi Color BOX',       price: 135,  originalPrice: 675,   packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: 'Penta Park Multi Color BOX',     price: 170,  originalPrice: 850,   packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: '2½ Fancy Pipe BOX',              price: 250,  originalPrice: 1250,  packSize: '3 pcs', categoryId: cat['sky-night-celebration'] },
    { name: '2½ Fancy BOX',                   price: 120,  originalPrice: 600,   packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: '3½ Fancy BOX',                   price: 220,  originalPrice: 1100,  packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: '3½ Fancy Double Ball BOX',       price: 370,  originalPrice: 1850,  packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: '3½ Fancy Pipe BOX',              price: 550,  originalPrice: 2750,  packSize: '2 pcs', categoryId: cat['sky-night-celebration'] },
    { name: '4" Fancy BOX',                   price: 280,  originalPrice: 1400,  packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: '4" Fancy 2 Pcs BOX',            price: 650,  originalPrice: 3250,  packSize: '2 pcs', categoryId: cat['sky-night-celebration'] },
    { name: '12 Step BOX',                    price: 330,  originalPrice: 1650,  packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: '12 Shot BOX',                    price: 180,  originalPrice: 900,   packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: '30 Peacock Shot BOX',            price: 350,  originalPrice: 1750,  packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: '30 Shot Multi Color BOX',        price: 380,  originalPrice: 1900,  packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: '60 Shot Multi Color BOX',        price: 750,  originalPrice: 3750,  packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: '120 Shot Multi Color BOX',       price: 1450, originalPrice: 7250,  packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: '240 Shot Multi Color BOX',       price: 2600, originalPrice: 13000, packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: '10x10 Sizeling Shot BOX',        price: 2700, originalPrice: 13500, packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: '10x10 Tail Light BOX',           price: 3200, originalPrice: 16000, packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: '20x2.5" Thriller Set Grand BOX', price: 3200, originalPrice: 16000, packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },
    { name: '32x3.5" Mega Thriller Set BOX',  price: 4750, originalPrice: 23750, packSize: '1 BOX', categoryId: cat['sky-night-celebration'] },

    // ── NIGHT FANCY CELEBRATION ───────────────────────────
    { name: 'Asrafi BOX',                    price: 45,  originalPrice: 225,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: '4" Angry Bird BOX',             price: 60,  originalPrice: 300,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Ganga Jamuna BOX',              price: 75,  originalPrice: 375,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Photo Flash BOX',               price: 65,  originalPrice: 325,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Star Light BOX',                price: 70,  originalPrice: 350,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Dancing Butterfly BOX',         price: 75,  originalPrice: 375,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Feather Pop Shower BOX',        price: 130, originalPrice: 650,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Color Rain BOX',                price: 125, originalPrice: 625,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: '2" Sun Feast Multicolor BOX',   price: 140, originalPrice: 700,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Golden Rise BOX',               price: 125, originalPrice: 625,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Mini Siren BOX',                price: 135, originalPrice: 675,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Mega Siren BOX',                price: 165, originalPrice: 825,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Peacock Fancy BOX',             price: 165, originalPrice: 825,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Bada Peacock BOX',              price: 375, originalPrice: 1875, packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Silky Shower BOX',              price: 110, originalPrice: 550,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Tin Beer Shower BOX',           price: 120, originalPrice: 600,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Star Shown Popcorn BOX',        price: 170, originalPrice: 850,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Apple Shower BOX',              price: 180, originalPrice: 900,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: '3" Red Sun Shower BOX',         price: 210, originalPrice: 1050, packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Smoke Fountain Celebration BOX',price: 220, originalPrice: 1100, packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Bambara Spinner BOX',           price: 135, originalPrice: 675,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Tim Tom BOX',                   price: 85,  originalPrice: 425,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Kit Kat BOX',                   price: 30,  originalPrice: 150,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Zee Boom Baa BOX',              price: 15,  originalPrice: 75,   packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },
    { name: 'Electric Stone BOX',            price: 15,  originalPrice: 75,   packSize: '1 BOX', categoryId: cat['night-fancy-celebration'] },

    // ── FANCY FLOWER BALLS ────────────────────────────────
    { name: 'Chun Mun Barrels BOX', price: 195, originalPrice: 975,  packSize: '1 BOX', categoryId: cat['fancy-flower-balls'] },
    { name: 'Two in One BOX',       price: 450, originalPrice: 2250, packSize: '1 BOX', categoryId: cat['fancy-flower-balls'] },
    { name: 'Mega Deluxe BOX',      price: 550, originalPrice: 2750, packSize: '1 BOX', categoryId: cat['fancy-flower-balls'] },

    // ── COLOR MATCHES ─────────────────────────────────────
    { name: 'Royal Deluxe Matches BOX', price: 80,  originalPrice: 400,  packSize: '1 BOX', categoryId: cat['color-matches'] },
    { name: 'Royal Lamba Matches BOX',  price: 160, originalPrice: 800,  packSize: '1 BOX', categoryId: cat['color-matches'] },
    { name: 'Mega Laptop Matches BOX',  price: 250, originalPrice: 1250, packSize: '1 BOX', categoryId: cat['color-matches'] },

    // ── CHILDREN GUN ITEMS ────────────────────────────────
    { name: 'Roll Cap BOX',       price: 80,  originalPrice: 400, packSize: '1 BOX', categoryId: cat['children-gun-items'] },
    { name: 'Snake Tablet BOX',   price: 35,  originalPrice: 175, packSize: '1 BOX', categoryId: cat['children-gun-items'] },
    { name: 'Small Size Gun BOX', price: 50,  originalPrice: 250, packSize: '1 BOX', categoryId: cat['children-gun-items'] },
    { name: 'Mega Gun BOX',       price: 100, originalPrice: 500, packSize: '1 BOX', categoryId: cat['children-gun-items'] },

    // ── NEW ARRIVALS ──────────────────────────────────────
    { name: 'King Star BOX',         price: 295, originalPrice: 1475, packSize: '1 BOX', categoryId: cat['new-arrivals'] },
    { name: 'Old is Gold PKT',       price: 190, originalPrice: 950,  packSize: '1 PKT', categoryId: cat['new-arrivals'] },
    { name: 'Star Wheel PKT',        price: 175, originalPrice: 875,  packSize: '1 PKT', categoryId: cat['new-arrivals'] },
    { name: 'Water Queen Falls PKT', price: 190, originalPrice: 950,  packSize: '1 PKT', categoryId: cat['new-arrivals'] },
    { name: 'Top Gun Fancy PKT',     price: 210, originalPrice: 1050, packSize: '1 PKT', categoryId: cat['new-arrivals'] },
    { name: 'Moon Light BOX',        price: 70,  originalPrice: 350,  packSize: '1 BOX', categoryId: cat['new-arrivals'] },
    { name: 'Helicopter BOX',        price: 130, originalPrice: 650,  packSize: '1 BOX', categoryId: cat['new-arrivals'] },

    // ── NEW ARRIVALS 2026 ─────────────────────────────────
    { name: 'Fun Zone Crackling BOX',       price: 370, originalPrice: 1850, packSize: '5 pcs', categoryId: cat['new-arrivals-2026'] },
    { name: 'Rotating Sparklers BOX',       price: 150, originalPrice: 750,  packSize: '1 BOX', categoryId: cat['new-arrivals-2026'] },
    { name: 'Magic Whip BOX',               price: 145, originalPrice: 725,  packSize: '1 BOX', categoryId: cat['new-arrivals-2026'] },
    { name: 'Star World BOX',               price: 160, originalPrice: 800,  packSize: '5 pcs', categoryId: cat['new-arrivals-2026'] },
    { name: '4" Pipe Golden Eye BOX',       price: 370, originalPrice: 1850, packSize: '1 BOX', categoryId: cat['new-arrivals-2026'] },
    { name: '4" Pipe Wow Purple BOX',       price: 370, originalPrice: 1850, packSize: '1 BOX', categoryId: cat['new-arrivals-2026'] },
    { name: '4" Pipe Wow Orange BOX',       price: 370, originalPrice: 1850, packSize: '1 BOX', categoryId: cat['new-arrivals-2026'] },
    { name: '30 Flash Color Shot BOX',      price: 420, originalPrice: 2100, packSize: '1 BOX', categoryId: cat['new-arrivals-2026'] },
    { name: '30 Crack Jack Color Shot BOX', price: 480, originalPrice: 2400, packSize: '1 BOX', categoryId: cat['new-arrivals-2026'] },
    { name: 'Blast Gun Pistol 5G BOX',      price: 210, originalPrice: 1050, packSize: '1 BOX', categoryId: cat['new-arrivals-2026'] },

    // ── COMBO PACK ────────────────────────────────────────
    { name: '3000 Combo Pack',        price: 3000, originalPrice: 3000, packSize: '1 Case', categoryId: cat['combo-pack'] },
    { name: '5000 Family Pack',       price: 5000, originalPrice: 5000, packSize: '1 Case', categoryId: cat['combo-pack'] },
    { name: '7000 Thala Diwali Pack', price: 7000, originalPrice: 7000, packSize: '1 Case', categoryId: cat['combo-pack'] },
  ].filter((p) => {
    if (!p.categoryId) {
      console.warn(`⚠️  Skipping "${p.name}" — category not found`)
      return false
    }
    return true
  }).map((p) => ({
    ...p,
    categoryId: p.categoryId as string,
    description: `${p.name} — Premium quality cracker from DS Cracker. MRP ₹${p.originalPrice}, available at 80% discount.`,
    stock: 100,
    images: [] as string[],
    isActive: true,
    rating: '0',
    reviewCount: 0,
  }))

  // Insert in batches of 50 to avoid query size limits
  let totalInserted = 0
  const batchSize = 50
  for (let i = 0; i < productRows.length; i += batchSize) {
    const batch = productRows.slice(i, i + batchSize)
    const inserted = await db
      .insert(products)
      .values(batch)
      .onConflictDoNothing()
      .returning()
    totalInserted += inserted.length
  }

  console.log(`✅ ${totalInserted} products seeded`)
  console.log('🎉 Seed complete')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})