import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, nokUsers, vulnerableUsers } from "@workspace/db";
import { requireAuth, sendError } from "../lib/middleware";

const router: IRouter = Router();

router.get("/nok/me", requireAuth, async (req, res) => {
  const u = req.session.user!;
  if (u.role !== "nok") {
    return sendError(res, 403, "NOK account required");
  }
  try {
    const rows = await db
      .select({
        id: nokUsers.id,
        name: nokUsers.name,
        email: nokUsers.email,
        contact: nokUsers.contact,
        vId: vulnerableUsers.id,
        vName: vulnerableUsers.name,
        vAddress: vulnerableUsers.address,
        vVerified: vulnerableUsers.verified,
        vLat: vulnerableUsers.lastLat,
        vLng: vulnerableUsers.lastLng,
        vSeen: vulnerableUsers.lastSeenAt,
      })
      .from(nokUsers)
      .leftJoin(
        vulnerableUsers,
        eq(vulnerableUsers.id, nokUsers.linkedVulnerableId),
      )
      .where(eq(nokUsers.id, u.id))
      .limit(1);
    const r = rows[0];
    if (!r || r.vId == null) return sendError(res, 404, "Profile not found");
    res.json({
      id: r.id,
      name: r.name,
      email: r.email,
      contact: r.contact,
      linkedVulnerable: {
        id: r.vId,
        name: r.vName ?? "",
        address: r.vAddress ?? "",
        verified: r.vVerified ?? false,
        lastLat: r.vLat,
        lastLng: r.vLng,
        lastSeenAt: r.vSeen ? r.vSeen.toISOString() : null,
      },
    });
  } catch (err) {
    req.log.error({ err }, "nok me failed");
    sendError(res, 500, "Could not load profile");
  }
});

export default router;
