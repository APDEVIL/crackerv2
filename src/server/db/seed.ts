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

// ── Local image paths (public/products) ─────────────────────
// Set of every file actually present in public/products
const AVAILABLE_IMAGES = new Set([
  '1-quarterhalfthree-quarter1-Twinkling-star-BOX.jpg-Twinkling-star-BOX.jpg',
  '10-Cm-Color-Sparklers-BOX.jpg',
  '10-Cm-Electric-Sparklers-BOX.jpg',
  '10-Cm-Green-Sparklers-BOX.jpg',
  '10-Cm-Red-Sparklers-BOX.jpg',
  '10-pencil-box.jpg',
  '100-Deluxe-PKT.jpg',
  '100-Wala-BOX.jpg',
  '1000-Wala-BOX.jpg',
  '1000-Wala-Power-BOX.jpg',
  '10000-BOX.jpg',
  '10000-Wala-Power-BOX.jpg',
  '10cm-Color-Sparklers-BOX.jpg',
  '10cm-Electric-Sparklers-BOX.jpg',
  '10cm-Green-Sparklers-BOX.jpg',
  '10cm-Red-Sparklers-BOX.jpg',
  '10x10-Sizeling-Shot-BOX.jpg',
  '10X10-Tail-Light-BOX.jpg',
  '12-Cm-Color-Sparklers-BOX.jpg',
  '12-Cm-Electric-Sparklers-BOX.jpg',
  '12-Cm-Green-Sparklers-BOX.jpg',
  '12-Cm-Red-Sparklers-BOX.jpg',
  '12-Shot-BOX.jpg',
  '12-Step-BOX.jpg',
  '120-Shot-Multi-Color-BOX.jpg',
  '15-Cm-Color-Sparklers-BOX.jpg',
  '15-Cm-Electric-Sparklers-BOX.jpg',
  '15-Cm-Green-Sparklers-BOX.jpg',
  '15-Cm-Red-Sparklers-BOX.jpg',
  '1quarterhalfthree-quarter1-Twinkling-Star-BOX.jpg-Twinkling-Star-BOX.jpg',
  '2-quarterhalfthree-quarter2-Fancy-BOX.jpg-Fancy-BOX.jpg',
  '2-quarterhalfthree-quarter2-Fancy-Pipe-3-Pcs-BOX.jpg-Fancy-Pipe-3-Pcs-BOX.jpg',
  '2-quarterhalfthree-quarter2-Kuruvi-PKT.jpg-Kuruvi-PKT.jpg',
  '2-Sun-feast-Multicolor-BOX.jpg',
  '20-x-2.5Thriller-Set-Grand-BOX.jpg',
  '200-Wala-BOX.jpg',
  '2000-Wala-BOX.jpg',
  '24-Deluxe-PKT.jpg',
  '240-Shot-Multi-Color-BOX.jpg',
  '28-Chorsa-PKT.jpg',
  '3-quarterhalfthree-quarter3-Lakshmi-PKT.jpg-Lakshmi-PKT.jpg',
  '3-Red-Sun-Shower-BOX.jpg',
  '30-Cm-Color-Sparklers-BOX.jpg',
  '30-Cm-Electric-Sparklers-BOX.jpg',
  '30-Cm-Green-Sparklers-BOX.jpg',
  '30-Cm-Red-Sparklers-BOX.jpg',
  '30-Peacock-Shot-BOX.jpg',
  '30-Shot-Multi-Color-BOX.jpg',
  '300-Wala-BOX.jpg',
  '32-x-3.5Mega-Thriller-Set-Grand-BOX.jpg',
  '4-Fancy-BOX.jpg',
  '4-Lakshmi-Deluxe-PKT.jpg',
  '4-Lakshmi-PKT.jpg',
  '4-Pipe-Golden-Eye-BOX.jpg',
  '4-Pipe-Wow-Purple-BOX.jpg',
  '4-Twinkling-Star-BOX.jpg',
  '50-Cm-Color-Sparklers-BOX.jpg',
  '50-Cm-Electric-Sparklers-BOX.jpg',
  '50-Deluxe-PKT.jpg',
  '5000-Wala-BOX.jpg',
  '5000-Wala-Power-BOX.jpg',
  '56-Giant-PKT.jpg',
  '60-Shot-Multi-Color-BOX.jpg',
  '600-Wala-BOX.jpg',
  '7-Cm-Color-Sparklers-BOX.jpg',
  '7-Cm-Electric-Sparklers-BOX.jpg',
  '7-Cm-Green-Sparklers-BOX.jpg',
  '7-Cm-Red-Sparklers-BOX.jpg',
  '7-Pencil-BOX.jpg',
  '7-Shot-BOX.jpg',
  'adiyal-kg-box.jpg',
  'Adiyal-quarterhalfthree-quarterAdiyal-Kg-BOX.jpg-Kg-BOX.jpg',
  'Agni-Bomb-BOX.jpg',
  'Asrafi-BOX.jpg',
  'Atom-Bomb-BOX.jpg',
  'Avatar-Bomb-10-Pcs-BOX.jpg',
  'Baby-Rocket-BOX.jpg',
  'Bada-Peacock-BOX.jpg',
  'Bagubali-PKT.jpg',
  'Bambara-Spinner-BOX.jpg',
  'Bullet-Bomb-BOX.jpg',
  'Chakker-Deluxe-BOX.jpg',
  'Chakker-Small-BOX.jpg',
  'Chakker-Special-BOX.jpg',
  'ChakkerAshoka-BOX.jpg',
  'Chun-Mun-Barrels-BOX.jpg',
  'Classic-Bomb-BOX.jpg',
  'Dancing-Butterfly-BOX.jpg',
  'Digital-Deluxe-Bomb-BOX.jpg',
  'Dinosaur-Bomb-BOX.jpg',
  'Disco-Wheel-5-Pcs-BOX.jpg',
  'Electric-Stone-BOX.jpg',
  'Elephant-Deluxe-BOX.jpg',
  'Flower-Pots-Deluxe-5Pcs-BOX.jpg',
  'Flowerpots-Ashoka-BOX.jpg',
  'Flowerpots-Big-BOX.jpg',
  'Flowerpots-Color-Koti-BOX.jpg',
  'Flowerpots-Color-Koti-Deluxe-BOX.jpg',
  'Flowerpots-Multicolor-Giant-BOX.jpg',
  'Flowerpots-Small-BOX.jpg',
  'Flowerpots-Special-BOX.jpg',
  'Fun-Zone-Crackling-5Pcs-BOX.jpg',
  'Ganga-Jamuna-BOX.jpg',
  'Gold-Lakshmi-PKT.JPEG',
  'Hydro-Bomb-BOX.jpg',
  'King-Of-King-BOX.jpg',
  'King-Star-BOX.jpg',
  'Kit-Kat-BOX.jpg',
  'Lucky-Red-and-Green-5pcs-1-BOX.jpg',
  'Lunic-Rocket-BOX.jpg',
  'Magic-whip-BOX.jpg',
  'Mega-Deluxe-BOX.jpg',
  'Mega-Laptop-Matches-BOX.jpg',
  'Mega-Siren-BOX.jpg',
  'Mini-Siren-BOX.jpg',
  'Old-is-Gold-PKT.jpg',
  'Peacock-Fancy-BOX.jpg',
  'Penta-Park-Multi-Color-BOX.jpg',
  'Red-Bijili-100-Pcs-BOX.jpg',
  'Red-Bijili-50-Pcs-BOX.jpg',
  'Rocket-Bomb-BOX.jpg',
  'Roll-Cap-BOX.jpg',
  'Rotating-Sparklers-BOX.jpg',
  'Royal-Deluxe-Matches-BOX.jpg',
  'Royal-Lamba-Matches-BOX.jpg',
  'SivakasiSpecail-BOX.jpg',
  'Sky-King-Multi-Color-BOX.jpg',
  'Snake-Tablet-BOX.jpg',
  'Tin-Beer-Shower-BOX.jpg',
  'Tri-Color-5-Pcs-BOX.jpg',
  'Two-Sound-PKT.jpg',
  'Two-Sound-Rocket-BOX.jpg',
  'Ultra-Color-Pencil-3-Pcs-BOX.jpg',
  'Water-Queen-Falls-PKT.jpg',
  'Whistling-Wheel-5-Pcs-BOX.jpg',
  'Zee-Boom-Baa-BOX.jpg',
])

function img(filename: string): string[] {
  return AVAILABLE_IMAGES.has(filename) ? [`/products/${filename}`] : []
}

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

  const allCategories = await db.query.categories.findMany()
  const cat = Object.fromEntries(allCategories.map((c) => [c.slug, c.id]))

  // ── Products ───────────────────────────────────────────────
  const productRows = [
    // ── ONE SOUND CRACKERS ────────────────────────────────
    { name: '3½ Lakshmi PKT',       price: 13,  originalPrice: 65,  packSize: '1 PKT',  categoryId: cat['one-sound-crackers'], images: img('3-quarterhalfthree-quarter3-Lakshmi-PKT.jpg-Lakshmi-PKT.jpg') },
    { name: '4 Lakshmi PKT',        price: 16,  originalPrice: 80,  packSize: '1 PKT',  categoryId: cat['one-sound-crackers'], images: img('4-Lakshmi-PKT.jpg') },
    { name: '4 Lakshmi Deluxe PKT', price: 20,  originalPrice: 100, packSize: '1 PKT',  categoryId: cat['one-sound-crackers'], images: img('4-Lakshmi-Deluxe-PKT.jpg') },
    { name: 'Gold Lakshmi PKT',     price: 32,  originalPrice: 160, packSize: '1 PKT',  categoryId: cat['one-sound-crackers'], images: img('Gold-Lakshmi-PKT.JPEG') },
    { name: 'Hulk Deluxe PKT',      price: 34,  originalPrice: 170, packSize: '1 PKT',  categoryId: cat['one-sound-crackers'], images: img('4-Lakshmi-Deluxe-PKT.jpg') },
    { name: 'Bagubali PKT',         price: 40,  originalPrice: 200, packSize: '1 PKT',  categoryId: cat['one-sound-crackers'], images: img('Bagubali-PKT.jpg') },
    { name: 'Jallikattu PKT',       price: 45,  originalPrice: 225, packSize: '1 PKT',  categoryId: cat['one-sound-crackers'], images: img('Bagubali-PKT.jpg') },
    { name: 'Two Sound PKT',        price: 32,  originalPrice: 160, packSize: '1 PKT',  categoryId: cat['one-sound-crackers'], images: img('Two-Sound-PKT.jpg') },
    { name: '2¾ Kuruvi PKT',        price: 9,   originalPrice: 45,  packSize: '1 PKT',  categoryId: cat['one-sound-crackers'], images: img('2-quarterhalfthree-quarter2-Kuruvi-PKT.jpg-Kuruvi-PKT.jpg') },
    { name: 'Elephant Deluxe BOX',  price: 32,  originalPrice: 160, packSize: '1 BOX',  categoryId: cat['one-sound-crackers'], images: img('Elephant-Deluxe-BOX.jpg') },

    // ── FLOWER POTS ───────────────────────────────────────
    { name: 'Flowerpots Small BOX',             price: 48,  originalPrice: 240,  packSize: '10 pcs', categoryId: cat['flower-pots'], images: img('Flowerpots-Small-BOX.jpg') },
    { name: 'Flowerpots Big BOX',               price: 90,  originalPrice: 450,  packSize: '10 pcs', categoryId: cat['flower-pots'], images: img('Flowerpots-Big-BOX.jpg') },
    { name: 'Flowerpots Special BOX',           price: 135, originalPrice: 675,  packSize: '10 pcs', categoryId: cat['flower-pots'], images: img('Flowerpots-Special-BOX.jpg') },
    { name: 'Flowerpots Ashoka BOX',            price: 165, originalPrice: 825,  packSize: '10 pcs', categoryId: cat['flower-pots'], images: img('Flowerpots-Ashoka-BOX.jpg') },
    { name: 'Flowerpots Color Koti BOX',        price: 240, originalPrice: 1200, packSize: '10 pcs', categoryId: cat['flower-pots'], images: img('Flowerpots-Color-Koti-BOX.jpg') },
    { name: 'Flowerpots Multicolor Giant BOX',  price: 325, originalPrice: 1625, packSize: '10 pcs', categoryId: cat['flower-pots'], images: img('Flowerpots-Multicolor-Giant-BOX.jpg') },
    { name: 'Flowerpots Color Koti Deluxe BOX', price: 320, originalPrice: 1600, packSize: '10 pcs', categoryId: cat['flower-pots'], images: img('Flowerpots-Color-Koti-Deluxe-BOX.jpg') },
    { name: 'Flower Pots Deluxe BOX',           price: 160, originalPrice: 800,  packSize: '5 pcs',  categoryId: cat['flower-pots'], images: img('Flower-Pots-Deluxe-5Pcs-BOX.jpg') },
    { name: 'Tri Color BOX',                    price: 240, originalPrice: 1200, packSize: '5 pcs',  categoryId: cat['flower-pots'], images: img('Tri-Color-5-Pcs-BOX.jpg') },
    { name: 'Lucky Red and Green BOX',          price: 30,  originalPrice: 150,  packSize: '5 pcs',  categoryId: cat['flower-pots'], images: img('Lucky-Red-and-Green-5pcs-1-BOX.jpg') },

    // ── GROUND CHAKKERS ───────────────────────────────────
    { name: 'Chakker Small BOX',        price: 35,  originalPrice: 175, packSize: '1 BOX',  categoryId: cat['ground-chakkars'], images: img('Chakker-Small-BOX.jpg') },
    { name: 'Chakker Small 25 Pcs BOX', price: 110, originalPrice: 550, packSize: '25 pcs', categoryId: cat['ground-chakkars'], images: img('Chakker-Small-BOX.jpg') },
    { name: 'Chakker Ashoka BOX',       price: 75,  originalPrice: 375, packSize: '1 BOX',  categoryId: cat['ground-chakkars'], images: img('ChakkerAshoka-BOX.jpg') },
    { name: 'Chakker Special BOX',      price: 120, originalPrice: 600, packSize: '1 BOX',  categoryId: cat['ground-chakkars'], images: img('Chakker-Special-BOX.jpg') },
    { name: 'Chakker Deluxe BOX',       price: 150, originalPrice: 750, packSize: '1 BOX',  categoryId: cat['ground-chakkars'], images: img('Chakker-Deluxe-BOX.jpg') },
    { name: 'Disco Wheel BOX',          price: 70,  originalPrice: 350, packSize: '5 pcs',  categoryId: cat['ground-chakkars'], images: img('Disco-Wheel-5-Pcs-BOX.jpg') },
    { name: 'Whistling Wheel BOX',      price: 135, originalPrice: 675, packSize: '5 pcs',  categoryId: cat['ground-chakkars'], images: img('Whistling-Wheel-5-Pcs-BOX.jpg') },

    // ── SPARKLERS ─────────────────────────────────────────
    { name: '7cm Electric Sparklers BOX',  price: 9,   originalPrice: 45,  packSize: '1 BOX', categoryId: cat['sparklers'], images: img('7-Cm-Electric-Sparklers-BOX.jpg') },
    { name: '7cm Color Sparklers BOX',     price: 10,  originalPrice: 50,  packSize: '1 BOX', categoryId: cat['sparklers'], images: img('7-Cm-Color-Sparklers-BOX.jpg') },
    { name: '7cm Green Sparklers BOX',     price: 12,  originalPrice: 60,  packSize: '1 BOX', categoryId: cat['sparklers'], images: img('7-Cm-Green-Sparklers-BOX.jpg') },
    { name: '7cm Red Sparklers BOX',       price: 14,  originalPrice: 70,  packSize: '1 BOX', categoryId: cat['sparklers'], images: img('7-Cm-Red-Sparklers-BOX.jpg') },
    { name: '10cm Electric Sparklers BOX', price: 21,  originalPrice: 105, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('10cm-Electric-Sparklers-BOX.jpg') },
    { name: '10cm Color Sparklers BOX',    price: 24,  originalPrice: 120, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('10cm-Color-Sparklers-BOX.jpg') },
    { name: '10cm Green Sparklers BOX',    price: 25,  originalPrice: 125, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('10cm-Green-Sparklers-BOX.jpg') },
    { name: '10cm Red Sparklers BOX',      price: 26,  originalPrice: 130, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('10cm-Red-Sparklers-BOX.jpg') },
    { name: '12cm Electric Sparklers BOX', price: 34,  originalPrice: 170, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('12-Cm-Electric-Sparklers-BOX.jpg') },
    { name: '12cm Color Sparklers BOX',    price: 35,  originalPrice: 175, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('12-Cm-Color-Sparklers-BOX.jpg') },
    { name: '12cm Green Sparklers BOX',    price: 36,  originalPrice: 180, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('12-Cm-Green-Sparklers-BOX.jpg') },
    { name: '12cm Red Sparklers BOX',      price: 38,  originalPrice: 190, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('12-Cm-Red-Sparklers-BOX.jpg') },
    { name: '15cm Electric Sparklers BOX', price: 48,  originalPrice: 240, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('15-Cm-Electric-Sparklers-BOX.jpg') },
    { name: '15cm Color Sparklers BOX',    price: 50,  originalPrice: 250, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('15-Cm-Color-Sparklers-BOX.jpg') },
    { name: '15cm Green Sparklers BOX',    price: 52,  originalPrice: 260, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('15-Cm-Green-Sparklers-BOX.jpg') },
    { name: '15cm Red Sparklers BOX',      price: 54,  originalPrice: 270, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('15-Cm-Red-Sparklers-BOX.jpg') },
    { name: '30cm Electric Sparklers BOX', price: 48,  originalPrice: 240, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('30-Cm-Electric-Sparklers-BOX.jpg') },
    { name: '30cm Color Sparklers BOX',    price: 50,  originalPrice: 250, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('30-Cm-Color-Sparklers-BOX.jpg') },
    { name: '30cm Green Sparklers BOX',    price: 52,  originalPrice: 260, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('30-Cm-Green-Sparklers-BOX.jpg') },
    { name: '30cm Red Sparklers BOX',      price: 54,  originalPrice: 270, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('30-Cm-Red-Sparklers-BOX.jpg') },
    { name: '50cm Electric Sparklers BOX', price: 150, originalPrice: 750, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('50-Cm-Electric-Sparklers-BOX.jpg') },
    { name: '50cm Color Sparklers BOX',    price: 160, originalPrice: 800, packSize: '1 BOX', categoryId: cat['sparklers'], images: img('50-Cm-Color-Sparklers-BOX.jpg') },

    // ── PENCIL SPARKLING VARIETIES ────────────────────────
    { name: '1½ Twinkling Star BOX',  price: 24,  originalPrice: 120,  packSize: '1 BOX', categoryId: cat['pencil-sparkling-varieties'], images: img('1-quarterhalfthree-quarter1-Twinkling-star-BOX.jpg-Twinkling-star-BOX.jpg') },
    { name: '4 Twinkling Star BOX',   price: 60,  originalPrice: 300,  packSize: '1 BOX', categoryId: cat['pencil-sparkling-varieties'], images: img('4-Twinkling-Star-BOX.jpg') },
    { name: '7" Pencil BOX',          price: 30,  originalPrice: 150,  packSize: '1 BOX', categoryId: cat['pencil-sparkling-varieties'], images: img('7-Pencil-BOX.jpg') },
    { name: '10" Pencil BOX',         price: 60,  originalPrice: 300,  packSize: '1 BOX', categoryId: cat['pencil-sparkling-varieties'], images: img('10-pencil-box.jpg') },
    { name: 'Ultra-Color Pencil BOX', price: 70,  originalPrice: 350,  packSize: '3 pcs', categoryId: cat['pencil-sparkling-varieties'], images: img('Ultra-Color-Pencil-3-Pcs-BOX.jpg') },
    { name: 'Sivakasi Special BOX',   price: 210, originalPrice: 1050, packSize: '1 BOX', categoryId: cat['pencil-sparkling-varieties'], images: img('SivakasiSpecail-BOX.jpg') },
    { name: 'Pop Corn Pencil BOX',    price: 180, originalPrice: 900,  packSize: '5 pcs', categoryId: cat['pencil-sparkling-varieties'], images: img('Ultra-Color-Pencil-3-Pcs-BOX.jpg') },
    { name: 'Cartoon Pots BOX',       price: 20,  originalPrice: 100,  packSize: '1 BOX', categoryId: cat['pencil-sparkling-varieties'], images: img('10-pencil-box.jpg') },

    // ── SKY ROCKETS ───────────────────────────────────────
    { name: 'Baby Rocket BOX',       price: 35,  originalPrice: 175, packSize: '1 BOX', categoryId: cat['sky-rockets'], images: img('Baby-Rocket-BOX.jpg') },
    { name: 'Rocket Bomb BOX',       price: 80,  originalPrice: 400, packSize: '1 BOX', categoryId: cat['sky-rockets'], images: img('Rocket-Bomb-BOX.jpg') },
    { name: 'Lunic Rocket BOX',      price: 120, originalPrice: 600, packSize: '1 BOX', categoryId: cat['sky-rockets'], images: img('Lunic-Rocket-BOX.jpg') },
    { name: 'Two Sound Rocket BOX',  price: 130, originalPrice: 650, packSize: '1 BOX', categoryId: cat['sky-rockets'], images: img('Two-Sound-Rocket-BOX.jpg') },
    { name: 'Echo Music Rocket BOX', price: 145, originalPrice: 725, packSize: '1 BOX', categoryId: cat['sky-rockets'], images: img('Two-Sound-Rocket-BOX.jpg') },

    // ── BIJILI CRACKERS ───────────────────────────────────
    { name: 'Red Bijili 50 Pcs BOX',  price: 15, originalPrice: 75,  packSize: '50 pcs',  categoryId: cat['bijili-crackers'], images: img('Red-Bijili-50-Pcs-BOX.jpg') },
    { name: 'Red Bijili 100 Pcs BOX', price: 35, originalPrice: 175, packSize: '100 pcs', categoryId: cat['bijili-crackers'], images: img('Red-Bijili-100-Pcs-BOX.jpg') },

    // ── BOMB CRACKERS ─────────────────────────────────────
    { name: 'Bullet Bomb BOX',         price: 22,  originalPrice: 110,  packSize: '1 BOX', categoryId: cat['bomb-crackers'], images: img('Bullet-Bomb-BOX.jpg') },
    { name: 'Atom Bomb BOX',           price: 45,  originalPrice: 225,  packSize: '1 BOX', categoryId: cat['bomb-crackers'], images: img('Atom-Bomb-BOX.jpg') },
    { name: 'Hydro Bomb BOX',          price: 65,  originalPrice: 325,  packSize: '1 BOX', categoryId: cat['bomb-crackers'], images: img('Hydro-Bomb-BOX.jpg') },
    { name: 'King Of King BOX',        price: 85,  originalPrice: 425,  packSize: '1 BOX', categoryId: cat['bomb-crackers'], images: img('King-Of-King-BOX.jpg') },
    { name: 'Classic Bomb BOX',        price: 110, originalPrice: 550,  packSize: '1 BOX', categoryId: cat['bomb-crackers'], images: img('Classic-Bomb-BOX.jpg') },
    { name: 'Dinosaur Bomb BOX',       price: 198, originalPrice: 990,  packSize: '1 BOX', categoryId: cat['bomb-crackers'], images: img('Dinosaur-Bomb-BOX.jpg') },
    { name: 'Agni Bomb BOX',           price: 190, originalPrice: 950,  packSize: '1 BOX', categoryId: cat['bomb-crackers'], images: img('Agni-Bomb-BOX.jpg') },
    { name: 'Digital Deluxe Bomb BOX', price: 220, originalPrice: 1100, packSize: '1 BOX', categoryId: cat['bomb-crackers'], images: img('Digital-Deluxe-Bomb-BOX.jpg') },

    // ── PAPER BOMB ────────────────────────────────────────
    { name: 'Adiyal ¼ Kg BOX',      price: 60,  originalPrice: 300,  packSize: '¼ kg',   categoryId: cat['paper-bomb'], images: img('adiyal-kg-box.jpg') },
    { name: 'Adiyal ½ Kg BOX',      price: 120, originalPrice: 600,  packSize: '½ kg',   categoryId: cat['paper-bomb'], images: img('Adiyal-quarterhalfthree-quarterAdiyal-Kg-BOX.jpg-Kg-BOX.jpg') },
    { name: 'Color Paper Vedi BOX', price: 90,  originalPrice: 450,  packSize: '5 pcs',  categoryId: cat['paper-bomb'], images: img('adiyal-kg-box.jpg') },
    { name: 'Avatar Bomb BOX',      price: 250, originalPrice: 1250, packSize: '10 pcs', categoryId: cat['paper-bomb'], images: img('Avatar-Bomb-10-Pcs-BOX.jpg') },
    { name: 'Crorepathy Bomb BOX',  price: 294, originalPrice: 1470, packSize: '1 BOX',  categoryId: cat['paper-bomb'], images: img('Avatar-Bomb-10-Pcs-BOX.jpg') },

    // ── WALA GARLAND ──────────────────────────────────────
    { name: '24 Deluxe PKT',        price: 45,   originalPrice: 225,   packSize: '1 PKT',  categoryId: cat['wala-garland'], images: img('24-Deluxe-PKT.jpg') },
    { name: '50 Deluxe PKT',        price: 105,  originalPrice: 525,   packSize: '1 PKT',  categoryId: cat['wala-garland'], images: img('50-Deluxe-PKT.jpg') },
    { name: '100 Deluxe PKT',       price: 210,  originalPrice: 1050,  packSize: '1 PKT',  categoryId: cat['wala-garland'], images: img('100-Deluxe-PKT.jpg') },
    { name: '28 Chorsa PKT',        price: 15,   originalPrice: 75,    packSize: '1 PKT',  categoryId: cat['wala-garland'], images: img('28-Chorsa-PKT.jpg') },
    { name: '28 Giant PKT',         price: 30,   originalPrice: 150,   packSize: '1 PKT',  categoryId: cat['wala-garland'], images: img('56-Giant-PKT.jpg') },
    { name: '56 Giant PKT',         price: 45,   originalPrice: 225,   packSize: '1 PKT',  categoryId: cat['wala-garland'], images: img('56-Giant-PKT.jpg') },
    { name: '100 Wala BOX',         price: 40,   originalPrice: 200,   packSize: '100',    categoryId: cat['wala-garland'], images: img('100-Wala-BOX.jpg') },
    { name: '200 Wala BOX',         price: 80,   originalPrice: 400,   packSize: '200',    categoryId: cat['wala-garland'], images: img('200-Wala-BOX.jpg') },
    { name: '300 Wala BOX',         price: 105,  originalPrice: 525,   packSize: '300',    categoryId: cat['wala-garland'], images: img('300-Wala-BOX.jpg') },
    { name: '600 Wala BOX',         price: 135,  originalPrice: 675,   packSize: '600',    categoryId: cat['wala-garland'], images: img('600-Wala-BOX.jpg') },
    { name: '1000 Wala BOX',        price: 150,  originalPrice: 750,   packSize: '1000',   categoryId: cat['wala-garland'], images: img('1000-Wala-BOX.jpg') },
    { name: '1000 Wala Power BOX',  price: 250,  originalPrice: 1250,  packSize: '1000',   categoryId: cat['wala-garland'], images: img('1000-Wala-Power-BOX.jpg') },
    { name: '2000 Wala BOX',        price: 520,  originalPrice: 2600,  packSize: '2000',   categoryId: cat['wala-garland'], images: img('2000-Wala-BOX.jpg') },
    { name: '5000 Wala BOX',        price: 950,  originalPrice: 4750,  packSize: '5000',   categoryId: cat['wala-garland'], images: img('5000-Wala-BOX.jpg') },
    { name: '5000 Wala Power BOX',  price: 1450, originalPrice: 7250,  packSize: '5000',   categoryId: cat['wala-garland'], images: img('5000-Wala-Power-BOX.jpg') },
    { name: '10000 Wala BOX',       price: 1800, originalPrice: 9000,  packSize: '10000',  categoryId: cat['wala-garland'], images: img('10000-BOX.jpg') },
    { name: '10000 Wala Power BOX', price: 2400, originalPrice: 12000, packSize: '10000',  categoryId: cat['wala-garland'], images: img('10000-Wala-Power-BOX.jpg') },

    // ── SKY NIGHT CELEBRATION ─────────────────────────────
    { name: 'Chota Pipe Multi Color BOX',     price: 45,   originalPrice: 225,   packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('120-Shot-Multi-Color-BOX.jpg') },
    { name: '7 Shot BOX',                     price: 110,  originalPrice: 550,   packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('7-Shot-BOX.jpg') },
    { name: 'Sky King Multi Color BOX',       price: 135,  originalPrice: 675,   packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('Sky-King-Multi-Color-BOX.jpg') },
    { name: 'Penta Park Multi Color BOX',     price: 170,  originalPrice: 850,   packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('Penta-Park-Multi-Color-BOX.jpg') },
    { name: '2½ Fancy Pipe BOX',              price: 250,  originalPrice: 1250,  packSize: '3 pcs', categoryId: cat['sky-night-celebration'], images: img('2-quarterhalfthree-quarter2-Fancy-Pipe-3-Pcs-BOX.jpg-Fancy-Pipe-3-Pcs-BOX.jpg') },
    { name: '2½ Fancy BOX',                   price: 120,  originalPrice: 600,   packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('2-quarterhalfthree-quarter2-Fancy-BOX.jpg-Fancy-BOX.jpg') },
    { name: '3½ Fancy BOX',                   price: 220,  originalPrice: 1100,  packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('4-Fancy-BOX.jpg') },
    { name: '3½ Fancy Double Ball BOX',       price: 370,  originalPrice: 1850,  packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('4-Fancy-BOX.jpg') },
    { name: '3½ Fancy Pipe BOX',              price: 550,  originalPrice: 2750,  packSize: '2 pcs', categoryId: cat['sky-night-celebration'], images: img('2-quarterhalfthree-quarter2-Fancy-Pipe-3-Pcs-BOX.jpg-Fancy-Pipe-3-Pcs-BOX.jpg') },
    { name: '4" Fancy BOX',                   price: 280,  originalPrice: 1400,  packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('4-Fancy-BOX.jpg') },
    { name: '4" Fancy 2 Pcs BOX',             price: 650,  originalPrice: 3250,  packSize: '2 pcs', categoryId: cat['sky-night-celebration'], images: img('4-Fancy-BOX.jpg') },
    { name: '12 Step BOX',                    price: 330,  originalPrice: 1650,  packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('12-Step-BOX.jpg') },
    { name: '12 Shot BOX',                    price: 180,  originalPrice: 900,   packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('12-Shot-BOX.jpg') },
    { name: '30 Peacock Shot BOX',            price: 350,  originalPrice: 1750,  packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('30-Peacock-Shot-BOX.jpg') },
    { name: '30 Shot Multi Color BOX',        price: 380,  originalPrice: 1900,  packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('30-Shot-Multi-Color-BOX.jpg') },
    { name: '60 Shot Multi Color BOX',        price: 750,  originalPrice: 3750,  packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('60-Shot-Multi-Color-BOX.jpg') },
    { name: '120 Shot Multi Color BOX',       price: 1450, originalPrice: 7250,  packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('120-Shot-Multi-Color-BOX.jpg') },
    { name: '240 Shot Multi Color BOX',       price: 2600, originalPrice: 13000, packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('240-Shot-Multi-Color-BOX.jpg') },
    { name: '10x10 Sizeling Shot BOX',        price: 2700, originalPrice: 13500, packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('10x10-Sizeling-Shot-BOX.jpg') },
    { name: '10x10 Tail Light BOX',           price: 3200, originalPrice: 16000, packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('10X10-Tail-Light-BOX.jpg') },
    { name: '20x2.5" Thriller Set Grand BOX', price: 3200, originalPrice: 16000, packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('20-x-2.5Thriller-Set-Grand-BOX.jpg') },
    { name: '32x3.5" Mega Thriller Set BOX',  price: 4750, originalPrice: 23750, packSize: '1 BOX', categoryId: cat['sky-night-celebration'], images: img('32-x-3.5Mega-Thriller-Set-Grand-BOX.jpg') },

    // ── NIGHT FANCY CELEBRATION ───────────────────────────
    { name: 'Asrafi BOX',                     price: 45,  originalPrice: 225,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Asrafi-BOX.jpg') },
    { name: '4" Angry Bird BOX',              price: 60,  originalPrice: 300,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('4-Fancy-BOX.jpg') },
    { name: 'Ganga Jamuna BOX',               price: 75,  originalPrice: 375,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Ganga-Jamuna-BOX.jpg') },
    { name: 'Photo Flash BOX',                price: 65,  originalPrice: 325,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Asrafi-BOX.jpg') },
    { name: 'Star Light BOX',                 price: 70,  originalPrice: 350,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('King-Star-BOX.jpg') },
    { name: 'Dancing Butterfly BOX',          price: 75,  originalPrice: 375,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Dancing-Butterfly-BOX.jpg') },
    { name: 'Feather Pop Shower BOX',         price: 130, originalPrice: 650,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Tin-Beer-Shower-BOX.jpg') },
    { name: 'Color Rain BOX',                 price: 125, originalPrice: 625,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Tin-Beer-Shower-BOX.jpg') },
    { name: '2" Sun Feast Multicolor BOX',    price: 140, originalPrice: 700,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('2-Sun-feast-Multicolor-BOX.jpg') },
    { name: 'Golden Rise BOX',                price: 125, originalPrice: 625,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Mega-Siren-BOX.jpg') },
    { name: 'Mini Siren BOX',                 price: 135, originalPrice: 675,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Mini-Siren-BOX.jpg') },
    { name: 'Mega Siren BOX',                 price: 165, originalPrice: 825,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Mega-Siren-BOX.jpg') },
    { name: 'Peacock Fancy BOX',              price: 165, originalPrice: 825,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Peacock-Fancy-BOX.jpg') },
    { name: 'Bada Peacock BOX',               price: 375, originalPrice: 1875, packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Bada-Peacock-BOX.jpg') },
    { name: 'Silky Shower BOX',               price: 110, originalPrice: 550,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Tin-Beer-Shower-BOX.jpg') },
    { name: 'Tin Beer Shower BOX',            price: 120, originalPrice: 600,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Tin-Beer-Shower-BOX.jpg') },
    { name: 'Star Shown Popcorn BOX',         price: 170, originalPrice: 850,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('King-Star-BOX.jpg') },
    { name: 'Apple Shower BOX',               price: 180, originalPrice: 900,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Tin-Beer-Shower-BOX.jpg') },
    { name: '3" Red Sun Shower BOX',          price: 210, originalPrice: 1050, packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('3-Red-Sun-Shower-BOX.jpg') },
    { name: 'Smoke Fountain Celebration BOX', price: 220, originalPrice: 1100, packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Mega-Siren-BOX.jpg') },
    { name: 'Bambara Spinner BOX',            price: 135, originalPrice: 675,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Bambara-Spinner-BOX.jpg') },
    { name: 'Tim Tom BOX',                    price: 85,  originalPrice: 425,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Kit-Kat-BOX.jpg') },
    { name: 'Kit Kat BOX',                    price: 30,  originalPrice: 150,  packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Kit-Kat-BOX.jpg') },
    { name: 'Zee Boom Baa BOX',               price: 15,  originalPrice: 75,   packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Zee-Boom-Baa-BOX.jpg') },
    { name: 'Electric Stone BOX',             price: 15,  originalPrice: 75,   packSize: '1 BOX', categoryId: cat['night-fancy-celebration'], images: img('Electric-Stone-BOX.jpg') },

    // ── FANCY FLOWER BALLS ────────────────────────────────
    { name: 'Chun Mun Barrels BOX', price: 195, originalPrice: 975,  packSize: '1 BOX', categoryId: cat['fancy-flower-balls'], images: img('Chun-Mun-Barrels-BOX.jpg') },
    { name: 'Two in One BOX',       price: 450, originalPrice: 2250, packSize: '1 BOX', categoryId: cat['fancy-flower-balls'], images: img('Chun-Mun-Barrels-BOX.jpg') },
    { name: 'Mega Deluxe BOX',      price: 550, originalPrice: 2750, packSize: '1 BOX', categoryId: cat['fancy-flower-balls'], images: img('Mega-Deluxe-BOX.jpg') },

    // ── COLOR MATCHES ─────────────────────────────────────
    { name: 'Royal Deluxe Matches BOX', price: 80,  originalPrice: 400,  packSize: '1 BOX', categoryId: cat['color-matches'], images: img('Royal-Deluxe-Matches-BOX.jpg') },
    { name: 'Royal Lamba Matches BOX',  price: 160, originalPrice: 800,  packSize: '1 BOX', categoryId: cat['color-matches'], images: img('Royal-Lamba-Matches-BOX.jpg') },
    { name: 'Mega Laptop Matches BOX',  price: 250, originalPrice: 1250, packSize: '1 BOX', categoryId: cat['color-matches'], images: img('Mega-Laptop-Matches-BOX.jpg') },

    // ── CHILDREN GUN ITEMS ────────────────────────────────
    { name: 'Roll Cap BOX',       price: 80,  originalPrice: 400, packSize: '1 BOX', categoryId: cat['children-gun-items'], images: img('Roll-Cap-BOX.jpg') },
    { name: 'Snake Tablet BOX',   price: 35,  originalPrice: 175, packSize: '1 BOX', categoryId: cat['children-gun-items'], images: img('Snake-Tablet-BOX.jpg') },
    { name: 'Small Size Gun BOX', price: 50,  originalPrice: 250, packSize: '1 BOX', categoryId: cat['children-gun-items'], images: img('Roll-Cap-BOX.jpg') },
    { name: 'Mega Gun BOX',       price: 100, originalPrice: 500, packSize: '1 BOX', categoryId: cat['children-gun-items'], images: img('Roll-Cap-BOX.jpg') },

    // ── NEW ARRIVALS ──────────────────────────────────────
    { name: 'King Star BOX',         price: 295, originalPrice: 1475, packSize: '1 BOX', categoryId: cat['new-arrivals'], images: img('King-Star-BOX.jpg') },
    { name: 'Old is Gold PKT',       price: 190, originalPrice: 950,  packSize: '1 PKT', categoryId: cat['new-arrivals'], images: img('Old-is-Gold-PKT.jpg') },
    { name: 'Star Wheel PKT',        price: 175, originalPrice: 875,  packSize: '1 PKT', categoryId: cat['new-arrivals'], images: img('Whistling-Wheel-5-Pcs-BOX.jpg') },
    { name: 'Water Queen Falls PKT', price: 190, originalPrice: 950,  packSize: '1 PKT', categoryId: cat['new-arrivals'], images: img('Water-Queen-Falls-PKT.jpg') },
    { name: 'Top Gun Fancy PKT',     price: 210, originalPrice: 1050, packSize: '1 PKT', categoryId: cat['new-arrivals'], images: img('Roll-Cap-BOX.jpg') },
    { name: 'Moon Light BOX',        price: 70,  originalPrice: 350,  packSize: '1 BOX', categoryId: cat['new-arrivals'], images: img('King-Star-BOX.jpg') },
    { name: 'Helicopter BOX',        price: 130, originalPrice: 650,  packSize: '1 BOX', categoryId: cat['new-arrivals'], images: img('Lunic-Rocket-BOX.jpg') },

    // ── NEW ARRIVALS 2026 ─────────────────────────────────
    { name: 'Fun Zone Crackling BOX',       price: 370, originalPrice: 1850, packSize: '5 pcs', categoryId: cat['new-arrivals-2026'], images: img('Fun-Zone-Crackling-5Pcs-BOX.jpg') },
    { name: 'Rotating Sparklers BOX',       price: 150, originalPrice: 750,  packSize: '1 BOX', categoryId: cat['new-arrivals-2026'], images: img('Rotating-Sparklers-BOX.jpg') },
    { name: 'Magic Whip BOX',               price: 145, originalPrice: 725,  packSize: '1 BOX', categoryId: cat['new-arrivals-2026'], images: img('Magic-whip-BOX.jpg') },
    { name: 'Star World BOX',               price: 160, originalPrice: 800,  packSize: '5 pcs', categoryId: cat['new-arrivals-2026'], images: img('Whistling-Wheel-5-Pcs-BOX.jpg') },
    { name: '4" Pipe Golden Eye BOX',       price: 370, originalPrice: 1850, packSize: '1 BOX', categoryId: cat['new-arrivals-2026'], images: img('4-Pipe-Golden-Eye-BOX.jpg') },
    { name: '4" Pipe Wow Purple BOX',       price: 370, originalPrice: 1850, packSize: '1 BOX', categoryId: cat['new-arrivals-2026'], images: img('4-Pipe-Wow-Purple-BOX.jpg') },
    { name: '4" Pipe Wow Orange BOX',       price: 370, originalPrice: 1850, packSize: '1 BOX', categoryId: cat['new-arrivals-2026'], images: img('4-Pipe-Wow-Purple-BOX.jpg') },
    { name: '30 Flash Color Shot BOX',      price: 420, originalPrice: 2100, packSize: '1 BOX', categoryId: cat['new-arrivals-2026'], images: img('30-Shot-Multi-Color-BOX.jpg') },
    { name: '30 Crack Jack Color Shot BOX', price: 480, originalPrice: 2400, packSize: '1 BOX', categoryId: cat['new-arrivals-2026'], images: img('30-Shot-Multi-Color-BOX.jpg') },
    { name: 'Blast Gun Pistol 5G BOX',      price: 210, originalPrice: 1050, packSize: '1 BOX', categoryId: cat['new-arrivals-2026'], images: img('Roll-Cap-BOX.jpg') },

    // ── COMBO PACK ────────────────────────────────────────
    { name: '3000 Combo Pack',        price: 3000, originalPrice: 3000, packSize: '1 Case', categoryId: cat['combo-pack'], images: img('1000-Wala-Power-BOX.jpg') },
    { name: '5000 Family Pack',       price: 5000, originalPrice: 5000, packSize: '1 Case', categoryId: cat['combo-pack'], images: img('5000-Wala-Power-BOX.jpg') },
    { name: '7000 Thala Diwali Pack', price: 7000, originalPrice: 7000, packSize: '1 Case', categoryId: cat['combo-pack'], images: img('10000-Wala-Power-BOX.jpg') },
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
    isActive: true,
    rating: '0',
    reviewCount: 0,
  }))

  // Insert in batches of 50
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