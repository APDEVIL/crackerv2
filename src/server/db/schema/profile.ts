import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

export const profiles = pgTable("profiles", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  phone: text("phone"),
  budget: integer("budget"),         // user's self-set budget limiter in ₹

  // Default delivery address
  addrName: text("addr_name"),
  addrLine1: text("addr_line1"),
  addrLine2: text("addr_line2"),
  addrCity: text("addr_city"),
  addrState: text("addr_state"),
  addrPincode: text("addr_pincode"),
  addrDistrict: text("addr_district"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));