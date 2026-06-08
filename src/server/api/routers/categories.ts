import { TRPCError } from '@trpc/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from '@/server/api/trpc'
import { categories } from '@/server/db/schema'
import { utapi } from '@/server/uploadthing'

function requireAdmin(role: string | undefined) {
  if (role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admins only' })
  }
}

export const categoriesRouter = createTRPCRouter({
  // ── PUBLIC ───────────────────────────────────────────────

  // api.categories.list.useQuery()
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.categories.findMany({
      orderBy: (c, { asc }) => asc(c.name),
    })
  }),

  // api.categories.getBySlug.useQuery({ slug })
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.query.categories.findFirst({
        where: (c, { eq }) => eq(c.slug, input.slug),
        with: { products: true },
      })

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        })
      }

      return category
    }),

  // ── ADMIN ────────────────────────────────────────────────

  // api.categories.create.useMutation()
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z
          .string()
          .min(1)
          .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
        image: z.string().default(''),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.role)

      // Check slug uniqueness
      const existing = await ctx.db.query.categories.findFirst({
        where: (c, { eq }) => eq(c.slug, input.slug),
      })
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Slug already in use',
        })
      }

      const [category] = await ctx.db
        .insert(categories)
        .values(input)
        .returning()

      return category
    }),

  // api.categories.update.useMutation()
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        image: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.role)

      const { id, ...data } = input

      const existing = await ctx.db.query.categories.findFirst({
        where: (c, { eq }) => eq(c.id, id),
      })
      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        })
      }

      // Delete old image from uploadthing if replacing
      if (data.image && existing.image && existing.image !== data.image) {
        const key = existing.image.split('/f/')[1]
        if (key) await utapi.deleteFiles([key])
      }

      const [updated] = await ctx.db
        .update(categories)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(categories.id, id))
        .returning()

      return updated
    }),

  // api.categories.delete.useMutation()
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.role)

      const category = await ctx.db.query.categories.findFirst({
        where: (c, { eq }) => eq(c.id, input.id),
        with: { products: true },
      })

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        })
      }

      if (category.products.length > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot delete — ${category.products.length} products still use this category`,
        })
      }

      // Delete category image from uploadthing
      if (category.image) {
        const key = category.image.split('/f/')[1]
        if (key) await utapi.deleteFiles([key])
      }

      await ctx.db.delete(categories).where(eq(categories.id, input.id))

      return { success: true }
    }),
})
