import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const productTagEnum = pgEnum('product_tag', [
  'Best Seller',
  'New',
  'Sale',
  'Popular',
])

export const categories = pgTable('categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  image: text('image').notNull().default(''),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const products = pgTable('products', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(), // stored in paise-free whole ₹
  originalPrice: integer('original_price'),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id, { onDelete: 'restrict' }),
  images: text('images').array().notNull().default([]),
  videoUrl: text('video_url'),
  packSize: text('pack_size').notNull(),
  stock: integer('stock').notNull().default(0),
  tag: productTagEnum('tag'),
  isActive: boolean('is_active').notNull().default(true),
  rating: numeric('rating', { precision: 2, scale: 1 }).notNull().default('0'),
  reviewCount: integer('review_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ── Relations ──────────────────────────────────────────────
export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}))

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}))
