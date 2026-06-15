/**
 * download-images.ts
 * Run this ONCE before seeding to fetch all product images.
 * Usage: bun run download-images.ts
 *
 * Downloads images into:  public/images/products/<slug>.jpg
 * public/images/categories/<slug>.jpg
 */

import https from 'node:https'
import http  from 'node:http'
import fs    from 'node:fs'
import path  from 'node:path'

const PRODUCTS_DIR  = path.join(process.cwd(), 'public', 'images', 'products')
const CATEGORIES_DIR = path.join(process.cwd(), 'public', 'images', 'categories')

fs.mkdirSync(PRODUCTS_DIR,   { recursive: true })
fs.mkdirSync(CATEGORIES_DIR, { recursive: true })

// ── Source image map ────────────────────────────────────────────────────────
// High-quality, reliable Unsplash CDN links.
const IMG = {
  firecracker: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600&q=80',
  garland:     'https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?w=600&q=80',
  sparkler:    'https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=600&q=80',
  fountain:    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80',
  spinner:     'https://images.unsplash.com/photo-1533230408708-8f9f91d1235a?w=600&q=80',
  rocket:      'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=600&q=80',
  aerial:      'https://images.unsplash.com/photo-1498931299472-f7a63a5a1cfa?w=600&q=80',
  colorBurst:  'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=600&q=80',
  diwali:      'https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=600&q=80',
  matches:     'https://images.unsplash.com/photo-1474540412665-1cdae210ae6b?w=600&q=80',
}

const CATEGORY_SOURCES: Record<string, string> = {
  'one-sound-crackers':         IMG.firecracker,
  'flower-pots':                IMG.fountain,
  'ground-chakkars':            IMG.spinner,
  'sparklers':                  IMG.sparkler,
  'pencil-sparkling-varieties': IMG.sparkler,
  'sky-rockets':                IMG.rocket,
  'bijili-crackers':            IMG.garland,
  'bomb-crackers':              IMG.firecracker,
  'paper-bomb':                 IMG.firecracker,
  'wala-garland':               IMG.garland,
  'sky-night-celebration':      IMG.aerial,
  'night-fancy-celebration':    IMG.colorBurst,
  'fancy-flower-balls':         IMG.fountain,
  'color-matches':              IMG.matches,
  'children-gun-items':         IMG.firecracker,
  'new-arrivals':               IMG.diwali,
  'new-arrivals-2026':          IMG.aerial,
  'combo-pack':                 IMG.diwali,
}

const PRODUCT_SOURCES: Record<string, string> = {
  // ONE SOUND CRACKERS
  '3half-lakshmi-pkt':          IMG.firecracker,
  '4-lakshmi-pkt':              IMG.firecracker,
  '4-lakshmi-deluxe-pkt':       IMG.firecracker,
  'gold-lakshmi-pkt':           IMG.firecracker,
  'hulk-deluxe-pkt':            IMG.firecracker,
  'bagubali-pkt':               IMG.firecracker,
  'jallikattu-pkt':             IMG.firecracker,
  'two-sound-pkt':              IMG.firecracker,
  '2three-kuruvi-pkt':          IMG.firecracker,
  'elephant-deluxe-box':        IMG.firecracker,
  // FLOWER POTS
  'flowerpots-small-box':            IMG.fountain,
  'flowerpots-big-box':              IMG.fountain,
  'flowerpots-special-box':          IMG.fountain,
  'flowerpots-ashoka-box':           IMG.fountain,
  'flowerpots-color-koti-box':       IMG.fountain,
  'flowerpots-multicolor-giant-box': IMG.fountain,
  'flowerpots-color-koti-deluxe-box':IMG.fountain,
  'flower-pots-deluxe-box':          IMG.fountain,
  'tri-color-box':                   IMG.fountain,
  'lucky-red-and-green-box':         IMG.fountain,
  // GROUND CHAKKARS
  'chakker-small-box':           IMG.spinner,
  'chakker-small-25-pcs-box':    IMG.spinner,
  'chakker-ashoka-box':          IMG.spinner,
  'chakker-special-box':         IMG.spinner,
  'chakker-deluxe-box':          IMG.spinner,
  'disco-wheel-box':             IMG.spinner,
  'whistling-wheel-box':         IMG.spinner,
  // SPARKLERS
  '7cm-electric-sparklers-box':  IMG.sparkler,
  '7cm-color-sparklers-box':     IMG.sparkler,
  '7cm-green-sparklers-box':     IMG.sparkler,
  '7cm-red-sparklers-box':       IMG.sparkler,
  '10cm-electric-sparklers-box': IMG.sparkler,
  '10cm-color-sparklers-box':    IMG.sparkler,
  '10cm-green-sparklers-box':    IMG.sparkler,
  '10cm-red-sparklers-box':      IMG.sparkler,
  '12cm-electric-sparklers-box': IMG.sparkler,
  '12cm-color-sparklers-box':    IMG.sparkler,
  '12cm-green-sparklers-box':    IMG.sparkler,
  '12cm-red-sparklers-box':      IMG.sparkler,
  '15cm-electric-sparklers-box': IMG.sparkler,
  '15cm-color-sparklers-box':    IMG.sparkler,
  '15cm-green-sparklers-box':    IMG.sparkler,
  '15cm-red-sparklers-box':      IMG.sparkler,
  '30cm-electric-sparklers-box': IMG.sparkler,
  '30cm-color-sparklers-box':    IMG.sparkler,
  '30cm-green-sparklers-box':    IMG.sparkler,
  '30cm-red-sparklers-box':      IMG.sparkler,
  '50cm-electric-sparklers-box': IMG.sparkler,
  '50cm-color-sparklers-box':    IMG.sparkler,
  // PENCIL
  '1half-twinkling-star-box':  IMG.sparkler,
  '4-twinkling-star-box':      IMG.sparkler,
  '7inch-pencil-box':          IMG.sparkler,
  '10inch-pencil-box':         IMG.sparkler,
  'ultra-color-pencil-box':    IMG.sparkler,
  'sivakasi-special-box':      IMG.sparkler,
  'pop-corn-pencil-box':       IMG.sparkler,
  'cartoon-pots-box':          IMG.fountain,
  // SKY ROCKETS
  'baby-rocket-box':       IMG.rocket,
  'rocket-bomb-box':       IMG.rocket,
  'lunic-rocket-box':      IMG.rocket,
  'two-sound-rocket-box':  IMG.rocket,
  'echo-music-rocket-box': IMG.rocket,
  // BIJILI
  'red-bijili-50-pcs-box':  IMG.garland,
  'red-bijili-100-pcs-box': IMG.garland,
  // BOMB CRACKERS
  'bullet-bomb-box':         IMG.firecracker,
  'atom-bomb-box':           IMG.firecracker,
  'hydro-bomb-box':          IMG.firecracker,
  'king-of-king-box':        IMG.firecracker,
  'classic-bomb-box':        IMG.firecracker,
  'dinosaur-bomb-box':       IMG.firecracker,
  'agni-bomb-box':           IMG.firecracker,
  'digital-deluxe-bomb-box': IMG.firecracker,
  // PAPER BOMB
  'adiyal-quarter-kg-box':  IMG.firecracker,
  'adiyal-half-kg-box':     IMG.firecracker,
  'color-paper-vedi-box':   IMG.firecracker,
  'avatar-bomb-box':        IMG.firecracker,
  'crorepathy-bomb-box':    IMG.firecracker,
  // WALA GARLAND
  '24-deluxe-pkt':        IMG.garland,
  '50-deluxe-pkt':        IMG.garland,
  '100-deluxe-pkt':       IMG.garland,
  '28-chorsa-pkt':        IMG.garland,
  '28-giant-pkt':         IMG.garland,
  '56-giant-pkt':         IMG.garland,
  '100-wala-box':         IMG.garland,
  '200-wala-box':         IMG.garland,
  '300-wala-box':         IMG.garland,
  '600-wala-box':         IMG.garland,
  '1000-wala-box':        IMG.garland,
  '1000-wala-power-box':  IMG.garland,
  '2000-wala-box':        IMG.garland,
  '5000-wala-box':        IMG.garland,
  '5000-wala-power-box':  IMG.garland,
  '10000-wala-box':       IMG.garland,
  '10000-wala-power-box': IMG.garland,
  // SKY NIGHT
  'chota-pipe-multi-color-box':      IMG.aerial,
  '7-shot-box':                      IMG.aerial,
  'sky-king-multi-color-box':        IMG.aerial,
  'penta-park-multi-color-box':      IMG.aerial,
  '2half-fancy-pipe-box':            IMG.aerial,
  '2half-fancy-box':                 IMG.aerial,
  '3half-fancy-box':                 IMG.aerial,
  '3half-fancy-double-ball-box':     IMG.aerial,
  '3half-fancy-pipe-box':            IMG.aerial,
  '4inch-fancy-box':                 IMG.aerial,
  '4inch-fancy-2-pcs-box':           IMG.aerial,
  '12-step-box':                     IMG.aerial,
  '12-shot-box':                     IMG.aerial,
  '30-peacock-shot-box':             IMG.aerial,
  '30-shot-multi-color-box':         IMG.aerial,
  '60-shot-multi-color-box':         IMG.aerial,
  '120-shot-multi-color-box':        IMG.aerial,
  '240-shot-multi-color-box':        IMG.aerial,
  '10x10-sizeling-shot-box':         IMG.aerial,
  '10x10-tail-light-box':            IMG.aerial,
  '20x25inch-thriller-set-grand-box':IMG.aerial,
  '32x35inch-mega-thriller-set-box': IMG.aerial,
  // NIGHT FANCY
  'asrafi-box':                    IMG.colorBurst,
  '4inch-angry-bird-box':          IMG.colorBurst,
  'ganga-jamuna-box':              IMG.colorBurst,
  'photo-flash-box':               IMG.colorBurst,
  'star-light-box':                IMG.colorBurst,
  'dancing-butterfly-box':         IMG.colorBurst,
  'feather-pop-shower-box':        IMG.colorBurst,
  'color-rain-box':                IMG.colorBurst,
  '2inch-sun-feast-multicolor-box':IMG.colorBurst,
  'golden-rise-box':               IMG.colorBurst,
  'mini-siren-box':                IMG.colorBurst,
  'mega-siren-box':                IMG.colorBurst,
  'peacock-fancy-box':             IMG.colorBurst,
  'bada-peacock-box':              IMG.colorBurst,
  'silky-shower-box':              IMG.colorBurst,
  'tin-beer-shower-box':           IMG.colorBurst,
  'star-shown-popcorn-box':        IMG.colorBurst,
  'apple-shower-box':              IMG.colorBurst,
  '3inch-red-sun-shower-box':      IMG.colorBurst,
  'smoke-fountain-celebration-box':IMG.colorBurst,
  'bambara-spinner-box':           IMG.spinner,
  'tim-tom-box':                   IMG.colorBurst,
  'kit-kat-box':                   IMG.colorBurst,
  'zee-boom-baa-box':              IMG.colorBurst,
  'electric-stone-box':            IMG.colorBurst,
  // FANCY FLOWER BALLS
  'chun-mun-barrels-box': IMG.fountain,
  'two-in-one-box':       IMG.fountain,
  'mega-deluxe-box':      IMG.fountain,
  // COLOR MATCHES
  'royal-deluxe-matches-box': IMG.matches,
  'royal-lamba-matches-box':  IMG.matches,
  'mega-laptop-matches-box':  IMG.matches,
  // CHILDREN GUN
  'roll-cap-box':       IMG.firecracker,
  'snake-tablet-box':   IMG.firecracker,
  'small-size-gun-box': IMG.firecracker,
  'mega-gun-box':       IMG.firecracker,
  // NEW ARRIVALS
  'king-star-box':         IMG.diwali,
  'old-is-gold-pkt':       IMG.firecracker,
  'star-wheel-pkt':        IMG.spinner,
  'water-queen-falls-pkt': IMG.fountain,
  'top-gun-fancy-pkt':     IMG.aerial,
  'moon-light-box':        IMG.colorBurst,
  'helicopter-box':        IMG.rocket,
  // NEW ARRIVALS 2026
  'fun-zone-crackling-box':       IMG.aerial,
  'rotating-sparklers-box':       IMG.sparkler,
  'magic-whip-box':               IMG.spinner,
  'star-world-box':               IMG.aerial,
  '4inch-pipe-golden-eye-box':    IMG.aerial,
  '4inch-pipe-wow-purple-box':    IMG.colorBurst,
  '4inch-pipe-wow-orange-box':    IMG.colorBurst,
  '30-flash-color-shot-box':      IMG.aerial,
  '30-crack-jack-color-shot-box': IMG.diwali,
  'blast-gun-pistol-5g-box':      IMG.firecracker,
  // COMBO PACK
  '3000-combo-pack':        IMG.diwali,
  '5000-family-pack':       IMG.diwali,
  '7000-thala-diwali-pack': IMG.diwali,
}

function download(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      resolve()
      return
    }

    const file = fs.createWriteStream(dest)
    const client = url.startsWith('https') ? https : http

    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DSCrackerBot/1.0)',
        },
      },
      (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close()

          if (fs.existsSync(dest)) {
            fs.unlinkSync(dest)
          }

          const location = res.headers.location

          if (!location) {
            reject(new Error('Redirect without location header'))
            return
          }

          download(location, dest)
            .then(resolve)
            .catch(reject)

          return
        }

        if (res.statusCode !== 200) {
          file.close()

          if (fs.existsSync(dest)) {
            fs.unlinkSync(dest)
          }

          reject(new Error(`HTTP ${res.statusCode} for ${url}`))
          return
        }

        res.pipe(file)

        file.on('finish', () => {
          file.close()
          resolve()
        })
      }
    )

    req.on('error', (err) => {
      if (fs.existsSync(dest)) {
        fs.unlinkSync(dest)
      }
      reject(err)
    })
  })
}

async function run() {
  console.log('📥 Downloading category images...')

  for (const [slug, url] of Object.entries(CATEGORY_SOURCES)) {
    const dest = path.join(CATEGORIES_DIR, `${slug}.jpg`)

    try {
      await download(url, dest)
      console.log(`  ✅ categories/${slug}.jpg`)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      console.log(`  ❌ categories/${slug}.jpg — ${message}`)
    }
  }

  console.log('\n📥 Downloading product images...')

  const downloaded = new Set<string>()

  for (const [slug, url] of Object.entries(PRODUCT_SOURCES)) {
    const dest = path.join(PRODUCTS_DIR, `${slug}.jpg`)

    try {
      if (!downloaded.has(url)) {
        await download(url, dest)
        downloaded.add(url)
      } else {
        const existing = Object.entries(PRODUCT_SOURCES).find(
          ([k, v]) => v === url && k !== slug
        )

        if (
          existing &&
          fs.existsSync(
            path.join(PRODUCTS_DIR, `${existing[0]}.jpg`)
          )
        ) {
          fs.copyFileSync(
            path.join(PRODUCTS_DIR, `${existing[0]}.jpg`),
            dest
          )
        }
      }

      console.log(`  ✅ products/${slug}.jpg`)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      console.log(`  ❌ products/${slug}.jpg — ${message}`)
    }
  }

  console.log('\n🎉 Image download complete!')
  console.log(`   Categories: ${CATEGORIES_DIR}`)
  console.log(`   Products:   ${PRODUCTS_DIR}`)
}

run().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error(message)
})