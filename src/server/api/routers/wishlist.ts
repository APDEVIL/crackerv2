import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { wishlistItems } from '@/server/db/schema'

export const wishlistRouter = createTRPCRouter({
  // api.wishlist.list.useQuery()
  // Returns wishlist items with full product details
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.wishlistItems.findMany({
      where: (w, { eq }) => eq(w.userId, ctx.session.user.id),
      with: { product: { with: { category: true } } },
      orderBy: (w, { desc }) => desc(w.createdAt),
    })
  }),

  // api.wishlist.ids.useQuery()
  // Lightweight — just the productIds for isWishlisted() checks
  ids: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.wishlistItems.findMany({
      where: (w, { eq }) => eq(w.userId, ctx.session.user.id),
      columns: { productId: true },
    })

    return rows.map((r) => r.productId)
  }),

  // api.wishlist.toggle.useMutation()
  // Adds if not present, removes if present — mirrors store.tsx toggleWishlist
  toggle: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.wishlistItems.findFirst({
        where: (w, { eq, and }) =>
          and(
            eq(w.userId, ctx.session.user.id),
            eq(w.productId, input.productId),
          ),
      })

      if (existing) {
        await ctx.db
          .delete(wishlistItems)
          .where(eq(wishlistItems.id, existing.id))

        return { action: 'removed' as const }
      }

      await ctx.db.insert(wishlistItems).values({
        userId: ctx.session.user.id,
        productId: input.productId,
      })

      return { action: 'added' as const }
    }),

  // api.wishlist.remove.useMutation()
  remove: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(wishlistItems)
        .where(
          and(
            eq(wishlistItems.userId, ctx.session.user.id),
            eq(wishlistItems.productId, input.productId),
          ),
        )

      return { success: true }
    }),
})
