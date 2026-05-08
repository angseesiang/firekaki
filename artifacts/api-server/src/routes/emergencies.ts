import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  db,
  emergencies,
  emergencyResponses,
  volunteerUsers,
  vulnerableUsers,
} from "@workspace/db";
import {
  CreateEmergencyBody,
  RespondEmergencyBody,
} from "@workspace/api-zod";
import {
  requireAuth,
  requireAdmin,
  requireVolunteerOrHigher,
  sendError,
} from "../lib/middleware";

const router: IRouter = Router();

const NEARBY_RADIUS_M = 2000;

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

function serialize(
  e: typeof emergencies.$inferSelect,
  extras: { distanceM?: number | null; myResponse?: string | null } = {},
) {
  return {
    id: e.id,
    type: e.type as "minor" | "major",
    status: e.status as "active" | "deactivated" | "resolved",
    creatorRole: e.creatorRole as
      | "admin"
      | "reviewer"
      | "volunteer"
      | "vulnerable",
    creatorUserId: e.creatorUserId,
    creatorName: e.creatorName,
    description: e.description,
    lat: e.lat,
    lng: e.lng,
    address: e.address,
    createdAt: e.createdAt.toISOString(),
    deactivatedAt: e.deactivatedAt ? e.deactivatedAt.toISOString() : null,
    distanceM: extras.distanceM ?? null,
    myResponse: (extras.myResponse as "accepted" | "declined" | null) ?? null,
  };
}

router.post("/emergencies", requireAuth, async (req, res) => {
  const u = req.session.user!;
  const parsed = CreateEmergencyBody.safeParse(req.body);
  if (!parsed.success) {
    return sendError(
      res,
      400,
      parsed.error.issues[0]?.message ?? "Invalid input",
    );
  }
  const { type, description, lat, lng, address } = parsed.data;

  if (type === "minor" && u.role !== "vulnerable") {
    return sendError(
      res,
      403,
      "Only Vulnerable accounts can request a Minor emergency",
    );
  }
  if (type === "major" && u.role !== "reviewer" && u.role !== "admin") {
    return sendError(
      res,
      403,
      "Only Reviewer or Admin can activate a Major emergency",
    );
  }
  if (type === "minor") {
    const v = await db
      .select({
        verified: vulnerableUsers.verified,
        emailVerifiedAt: vulnerableUsers.emailVerifiedAt,
      })
      .from(vulnerableUsers)
      .where(eq(vulnerableUsers.id, u.id))
      .limit(1);
    if (!v[0]) return sendError(res, 403, "Account not found");
    if (!v[0].verified) {
      return sendError(
        res,
        403,
        "Awaiting Reviewer verification — you can't request help yet.",
      );
    }
    if (!v[0].emailVerifiedAt) {
      return sendError(res, 403, "Please verify your email before requesting help.");
    }
  }

  try {
    const inserted = await db
      .insert(emergencies)
      .values({
        type,
        status: "active",
        creatorRole: u.role,
        creatorUserId: u.id,
        creatorName: u.name,
        description: description ?? null,
        lat: lat ?? null,
        lng: lng ?? null,
        address: address ?? null,
      })
      .returning();
    const row = inserted[0];
    if (!row) return sendError(res, 500, "Insert failed");
    res.json(serialize(row));
  } catch (err) {
    req.log.error({ err }, "create emergency failed");
    sendError(res, 500, "Could not create emergency");
  }
});

router.get("/emergencies", requireAuth, async (req, res) => {
  const u = req.session.user!;
  try {
    const rows = await db
      .select()
      .from(emergencies)
      .orderBy(desc(emergencies.createdAt));

    let scoped = rows;
    let extrasFor: (e: typeof emergencies.$inferSelect) => {
      distanceM?: number | null;
      myResponse?: string | null;
    } = () => ({});

    if (u.role === "vulnerable") {
      // sees only their own emergencies
      scoped = rows.filter(
        (e) => e.creatorRole === "vulnerable" && e.creatorUserId === u.id,
      );
    } else if (u.role === "volunteer") {
      // sees active emergencies within 2km of last known location, plus those they responded to
      const v = await db
        .select({
          lat: volunteerUsers.lastLat,
          lng: volunteerUsers.lastLng,
        })
        .from(volunteerUsers)
        .where(eq(volunteerUsers.id, u.id))
        .limit(1);
      const myResponses = await db
        .select()
        .from(emergencyResponses)
        .where(eq(emergencyResponses.volunteerId, u.id));
      const respMap = new Map(myResponses.map((r) => [r.emergencyId, r]));
      const myLat = v[0]?.lat;
      const myLng = v[0]?.lng;

      const distances = new Map<number, number | null>();
      scoped = rows.filter((e) => {
        if (e.status !== "active" && !respMap.has(e.id)) return false;
        if (respMap.has(e.id)) {
          if (e.lat != null && e.lng != null && myLat != null && myLng != null) {
            distances.set(e.id, haversineMeters(myLat, myLng, e.lat, e.lng));
          }
          return true;
        }
        // active and unresponded: must have location and be within radius
        if (e.lat == null || e.lng == null) return false;
        if (myLat == null || myLng == null) return false;
        const d = haversineMeters(myLat, myLng, e.lat, e.lng);
        if (d > NEARBY_RADIUS_M) return false;
        distances.set(e.id, d);
        return true;
      });
      extrasFor = (e) => ({
        distanceM: distances.get(e.id) ?? null,
        myResponse: respMap.get(e.id)?.status ?? null,
      });
    }
    // reviewer + admin see everything (no filter)

    res.json({ emergencies: scoped.map((e) => serialize(e, extrasFor(e))) });
  } catch (err) {
    req.log.error({ err }, "list emergencies failed");
    sendError(res, 500, "Could not list emergencies");
  }
});

router.post("/emergencies/:id/deactivate", requireAdmin, async (req, res) => {
  const u = req.session.user!;
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return sendError(res, 400, "Invalid id");
  try {
    const updated = await db
      .update(emergencies)
      .set({
        status: "deactivated",
        deactivatedAt: new Date(),
        deactivatedByAdminId: u.id,
      })
      .where(eq(emergencies.id, id))
      .returning();
    const row = updated[0];
    if (!row) return sendError(res, 404, "Emergency not found");
    res.json(serialize(row));
  } catch (err) {
    req.log.error({ err }, "deactivate emergency failed");
    sendError(res, 500, "Could not deactivate emergency");
  }
});

router.post(
  "/emergencies/:id/respond",
  requireVolunteerOrHigher,
  async (req, res) => {
    const u = req.session.user!;
    if (u.role !== "volunteer") {
      return sendError(res, 403, "Only Volunteers can accept or decline");
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, "Invalid id");
    const parsed = RespondEmergencyBody.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, "Invalid input");
    }
    try {
      const e = await db
        .select()
        .from(emergencies)
        .where(eq(emergencies.id, id))
        .limit(1);
      const em = e[0];
      if (!em) return sendError(res, 404, "Emergency not found");

      const prior = await db
        .select()
        .from(emergencyResponses)
        .where(
          and(
            eq(emergencyResponses.emergencyId, id),
            eq(emergencyResponses.volunteerId, u.id),
          ),
        )
        .limit(1);
      const alreadyResponded = prior.length > 0;

      if (em.status !== "active" && !alreadyResponded) {
        return sendError(res, 403, "Emergency is no longer active");
      }

      let distanceM: number | null = null;
      const v = await db
        .select({
          lat: volunteerUsers.lastLat,
          lng: volunteerUsers.lastLng,
        })
        .from(volunteerUsers)
        .where(eq(volunteerUsers.id, u.id))
        .limit(1);
      if (
        em.lat != null &&
        em.lng != null &&
        v[0]?.lat != null &&
        v[0]?.lng != null
      ) {
        distanceM = haversineMeters(v[0].lat, v[0].lng, em.lat, em.lng);
      }

      if (!alreadyResponded) {
        // must be in-scope: have a known distance and within radius
        if (distanceM == null) {
          return sendError(
            res,
            403,
            "Share your location before responding to alerts",
          );
        }
        if (distanceM > NEARBY_RADIUS_M) {
          return sendError(res, 403, "Emergency is outside your 2 km radius");
        }
      }

      await db
        .insert(emergencyResponses)
        .values({
          emergencyId: id,
          volunteerId: u.id,
          status: parsed.data.status,
          distanceM,
        })
        .onConflictDoUpdate({
          target: [
            emergencyResponses.emergencyId,
            emergencyResponses.volunteerId,
          ],
          set: { status: parsed.data.status, distanceM, respondedAt: new Date() },
        });
      res.json({ ok: true });
    } catch (err) {
      req.log.error({ err }, "respond emergency failed");
      sendError(res, 500, "Could not record response");
    }
  },
);

void sql;

export default router;
