import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  db,
  emergencies,
  emergencyResponses,
  volunteerUsers,
  vulnerableUsers,
  nokUsers,
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
const WALKING_MPS = 5_000 / 3_600; // 5 km/h ≈ 1.389 m/s

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

type ResponderRow = {
  volunteerId: number;
  name: string;
  status: "accepted" | "declined";
  respondedAt: string;
  arrivedAt: string | null;
  distanceM: number | null;
  etaSeconds: number | null;
};

type Stats = { accepted: number; declined: number; arrived: number; total: number };

function serialize(
  e: typeof emergencies.$inferSelect,
  extras: {
    distanceM?: number | null;
    myResponse?: string | null;
    myArrivedAt?: Date | null;
    responseStats?: Stats;
    responders?: ResponderRow[];
  } = {},
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
    myArrivedAt: extras.myArrivedAt ? extras.myArrivedAt.toISOString() : null,
    responseStats: extras.responseStats ?? null,
    responders: extras.responders ?? null,
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

  if (
    type === "minor" &&
    u.role !== "vulnerable" &&
    u.role !== "reviewer" &&
    u.role !== "admin"
  ) {
    return sendError(
      res,
      403,
      "Only Vulnerable, Reviewer or Admin accounts can request a Minor emergency",
    );
  }
  if (type === "major" && u.role !== "reviewer" && u.role !== "admin") {
    return sendError(
      res,
      403,
      "Only Reviewer or Admin can activate a Major emergency",
    );
  }
  if (type === "minor" && u.role === "vulnerable") {
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

    // Idempotent SOS: a Vulnerable can only have one active emergency at a
    // time. Repeated presses while one is still active just return the
    // existing row instead of creating duplicates. Once it's been deactivated
    // (or resolved), the next press will create a new one.
    const existingActive = await db
      .select()
      .from(emergencies)
      .where(
        and(
          eq(emergencies.creatorUserId, u.id),
          eq(emergencies.creatorRole, "vulnerable"),
          eq(emergencies.status, "active"),
        ),
      )
      .orderBy(desc(emergencies.createdAt))
      .limit(1);
    if (existingActive[0]) {
      return res.json(serialize(existingActive[0]));
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
    if (u.role === "vulnerable") {
      scoped = rows.filter(
        (e) => e.creatorRole === "vulnerable" && e.creatorUserId === u.id,
      );
    } else if (u.role === "nok") {
      const link = await db
        .select({ vid: nokUsers.linkedVulnerableId })
        .from(nokUsers)
        .where(eq(nokUsers.id, u.id))
        .limit(1);
      const vid = link[0]?.vid ?? -1;
      scoped = rows.filter(
        (e) => e.creatorRole === "vulnerable" && e.creatorUserId === vid,
      );
    } else if (u.role === "volunteer") {
      // computed below
    }

    // Pull all responses for visible emergencies in one query
    const visibleIds = scoped.map((e) => e.id);
    const allResponses = visibleIds.length
      ? await db
          .select({
            emergencyId: emergencyResponses.emergencyId,
            volunteerId: emergencyResponses.volunteerId,
            status: emergencyResponses.status,
            distanceM: emergencyResponses.distanceM,
            respondedAt: emergencyResponses.respondedAt,
            arrivedAt: emergencyResponses.arrivedAt,
            volunteerName: volunteerUsers.name,
            volLat: volunteerUsers.lastLat,
            volLng: volunteerUsers.lastLng,
          })
          .from(emergencyResponses)
          .leftJoin(
            volunteerUsers,
            eq(volunteerUsers.id, emergencyResponses.volunteerId),
          )
          .where(inArray(emergencyResponses.emergencyId, visibleIds))
      : [];

    const responsesByEmergency = new Map<
      number,
      typeof allResponses
    >();
    for (const r of allResponses) {
      const arr = responsesByEmergency.get(r.emergencyId) ?? [];
      arr.push(r);
      responsesByEmergency.set(r.emergencyId, arr);
    }

    function statsFor(eid: number): Stats {
      const rs = responsesByEmergency.get(eid) ?? [];
      let accepted = 0;
      let declined = 0;
      let arrived = 0;
      for (const r of rs) {
        if (r.status === "accepted") accepted += 1;
        else if (r.status === "declined") declined += 1;
        if (r.arrivedAt) arrived += 1;
      }
      return { accepted, declined, arrived, total: rs.length };
    }

    function respondersFor(e: typeof emergencies.$inferSelect): ResponderRow[] {
      const rs = responsesByEmergency.get(e.id) ?? [];
      return rs
        .filter((r) => r.status === "accepted")
        .map((r) => {
          let dist: number | null = r.distanceM ?? null;
          if (
            e.lat != null &&
            e.lng != null &&
            r.volLat != null &&
            r.volLng != null
          ) {
            dist = haversineMeters(r.volLat, r.volLng, e.lat, e.lng);
          }
          const eta =
            r.arrivedAt || dist == null
              ? null
              : Math.max(0, Math.round(dist / WALKING_MPS));
          return {
            volunteerId: r.volunteerId,
            name: r.volunteerName ?? `Volunteer #${r.volunteerId}`,
            status: r.status as "accepted" | "declined",
            respondedAt: r.respondedAt.toISOString(),
            arrivedAt: r.arrivedAt ? r.arrivedAt.toISOString() : null,
            distanceM: dist,
            etaSeconds: eta,
          };
        })
        .sort((a, b) => {
          // arrived first, then nearest ETA
          if ((a.arrivedAt != null) !== (b.arrivedAt != null)) {
            return a.arrivedAt ? -1 : 1;
          }
          return (a.etaSeconds ?? Infinity) - (b.etaSeconds ?? Infinity);
        });
    }

    let serialized: ReturnType<typeof serialize>[] = [];

    if (u.role === "volunteer") {
      const v = await db
        .select({
          lat: volunteerUsers.lastLat,
          lng: volunteerUsers.lastLng,
        })
        .from(volunteerUsers)
        .where(eq(volunteerUsers.id, u.id))
        .limit(1);
      const myLat = v[0]?.lat;
      const myLng = v[0]?.lng;
      const myResp = await db
        .select()
        .from(emergencyResponses)
        .where(eq(emergencyResponses.volunteerId, u.id));
      const myMap = new Map(myResp.map((r) => [r.emergencyId, r]));

      const filtered = rows.filter((e) => {
        if (e.status !== "active" && !myMap.has(e.id)) return false;
        if (myMap.has(e.id)) return true;
        if (e.lat == null || e.lng == null) return false;
        if (myLat == null || myLng == null) return false;
        return haversineMeters(myLat, myLng, e.lat, e.lng) <= NEARBY_RADIUS_M;
      });

      // re-fetch responses for the new visible set (recompute stats only)
      const ids = filtered.map((e) => e.id);
      const fresh = ids.length
        ? await db
            .select()
            .from(emergencyResponses)
            .where(inArray(emergencyResponses.emergencyId, ids))
        : [];
      const byE = new Map<number, typeof fresh>();
      for (const r of fresh) {
        const arr = byE.get(r.emergencyId) ?? [];
        arr.push(r);
        byE.set(r.emergencyId, arr);
      }
      function statsForVol(eid: number): Stats {
        const rs = byE.get(eid) ?? [];
        let a = 0, d = 0, ar = 0;
        for (const r of rs) {
          if (r.status === "accepted") a += 1;
          else if (r.status === "declined") d += 1;
          if (r.arrivedAt) ar += 1;
        }
        return { accepted: a, declined: d, arrived: ar, total: rs.length };
      }

      serialized = filtered.map((e) => {
        let dist: number | null = null;
        if (e.lat != null && e.lng != null && myLat != null && myLng != null) {
          dist = haversineMeters(myLat, myLng, e.lat, e.lng);
        }
        const mine = myMap.get(e.id);
        return serialize(e, {
          distanceM: dist,
          myResponse: mine?.status ?? null,
          myArrivedAt: mine?.arrivedAt ?? null,
          responseStats: statsForVol(e.id),
        });
      });
    } else {
      // reviewer / admin / vulnerable / nok — all are already scoped to
      // emergencies they're entitled to see, so include responder details
      // (names + ETA) so the caller and their NOK can watch help arrive.
      const includeResponders =
        u.role === "reviewer" ||
        u.role === "admin" ||
        u.role === "vulnerable" ||
        u.role === "nok";
      serialized = scoped.map((e) =>
        serialize(e, {
          responseStats: statsFor(e.id),
          responders: includeResponders ? respondersFor(e) : undefined,
        }),
      );
    }

    res.json({ emergencies: serialized });
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

      // Switching to declined clears any prior arrival
      const setOnUpdate: {
        status: string;
        distanceM: number | null;
        respondedAt: Date;
        arrivedAt?: Date | null;
      } = {
        status: parsed.data.status,
        distanceM,
        respondedAt: new Date(),
      };
      if (parsed.data.status === "declined") {
        setOnUpdate.arrivedAt = null;
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
          set: setOnUpdate,
        });
      res.json({ ok: true });
    } catch (err) {
      req.log.error({ err }, "respond emergency failed");
      sendError(res, 500, "Could not record response");
    }
  },
);

router.post(
  "/emergencies/:id/arrive",
  requireVolunteerOrHigher,
  async (req, res) => {
    const u = req.session.user!;
    if (u.role !== "volunteer") {
      return sendError(res, 403, "Only Volunteers can mark arrival");
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, "Invalid id");
    try {
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
      const row = prior[0];
      if (!row) return sendError(res, 404, "You haven't responded to this emergency");
      if (row.status !== "accepted") {
        return sendError(res, 403, "You must accept the emergency before marking arrived");
      }
      if (row.arrivedAt) {
        return res.json({ ok: true });
      }
      await db
        .update(emergencyResponses)
        .set({ arrivedAt: new Date() })
        .where(
          and(
            eq(emergencyResponses.emergencyId, id),
            eq(emergencyResponses.volunteerId, u.id),
          ),
        );
      res.json({ ok: true });
    } catch (err) {
      req.log.error({ err }, "arrive emergency failed");
      sendError(res, 500, "Could not mark arrival");
    }
  },
);

export default router;
