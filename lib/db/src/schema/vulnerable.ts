import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const vulnerableUsers = pgTable("vulnerable_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  nokName: text("nok_name").notNull(),
  nokRelation: text("nok_relation").notNull(),
  nokContact: text("nok_contact").notNull(),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type VulnerableUser = typeof vulnerableUsers.$inferSelect;
