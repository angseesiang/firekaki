import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const volunteerUsers = pgTable("volunteer_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  skills: text("skills"),
  gpsConsent: boolean("gps_consent").notNull().default(false),
  emailVerifiedAt: timestamp("email_verified_at"),
  verificationToken: text("verification_token"),
  verificationTokenExpiresAt: timestamp("verification_token_expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type VolunteerUser = typeof volunteerUsers.$inferSelect;
