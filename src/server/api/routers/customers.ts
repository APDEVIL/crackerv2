import { TRPCError } from '@trpc/server'
import { count, desc, eq, sum } from 'drizzle-orm'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { orders } from '@/server/db/schema'

function requireAdmin(role: string | undefined) {
  if (role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admins only' })
  }
}

export const customersRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session.user.role)

    const users = await ctx.db.query.users.findMany({
      where: (u, { eq }) => eq(u.role, 'user'),
      orderBy: (u, { desc }) => desc(u.createdAt),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    })

    const statsRows = await ctx.db
      .select({
        userId: orders.userId,
        totalOrders: count(orders.id),
        totalSpent: sum(orders.total),
      })
      .from(orders)
      .where(eq(orders.status, 'delivered'))
      .groupBy(orders.userId)

    const statsMap = new Map(
      statsRows.map((r) => [
        r.userId,
        {
          totalOrders: Number(r.totalOrders),
          totalSpent: Number(r.totalSpent ?? 0),
        },
      ]),
    )

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      // null → undefined so the type is string | undefined throughout
      image: u.image ?? undefined,
      createdAt: u.createdAt,
      totalOrders: statsMap.get(u.id)?.totalOrders ?? 0,
      totalSpent: statsMap.get(u.id)?.totalSpent ?? 0,
    }))
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.role)

      const user = await ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, input.id),
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Customer not found',
        })
      }

      const profile = await ctx.db.query.profiles.findFirst({
        where: (p, { eq }) => eq(p.userId, input.id),
      })

      const userOrders = await ctx.db.query.orders.findMany({
        where: (o, { eq }) => eq(o.userId, input.id),
        with: {
          items: {
            with: { product: true },
          },
        },
        orderBy: (o) => desc(o.createdAt),
      })

      const totalSpent = userOrders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + o.total, 0)

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? undefined,
        createdAt: user.createdAt,
        phone: profile?.phone ?? undefined,
        budget: profile?.budget ?? undefined,
        address: profile
          ? {
              name: profile.addrName ?? undefined,
              line1: profile.addrLine1 ?? undefined,
              line2: profile.addrLine2 ?? undefined,
              city: profile.addrCity ?? undefined,
              state: profile.addrState ?? undefined,
              pincode: profile.addrPincode ?? undefined,
              district: profile.addrDistrict ?? undefined,
            }
          : null,
        totalOrders: userOrders.length,
        totalSpent,
        orders: userOrders.map((o) => ({
          ...o,
          addrLine2: o.addrLine2 ?? undefined,
        })),
      }
    }),
})
