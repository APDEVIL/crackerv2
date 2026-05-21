import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { productsRouter } from "./routers/products";
import { categoriesRouter } from "./routers/categories";
import { slidesRouter } from "./routers/slides";
import { cartRouter } from "./routers/cart";
import { wishlistRouter } from "./routers/wishlist";
import { ordersRouter } from "./routers/orders";
import { customersRouter } from "./routers/customers";
import { profileRouter } from "./routers/profile";

export const appRouter = createTRPCRouter({
  products: productsRouter,
  categories: categoriesRouter,
  slides: slidesRouter,
  cart: cartRouter,
  wishlist: wishlistRouter,
  orders: ordersRouter,
  customers: customersRouter,
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);