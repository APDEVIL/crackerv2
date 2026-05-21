import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { orders, orderItems, cartItems, products } from "@/server/db/schema";

// ── Order number generator ─────────────────────────────────
async function generateOrderNumber(
  db: typeof import("@/server/db").db
): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DS-${year}-`;

  const last = await db.query.orders.findFirst({
    where: (o, { like }) => like(o.orderNumber, `${prefix}%`),
    orderBy: (o) => desc(o.createdAt),
    columns: { orderNumber: true },
  });

  const lastNum = last
    ? parseInt(last.orderNumber.replace(prefix, ""), 10)
    : 0;

  return `${prefix}${String(lastNum + 1).padStart(4, "0")}`;
}

// ── Null → undefined normalizer ────────────────────────────
function normalizeOrder<T extends { addrLine2: string | null | undefined }>(
  order: T
) {
  return { ...order, addrLine2: order.addrLine2 ?? undefined };
}

const addressInput = z.object({
  name:     z.string().min(1),
  phone:    z.string().min(10),
  line1:    z.string().min(1),
  line2:    z.string().optional(),
  city:     z.string().min(1),
  state:    z.string().min(1),
  pincode:  z.string().length(6),
  district: z.string().min(1),
});

export const ordersRouter = createTRPCRouter({

  // ── USER ─────────────────────────────────────────────────

  place: protectedProcedure
    .input(z.object({ address: addressInput }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const cart = await ctx.db.query.cartItems.findMany({
        where: (c, { eq }) => eq(c.userId, userId),
        with: { product: true },
      });

      if (cart.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cart is empty" });
      }

      for (const item of cart) {
        if (item.product.stock < item.quantity) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `"${item.product.name}" only has ${item.product.stock} in stock`,
          });
        }
      }

      const subtotal = cart.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );
      const shipping = subtotal >= 500 ? 0 : 49;
      const total    = subtotal + shipping;

      const orderNumber = await generateOrderNumber(ctx.db);
      const addr        = input.address;

      const [order] = await ctx.db
        .insert(orders)
        .values({
          orderNumber,
          userId,
          status:        "pending",
          paymentStatus: "pending",
          paymentMethod: "cod",
          subtotal,
          discount: 0,
          shipping,
          total,
          addrName:     addr.name,
          addrPhone:    addr.phone,
          addrLine1:    addr.line1,
          addrLine2:    addr.line2 ?? null,
          addrCity:     addr.city,
          addrState:    addr.state,
          addrPincode:  addr.pincode,
          addrDistrict: addr.district,
        })
        .returning();

      if (!order) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Order creation failed",
        });
      }

      await ctx.db.insert(orderItems).values(
        cart.map((item) => ({
          orderId:         order.id,
          productId:       item.productId,
          priceAtPurchase: item.product.price,
          quantity:        item.quantity,
        }))
      );

      await Promise.all(
        cart.map((item) =>
          ctx.db
            .update(products)
            .set({
              stock:     item.product.stock - item.quantity,
              updatedAt: new Date(),
            })
            .where(eq(products.id, item.productId))
        )
      );

      await ctx.db
        .delete(cartItems)
        .where(eq(cartItems.userId, userId));

      return normalizeOrder(order);
    }),

  myOrders: protectedProcedure
    .input(
      z.object({
        month: z.number().int().min(1).max(12).optional(),
        year:  z.number().int().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db.query.orders.findMany({
        where: (o, { eq }) => eq(o.userId, ctx.session.user.id),
        with: {
          items: {
            with: { product: { with: { category: true } } },
          },
        },
        orderBy: (o) => desc(o.createdAt),
      });

      const normalized = rows.map(normalizeOrder);

      if (input?.month) {
        return normalized.filter((o) => {
          const d          = new Date(o.createdAt);
          const monthMatch = d.getMonth() + 1 === input.month;
          const yearMatch  = input.year ? d.getFullYear() === input.year : true;
          return monthMatch && yearMatch;
        });
      }

      return normalized;
    }),

  // ✅ Fix 1: added user relation
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.query.orders.findFirst({
        where: (o, { eq }) => eq(o.id, input.id),
        with: {
          // user joined so admin order detail page can show name + email
          user: {
            columns: { id: true, name: true, email: true },
          },
          items: {
            with: { product: { with: { category: true } } },
          },
        },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      if (
        order.userId !== ctx.session.user.id &&
        ctx.session.user.role !== "admin"
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return normalizeOrder(order);
    }),

  listAll: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["pending", "confirmed", "shipped", "delivered", "cancelled"])
          .optional(),
        district: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
      }

      const rows = await ctx.db.query.orders.findMany({
        where: (o, { eq, and }) => {
          const conditions = [];
          if (input?.status)   conditions.push(eq(o.status, input.status));
          if (input?.district) conditions.push(eq(o.addrDistrict, input.district));
          return conditions.length > 0 ? and(...conditions) : undefined;
        },
        with: {
          user:  { columns: { id: true, name: true, email: true } },
          items: { with: { product: true } },
        },
        orderBy: (o) => desc(o.createdAt),
      });

      return rows.map(normalizeOrder);
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id:     z.string(),
        status: z.enum([
          "pending", "confirmed", "shipped", "delivered", "cancelled",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
      }

      const order = await ctx.db.query.orders.findFirst({
        where: (o, { eq }) => eq(o.id, input.id),
        with: { items: { with: { product: true } } },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      // Restock on cancel
      if (
        input.status === "cancelled" &&
        order.status !== "cancelled" &&
        order.status !== "delivered"
      ) {
        await Promise.all(
          order.items.map((item) =>
            ctx.db
              .update(products)
              .set({
                stock:     item.product.stock + item.quantity,
                updatedAt: new Date(),
              })
              .where(eq(products.id, item.productId))
          )
        );
      }

      // Auto-mark COD paid on delivery
      const paymentStatus =
        input.status === "delivered" ? "paid" : order.paymentStatus;

      const [updated] = await ctx.db
        .update(orders)
        .set({
          status: input.status,
          paymentStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, input.id))
        .returning();

      // ✅ Fix 2: guard against undefined before returning
      if (!updated) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Update failed",
        });
      }

      return normalizeOrder(updated);
    }),
});