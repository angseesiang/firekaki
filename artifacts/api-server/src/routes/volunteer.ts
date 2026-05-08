import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, volunteerUsers } from "@workspace/db";
import { UpdateVolunteerLocationBody } from "@workspace/api-zod";
import { requireAuth, sendError } from "../lib/middleware";

const router: IRouter = Router();

router.post("/volunteer/location", requireAuth, async (req, res) => {
  const u = req.session.user!;
  if (u.role !== "volunteer") {
    return sendError(res, 403, "Volunteer role required");
  }
  const parsed = UpdateVolunteerLocationBody.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, "Invalid coordinates");
  const { lat, lng } = parsed.data;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return sendError(res, 400, "Coordinates out of range");
  }
  try {
    await db
      .update(volunteerUsers)
      .set({ lastLat: lat, lastLng: lng, lastSeenAt: new Date() })
      .where(eq(volunteerUsers.id, u.id));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "update location failed");
    sendError(res, 500, "Could not update location");
  }
});

export default router;
