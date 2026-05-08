import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, vulnerableUsers, volunteerUsers } from "@workspace/db";
import { requireReviewerOrHigher, sendError } from "../lib/middleware";

const router: IRouter = Router();

router.get("/reviewer/pending-vulnerable", requireReviewerOrHigher, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(vulnerableUsers)
      .where(eq(vulnerableUsers.verified, false))
      .orderBy(desc(vulnerableUsers.createdAt));
    res.json({
      items: rows.map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        address: r.address,
        nokName: r.nokName,
        nokRelation: r.nokRelation,
        nokContact: r.nokContact,
        emailVerified: r.emailVerifiedAt != null,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "list pending vulnerable failed");
    sendError(res, 500, "Could not list pending vulnerable accounts");
  }
});

router.get("/reviewer/users-overview", requireReviewerOrHigher, async (req, res) => {
  try {
    const [volunteers, vulnerables] = await Promise.all([
      db.select().from(volunteerUsers).orderBy(desc(volunteerUsers.createdAt)),
      db.select().from(vulnerableUsers).orderBy(desc(vulnerableUsers.createdAt)),
    ]);
    res.json({
      volunteers: volunteers.map((v) => ({
        id: v.id,
        email: v.email,
        name: v.name,
        disabled: v.disabled,
        skills: v.skills,
        gpsConsent: v.gpsConsent,
        emailVerified: v.emailVerifiedAt != null,
        verified: v.verified,
        lastSeenAt: v.lastSeenAt ? v.lastSeenAt.toISOString() : null,
        createdAt: v.createdAt.toISOString(),
      })),
      vulnerables: vulnerables.map((v) => ({
        id: v.id,
        email: v.email,
        name: v.name,
        disabled: v.disabled,
        verified: v.verified,
        emailVerified: v.emailVerifiedAt != null,
        address: v.address,
        nokName: v.nokName,
        nokRelation: v.nokRelation,
        nokContact: v.nokContact,
        createdAt: v.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "reviewer users overview failed");
    sendError(res, 500, "Could not list users");
  }
});

router.post(
  "/reviewer/volunteer/:id/verify",
  requireReviewerOrHigher,
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, "Invalid id");
    try {
      const updated = await db
        .update(volunteerUsers)
        .set({ verified: true })
        .where(eq(volunteerUsers.id, id))
        .returning({ id: volunteerUsers.id });
      if (updated.length === 0) return sendError(res, 404, "Not found");
      res.json({ ok: true });
    } catch (err) {
      req.log.error({ err }, "verify volunteer failed");
      sendError(res, 500, "Could not verify");
    }
  },
);

router.post(
  "/reviewer/vulnerable/:id/verify",
  requireReviewerOrHigher,
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, "Invalid id");
    try {
      const updated = await db
        .update(vulnerableUsers)
        .set({ verified: true })
        .where(eq(vulnerableUsers.id, id))
        .returning({ id: vulnerableUsers.id });
      if (updated.length === 0) return sendError(res, 404, "Not found");
      res.json({ ok: true });
    } catch (err) {
      req.log.error({ err }, "verify vulnerable failed");
      sendError(res, 500, "Could not verify");
    }
  },
);

export default router;
