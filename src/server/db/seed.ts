import { scrypt } from "node:crypto";
import { db } from "./index";
import { categories, products } from "./schema";
import { users, accounts } from "./schema/auth";

// ── Exact replica of oslo's Scrypt.hash() ─────────────────
// better-auth uses oslo internally; format is `salt:hash` (both hex-encoded)
// params: N=16384, r=16, p=1, dkLen=64, password normalized to NFKC
function encodeHex(buf: Buffer | Uint8Array): string {
  return Buffer.from(buf).toString("hex");
}

async function hashPassword(password: string): Promise<string> {
  const N = 16384, r = 16, p = 1, dkLen = 64;
  // oslo uses crypto.getRandomValues(new Uint8Array(16)) for salt
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const salt = encodeHex(saltBytes);                // 32-char hex string

  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password.normalize("NFKC"),                   // oslo normalizes to NFKC
      salt,
      dkLen,
      { N, r, p, maxmem: 128 * N * r * 2 },
      (err, buf) => (err ? reject(err) : resolve(buf))
    );
  });

  return `${salt}:${encodeHex(key)}`;              // "salt:hash"
}

// ── Config — change before running ───────────────────────
const ADMIN_EMAIL    = "admin@crack.com";
const ADMIN_PASSWORD = "Admin@1234";
const ADMIN_NAME     = "Admin";

async function seed() {
  console.log("🌱 Seeding database...");

  // ── Admin user ───────────────────────────────────────────
  const adminId       = crypto.randomUUID();
  const hashedPassword = await hashPassword(ADMIN_PASSWORD);

  const [insertedAdmin] = await db
    .insert(users)
    .values({
      id:            adminId,
      name:          ADMIN_NAME,
      email:         ADMIN_EMAIL,
      emailVerified: true,
      role:          "admin",
      createdAt:     new Date(),
      updatedAt:     new Date(),
    })
    .onConflictDoNothing()
    .returning();

  if (insertedAdmin) {
    await db
      .insert(accounts)
      .values({
        id:         crypto.randomUUID(),
        accountId:  insertedAdmin.id,
        providerId: "credential",
        userId:     insertedAdmin.id,
        password:   hashedPassword,
        createdAt:  new Date(),
        updatedAt:  new Date(),
      })
      .onConflictDoNothing();

    console.log(`✅ Admin seeded → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    console.log(`⚠️  Admin already exists — skipped`);
  }

  // ── Categories ───────────────────────────────────────────
  const insertedCategories = await db
    .insert(categories)
    .values([
      { name: "Rocket",          slug: "rocket",      image: "/categories/rocket.jpg" },
      { name: "Bijli",           slug: "bijli",       image: "/categories/bijli.jpg" },
      { name: "Atom Bomb",       slug: "atom",        image: "/categories/atom.jpg" },
      { name: "Flower Pot",      slug: "flower-pot",  image: "/categories/flower-pot.jpg" },
      { name: "Sparklers",       slug: "sparklers",   image: "/categories/sparklers.jpg" },
      { name: "Ground Chakkars", slug: "chakkar",     image: "/categories/chakkar.jpg" },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`✅ ${insertedCategories.length} categories seeded`);

  const catMap = Object.fromEntries(
    insertedCategories.map((c) => [c.slug, c.id])
  );

  // ── Products ─────────────────────────────────────────────
  const insertedProducts = await db
    .insert(products)
    .values([
      {
        name: "Sara Pkt",
        description: "A classic assorted cracker pack perfect for families. Safe, vibrant, and long-lasting with a beautiful color spread. Ideal for home celebrations.",
        price: 299,
        originalPrice: 399,
        categoryId: catMap["sparklers"]!,
        images: ["/crackers/sara-1.jpg", "/crackers/sara-2.jpg"],
        videoUrl: "/crackers/sara-demo.mp4",
        packSize: "Pack of 10",
        stock: 150,
        tag: "Best Seller",
        isActive: true,
        rating: "4.8",
        reviewCount: 342,
      },
      {
        name: "Bijli Chain",
        description: "Rapid-fire bijli chain with stunning electrical effect. Creates an unforgettable sound and light show.",
        price: 149,
        categoryId: catMap["bijli"]!,
        images: ["/crackers/bijli-1.jpg"],
        packSize: "Pack of 10",
        stock: 200,
        isActive: true,
        rating: "4.5",
        reviewCount: 198,
      },
      {
        name: "Laksmi Bomb",
        description: "Premium ground-burst cracker with powerful sound effect. A Diwali staple for generations.",
        price: 199,
        originalPrice: 249,
        categoryId: catMap["atom"]!,
        images: ["/crackers/laksmi-1.jpg"],
        packSize: "Pack of 10",
        stock: 80,
        tag: "Sale",
        isActive: true,
        rating: "4.6",
        reviewCount: 267,
      },
      {
        name: "Sky Shot 7 Color",
        description: "High-altitude rocket that bursts into 7 vibrant colors at peak height. Safe launch tube included.",
        price: 499,
        categoryId: catMap["rocket"]!,
        images: ["/crackers/skyshot-1.jpg", "/crackers/skyshot-2.jpg"],
        videoUrl: "/crackers/skyshot-demo.mp4",
        packSize: "Pack of 5",
        stock: 60,
        tag: "New",
        isActive: true,
        rating: "4.9",
        reviewCount: 89,
      },
      {
        name: "Sparkle Wheel",
        description: "Ground-spinning flower pot with 180-second burn time and color-changing sparks.",
        price: 349,
        originalPrice: 449,
        categoryId: catMap["flower-pot"]!,
        images: ["/crackers/wheel-1.jpg"],
        packSize: "Pack of 4",
        stock: 120,
        isActive: true,
        rating: "4.4",
        reviewCount: 156,
      },
      {
        name: "Ground Chakkar",
        description: "Fast-spinning ground chakkar with colorful fire trails. Fun for all ages.",
        price: 179,
        categoryId: catMap["chakkar"]!,
        images: ["/crackers/chakkar-1.jpg"],
        packSize: "Pack of 8",
        stock: 220,
        tag: "Popular",
        isActive: true,
        rating: "4.3",
        reviewCount: 412,
      },
      {
        name: "Pencil Rocket",
        description: "Slim pencil-style rocket with whistle effect and golden trail.",
        price: 249,
        categoryId: catMap["rocket"]!,
        images: ["/crackers/pencil-1.jpg"],
        packSize: "Pack of 10",
        stock: 45,
        isActive: true,
        rating: "4.7",
        reviewCount: 203,
      },
      {
        name: "Gold Sparkler",
        description: "Classic gold sparkler — burns bright for 90 seconds. Safe for children with parental supervision.",
        price: 99,
        categoryId: catMap["sparklers"]!,
        images: ["/crackers/sparkler-1.jpg"],
        packSize: "Pack of 25",
        stock: 500,
        isActive: true,
        rating: "4.6",
        reviewCount: 621,
      },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`✅ ${insertedProducts.length} products seeded`);
  console.log("🎉 Seed complete");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});