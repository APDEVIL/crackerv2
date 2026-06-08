import { createCallerFactory, createTRPCRouter } from '@/server/api/trpc'
import { cartRouter } from './routers/cart'
import { categoriesRouter } from './routers/categories'
import { customersRouter } from './routers/customers'
import { ordersRouter } from './routers/orders'
import { productsRouter } from './routers/products'
import { profileRouter } from './routers/profile'
import { slidesRouter } from './routers/slides'
import { wishlistRouter } from './routers/wishlist'

export const appRouter = createTRPCRouter({
  products: productsRouter,
  categories: categoriesRouter,
  slides: slidesRouter,
  cart: cartRouter,
  wishlist: wishlistRouter,
  orders: ordersRouter,
  customers: customersRouter,
  profile: profileRouter,
})

export type AppRouter = typeof appRouter
export const createCaller = createCallerFactory(appRouter)
