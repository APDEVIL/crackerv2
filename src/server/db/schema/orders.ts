import { relations } from 'drizzle-orm'
import { integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './auth'
import { products } from './products'

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled',
])

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
])

// Snapshot of address at time of order — never joins to a live address table
export const orders = pgTable('orders', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderNumber: text('order_number').notNull().unique(), // DS-2025-0001
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),

  status: orderStatusEnum('status').notNull().default('pending'),
  paymentStatus: paymentStatusEnum('payment_status')
    .notNull()
    .default('pending'),

  // COD — no gateway, admin flips status manually
  paymentMethod: text('payment_method').notNull().default('cod'),

  subtotal: integer('subtotal').notNull(),
  discount: integer('discount').notNull().default(0),
  shipping: integer('shipping').notNull().default(0),
  total: integer('total').notNull(),

  // Address snapshot columns (denormalized on purpose)
  addrName: text('addr_name').notNull(),
  addrPhone: text('addr_phone').notNull(),
  addrLine1: text('addr_line1').notNull(),
  addrLine2: text('addr_line2'),
  addrCity: text('addr_city').notNull(),
  addrState: text('addr_state').notNull(),
  addrPincode: text('addr_pincode').notNull(),
  addrDistrict: text('addr_district').notNull(),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const orderItems = pgTable('order_items', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'restrict' }),

  // Snapshot price at time of purchase — never use live product price
  priceAtPurchase: integer('price_at_purchase').notNull(),
  quantity: integer('quantity').notNull(),
})

// ── Relations ──────────────────────────────────────────────
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}))
