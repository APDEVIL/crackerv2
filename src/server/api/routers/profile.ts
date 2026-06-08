import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { profiles, users } from '@/server/db/schema'
import { utapi } from '@/server/uploadthing'

export const profileRouter = createTRPCRouter({
  // api.profile.get.useQuery()
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const user = await ctx.db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    })

    const profile = await ctx.db.query.profiles.findFirst({
      where: (p, { eq }) => eq(p.userId, userId),
    })

    return {
      ...user,
      phone: profile?.phone ?? null,
      budget: profile?.budget ?? null,
      address: profile
        ? {
            name: profile.addrName,
            line1: profile.addrLine1,
            line2: profile.addrLine2,
            city: profile.addrCity,
            state: profile.addrState,
            pincode: profile.addrPincode,
            district: profile.addrDistrict,
          }
        : null,
    }
  }),

  // api.profile.updateAddress.useMutation()
  updateAddress: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        line1: z.string().min(1).optional(),
        line2: z.string().optional(),
        city: z.string().min(1).optional(),
        state: z.string().min(1).optional(),
        pincode: z.string().length(6).optional(),
        district: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const existing = await ctx.db.query.profiles.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      })

      if (existing) {
        const [updated] = await ctx.db
          .update(profiles)
          .set({
            addrName: input.name,
            addrLine1: input.line1,
            addrLine2: input.line2,
            addrCity: input.city,
            addrState: input.state,
            addrPincode: input.pincode,
            addrDistrict: input.district,
            updatedAt: new Date(),
          })
          .where(eq(profiles.userId, userId))
          .returning()

        return updated
      }

      const [created] = await ctx.db
        .insert(profiles)
        .values({
          userId,
          addrName: input.name,
          addrLine1: input.line1,
          addrLine2: input.line2,
          addrCity: input.city,
          addrState: input.state,
          addrPincode: input.pincode,
          addrDistrict: input.district,
        })
        .returning()

      return created
    }),

  // api.profile.updatePhone.useMutation()
  updatePhone: protectedProcedure
    .input(z.object({ phone: z.string().min(10).max(15) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const existing = await ctx.db.query.profiles.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      })

      if (existing) {
        const [updated] = await ctx.db
          .update(profiles)
          .set({ phone: input.phone, updatedAt: new Date() })
          .where(eq(profiles.userId, userId))
          .returning()

        return updated
      }

      const [created] = await ctx.db
        .insert(profiles)
        .values({ userId, phone: input.phone })
        .returning()

      return created
    }),

  // api.profile.setBudget.useMutation()
  // Persists the budget limiter from store.tsx to the DB
  setBudget: protectedProcedure
    .input(z.object({ budget: z.number().int().positive().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      const existing = await ctx.db.query.profiles.findFirst({
        where: (p, { eq }) => eq(p.userId, userId),
      })

      if (existing) {
        const [updated] = await ctx.db
          .update(profiles)
          .set({ budget: input.budget, updatedAt: new Date() })
          .where(eq(profiles.userId, userId))
          .returning()

        return updated
      }

      const [created] = await ctx.db
        .insert(profiles)
        .values({ userId, budget: input.budget })
        .returning()

      return created
    }),

  // api.profile.updateAvatar.useMutation()
  // Called after uploadthing upload completes
  updateAvatar: protectedProcedure
    .input(z.object({ imageUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id

      // Delete old avatar from uploadthing if it was a UT url
      const user = await ctx.db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, userId),
        columns: { image: true },
      })

      if (user?.image?.includes('utfs.io')) {
        const key = user.image.split('/f/')[1]
        if (key) await utapi.deleteFiles([key])
      }

      const [updated] = await ctx.db
        .update(users)
        .set({ image: input.imageUrl, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning({ image: users.image })

      return updated
    }),
})
