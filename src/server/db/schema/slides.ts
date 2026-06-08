import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const slides = pgTable('slides', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  image: text('image').notNull().default(''),
  ctaText: text('cta_text').notNull(),
  ctaLink: text('cta_link').notNull(),
  badge: text('badge'),
  order: integer('order').notNull().default(0), // for manual reordering
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
