import { Router, type IRouter } from "express";
import { eq, isNull, desc } from "drizzle-orm";
import { db, vulnerableUsers } from "@workspace/db";
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

void isNull;

export default router;
