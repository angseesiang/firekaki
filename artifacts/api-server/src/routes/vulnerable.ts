import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, vulnerableUsers } from "@workspace/db";
import { requireAuth, sendError } from "../lib/middleware";

const router: IRouter = Router();

router.get("/vulnerable/me", requireAuth, async (req, res) => {
  const u = req.session.user!;
  if (u.role !== "vulnerable") {
    return sendError(res, 403, "Vulnerable account required");
  }
  try {
    const rows = await db
      .select()
      .from(vulnerableUsers)
      .where(eq(vulnerableUsers.id, u.id))
      .limit(1);
    const r = rows[0];
    if (!r) return sendError(res, 404, "Profile not found");
    res.json({
      id: r.id,
      name: r.name,
      email: r.email,
      address: r.address,
      nokName: r.nokName,
      nokRelation: r.nokRelation,
      nokContact: r.nokContact,
      verified: r.verified,
      emailVerified: r.emailVerifiedAt != null,
    });
  } catch (err) {
    req.log.error({ err }, "vulnerable me failed");
    sendError(res, 500, "Could not load profile");
  }
});

router.post("/vulnerable/location", requireAuth, async (req, res) => {
  const u = req.session.user!;
  if (u.role !== "vulnerable") {
    return sendError(res, 403, "Vulnerable account required");
  }
  const body = (req.body ?? {}) as { lat?: unknown; lng?: unknown };
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return sendError(res, 400, "lat and lng required");
  }
  try {
    await db
      .update(vulnerableUsers)
      .set({ lastLat: lat, lastLng: lng, lastSeenAt: new Date() })
      .where(eq(vulnerableUsers.id, u.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "vulnerable location update failed");
    sendError(res, 500, "Could not update location");
  }
});

export default router;
