import { z } from "zod";
import { eq, ilike, or, desc, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/api/trpc";
import { products, categories } from "@/server/db/schema";
import { utapi } from "@/server/uploadthing";

const productCreateInput = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().int().positive(),
  originalPrice: z.number().int().positive().optional(),
  categoryId: z.string(),
  images: z.array(z.string()).default([]),
  videoUrl: z.string().optional(),
  packSize: z.string().min(1),
  stock: z.number().int().min(0),
  tag: z.enum(["Best Seller", "New", "Sale", "Popular"]).optional(),
  isActive: z.boolean().default(true),
});

const productUpdateInput = productCreateInput.partial().extend({
  id: z.string(),
});

export const productsRouter = createTRPCRouter({

  // ── PUBLIC ───────────────────────────────────────────────

  list: publicProcedure
    .input(
      z.object({
        categorySlug: z.string().optional(),
        tag: z.enum(["Best Seller", "New", "Sale", "Popular"]).optional(),
        search: z.string().optional(),
        onlyActive: z.boolean().default(true),
        sortBy: z.enum(["name", "price", "createdAt"]).default("createdAt"),
        sortDir: z.enum(["asc", "desc"]).default("desc"),
      })
      // ✅ use .default({}) instead of .optional()
      // so the object is always defined with defaults applied
      .default({})
    )
    .query(async ({ ctx, input }) => {
      // Resolve category id from slug first if needed
      let categoryId: string | undefined;
      if (input.categorySlug) {
        const cat = await ctx.db.query.categories.findFirst({
          where: (c, { eq }) => eq(c.slug, input.categorySlug!),
          columns: { id: true },
        });
        if (!cat) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Category not found",
          });
        }
        categoryId = cat.id;
      }

      const rows = await ctx.db.query.products.findMany({
        with: { category: true },
        where: (p, { eq, and, ilike, or }) => {
          const conditions = [];

          if (input.onlyActive) {
            conditions.push(eq(p.isActive, true));
          }
          if (categoryId) {
            conditions.push(eq(p.categoryId, categoryId));
          }
          if (input.tag) {
            conditions.push(eq(p.tag, input.tag));
          }
          if (input.search) {
            conditions.push(
              or(
                ilike(p.name, `%${input.search}%`),
                ilike(p.description, `%${input.search}%`)
              )
            );
          }

          return conditions.length > 0 ? and(...conditions) : undefined;
        },
        // ✅ fix dynamic sort key — map explicitly instead of indexing
        orderBy: (p) => {
          const dir = input.sortDir === "asc" ? asc : desc;
          switch (input.sortBy) {
            case "name":
              return dir(p.name);
            case "price":
              return dir(p.price);
            case "createdAt":
            default:
              return dir(p.createdAt);
          }
        },
      });

      return rows;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.query.products.findFirst({
        where: (p, { eq }) => eq(p.id, input.id),
        with: { category: true },
      });

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      return product;
    }),

  getByCategory: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.db.query.categories.findFirst({
        where: (c, { eq }) => eq(c.slug, input.slug),
      });

      if (!category) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }

      return ctx.db.query.products.findMany({
        where: (p, { eq, and }) =>
          and(eq(p.categoryId, category.id), eq(p.isActive, true)),
        with: { category: true },
        orderBy: (p) => desc(p.createdAt),
      });
    }),

  // ── ADMIN ────────────────────────────────────────────────

  create: protectedProcedure
    .input(productCreateInput)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
      }

      const [product] = await ctx.db
        .insert(products)
        .values({
          ...input,
          videoUrl: input.videoUrl ?? null,
          originalPrice: input.originalPrice ?? null,
          tag: input.tag ?? null,
          rating: "0",
          reviewCount: 0,
        })
        .returning();

      return product;
    }),

  update: protectedProcedure
    .input(productUpdateInput)
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
      }

      const { id, ...data } = input;

      const [updated] = await ctx.db
        .update(products)
        .set({
          ...data,
          videoUrl: data.videoUrl ?? null,
          originalPrice: data.originalPrice ?? null,
          tag: data.tag ?? null,
          updatedAt: new Date(),
        })
        .where(eq(products.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      return updated;
    }),

  toggleActive: protectedProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
      }

      const [updated] = await ctx.db
        .update(products)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(products.id, input.id))
        .returning();

      if (!updated) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
      }

      const product = await ctx.db.query.products.findFirst({
        where: (p, { eq }) => eq(p.id, input.id),
      });

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      // Delete images from uploadthing
      if (product.images.length > 0) {
        const keys = product.images
          .map((url) => url.split("/f/")[1])
          .filter((k): k is string => !!k);
        if (keys.length > 0) await utapi.deleteFiles(keys);
      }

      // Delete video from uploadthing
      if (product.videoUrl) {
        const key = product.videoUrl.split("/f/")[1];
        if (key) await utapi.deleteFiles([key]);
      }

      await ctx.db.delete(products).where(eq(products.id, input.id));

      return { success: true };
    }),
});