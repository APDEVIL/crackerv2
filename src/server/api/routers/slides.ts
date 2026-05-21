import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { slides } from "@/server/db/schema";
import { utapi } from "@/server/uploadthing";

function requireAdmin(role: string | undefined) {
  if (role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
  }
}

export const slidesRouter = createTRPCRouter({

  // ── PUBLIC ───────────────────────────────────────────────

  // api.slides.list.useQuery()
  // This is what the HeroCarousel reads — only active slides, sorted by order
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.query.slides.findMany({
      where: (s, { eq }) => eq(s.isActive, true),
      orderBy: (s) => asc(s.order),
    });
  }),

  // ── ADMIN ────────────────────────────────────────────────

  // api.slides.listAll.useQuery() — admin sees all including inactive
  listAll: protectedProcedure.query(async ({ ctx }) => {
    requireAdmin(ctx.session.user.role);

    return ctx.db.query.slides.findMany({
      orderBy: (s) => asc(s.order),
    });
  }),

  // api.slides.create.useMutation()
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        subtitle: z.string().min(1),
        image: z.string().default(""),
        ctaText: z.string().min(1),
        ctaLink: z.string().min(1),
        badge: z.string().optional(),
        order: z.number().int().min(0).default(0),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.role);

      const [slide] = await ctx.db.insert(slides).values(input).returning();
      return slide;
    }),

  // api.slides.update.useMutation()
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        subtitle: z.string().min(1).optional(),
        image: z.string().optional(),
        ctaText: z.string().min(1).optional(),
        ctaLink: z.string().min(1).optional(),
        badge: z.string().optional().nullable(),
        order: z.number().int().min(0).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.role);

      const { id, ...data } = input;

      const existing = await ctx.db.query.slides.findFirst({
        where: (s, { eq }) => eq(s.id, id),
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slide not found" });
      }

      // Delete old image from uploadthing if replacing
      if (data.image && existing.image && existing.image !== data.image) {
        const key = existing.image.split("/f/")[1];
        if (key) await utapi.deleteFiles([key]);
      }

      const [updated] = await ctx.db
        .update(slides)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(slides.id, id))
        .returning();

      return updated;
    }),

  // api.slides.reorder.useMutation()
  // Receives array of { id, order } — admin drags to reorder
  reorder: protectedProcedure
    .input(z.array(z.object({ id: z.string(), order: z.number().int() })))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.role);

      await Promise.all(
        input.map(({ id, order }) =>
          ctx.db
            .update(slides)
            .set({ order, updatedAt: new Date() })
            .where(eq(slides.id, id))
        )
      );

      return { success: true };
    }),

  // api.slides.delete.useMutation()
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      requireAdmin(ctx.session.user.role);

      const slide = await ctx.db.query.slides.findFirst({
        where: (s, { eq }) => eq(s.id, input.id),
      });
      if (!slide) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slide not found" });
      }

      // Delete image from uploadthing
      if (slide.image) {
        const key = slide.image.split("/f/")[1];
        if (key) await utapi.deleteFiles([key]);
      }

      await ctx.db.delete(slides).where(eq(slides.id, input.id));

      return { success: true };
    }),
});