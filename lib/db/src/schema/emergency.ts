import {
  pgTable,
  serial,
  text,
  timestamp,
  doublePrecision,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";

export const emergencies = pgTable("emergencies", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").notNull().default("active"),
  creatorRole: text("creator_role").notNull(),
  creatorUserId: integer("creator_user_id").notNull(),
  creatorName: text("creator_name").notNull(),
  description: text("description"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  address: text("address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deactivatedAt: timestamp("deactivated_at"),
  deactivatedByAdminId: integer("deactivated_by_admin_id"),
});

export type Emergency = typeof emergencies.$inferSelect;

export const emergencyResponses = pgTable(
  "emergency_responses",
  {
    emergencyId: integer("emergency_id").notNull(),
    volunteerId: integer("volunteer_id").notNull(),
    status: text("status").notNull(),
    distanceM: integer("distance_m"),
    respondedAt: timestamp("responded_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.emergencyId, t.volunteerId] })],
);

export type EmergencyResponse = typeof emergencyResponses.$inferSelect;
