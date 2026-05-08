import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { vulnerableUsers } from "./vulnerable";

export const nokUsers = pgTable("nok_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  linkedVulnerableId: integer("linked_vulnerable_id")
    .notNull()
    .references(() => vulnerableUsers.id, { onDelete: "cascade" }),
  disabled: boolean("disabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type NokUser = typeof nokUsers.$inferSelect;
