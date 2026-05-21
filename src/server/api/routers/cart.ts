import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { cartItems, products } from "@/server/db/schema";

export const cartRouter = createTRPCRouter({

  // api.cart.list.useQuery()
  // Returns cart items with full product details joined
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.cartItems.findMany({
      where: (c, { eq }) => eq(c.userId, ctx.session.user.id),
      with: { product: { with: { category: true } } },
      orderBy: (c, { asc }) => asc(c.createdAt),
    });
  }),

  // api.cart.add.useMutation()
  // If product already in cart, increments qty. Otherwise inserts new row.
  add: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify product exists and is active
      const product = await ctx.db.query.products.findFirst({
        where: (p, { eq, and }) =>
          and(eq(p.id, input.productId), eq(p.isActive, true)),
      });

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      // Check stock
      if (product.stock < input.quantity) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Only ${product.stock} in stock`,
        });
      }

      // Check if already in cart
      const existing = await ctx.db.query.cartItems.findFirst({
        where: (c, { eq, and }) =>
          and(
            eq(c.userId, ctx.session.user.id),
            eq(c.productId, input.productId)
          ),
      });

      if (existing) {
        // Increment quantity
        const newQty = existing.quantity + input.quantity;

        if (newQty > product.stock) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Only ${product.stock} in stock`,
          });
        }

        const [updated] = await ctx.db
          .update(cartItems)
          .set({ quantity: newQty, updatedAt: new Date() })
          .where(eq(cartItems.id, existing.id))
          .returning();

        return updated;
      }

      // Insert new cart item
      const [inserted] = await ctx.db
        .insert(cartItems)
        .values({
          userId: ctx.session.user.id,
          productId: input.productId,
          quantity: input.quantity,
        })
        .returning();

      return inserted;
    }),

  // api.cart.updateQty.useMutation()
  updateQty: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: (p, { eq }) => eq(p.id, input.productId),
      });

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      if (input.quantity > product.stock) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Only ${product.stock} in stock`,
        });
      }

      const [updated] = await ctx.db
        .update(cartItems)
        .set({ quantity: input.quantity, updatedAt: new Date() })
        .where(
          and(
            eq(cartItems.userId, ctx.session.user.id),
            eq(cartItems.productId, input.productId)
          )
        )
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cart item not found" });
      }

      return updated;
    }),

  // api.cart.remove.useMutation()
  remove: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(cartItems)
        .where(
          and(
            eq(cartItems.userId, ctx.session.user.id),
            eq(cartItems.productId, input.productId)
          )
        );

      return { success: true };
    }),

  // api.cart.clear.useMutation()
  clear: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .delete(cartItems)
      .where(eq(cartItems.userId, ctx.session.user.id));

    return { success: true };
  }),

  // api.cart.count.useQuery()
  // Lightweight — just returns total item count for navbar badge
  count: protectedProcedure.query(async ({ ctx }) => {
    const items = await ctx.db.query.cartItems.findMany({
      where: (c, { eq }) => eq(c.userId, ctx.session.user.id),
      columns: { quantity: true },
    });

    return items.reduce((sum, i) => sum + i.quantity, 0);
  }),
});