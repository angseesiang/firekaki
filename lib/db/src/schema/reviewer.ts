import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const reviewerUsers = pgTable("reviewer_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ReviewerUser = typeof reviewerUsers.$inferSelect;
