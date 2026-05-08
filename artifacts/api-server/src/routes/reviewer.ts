import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
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

router.post(
  "/reviewer/users/:role/:id",
  requireReviewerOrHigher,
  async (req, res) => {
    const role = String(req.params.role ?? "");
    if (role !== "volunteer" && role !== "vulnerable") {
      return sendError(res, 400, "Reviewers may only edit volunteer or vulnerable accounts");
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return sendError(res, 400, "Invalid id");

    const body = (req.body ?? {}) as Record<string, unknown>;
    const set: Record<string, unknown> = {};

    if (typeof body.name === "string") {
      const n = body.name.trim();
      if (!n) return sendError(res, 400, "Name cannot be empty");
      set.name = n;
    }
    if (typeof body.email === "string") {
      const e = body.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        return sendError(res, 400, "Please enter a valid email address");
      }
      set.email = e;
    }
    if (typeof body.password === "string" && body.password.length > 0) {
      if (body.password.length < 8) {
        return sendError(res, 400, "Password must be at least 8 characters");
      }
      set.passwordHash = await bcrypt.hash(body.password, 10);
    }
    if (role === "volunteer") {
      if (body.skills === null || typeof body.skills === "string") {
        set.skills =
          body.skills === null ? null : (body.skills as string).trim() || null;
      }
    }
    if (role === "vulnerable") {
      for (const f of ["address", "nokName", "nokRelation", "nokContact"] as const) {
        const v = body[f];
        if (typeof v === "string") {
          const t = v.trim();
          if (!t) return sendError(res, 400, `${f} cannot be empty`);
          set[f] = t;
        }
      }
    }

    if (Object.keys(set).length === 0) {
      return sendError(res, 400, "No fields to update");
    }

    const t = role === "volunteer" ? volunteerUsers : vulnerableUsers;
    try {
      if (typeof set.email === "string") {
        const dup = await db
          .select({ id: t.id })
          .from(t)
          .where(eq(t.email, set.email as string))
          .limit(1);
        if (dup[0] && dup[0].id !== id) {
          return sendError(res, 409, `Email already registered as ${role}`);
        }
      }
      const updated = await db
        .update(t)
        .set(set)
        .where(eq(t.id, id))
        .returning({ id: t.id });
      if (updated.length === 0) return sendError(res, 404, "User not found");
      res.json({ ok: true });
    } catch (err) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        (err as { code?: string }).code === "23505"
      ) {
        return sendError(res, 409, `Email already registered as ${role}`);
      }
      req.log.error({ err }, "reviewer update user failed");
      sendError(res, 500, "Could not update user");
    }
  },
);

export default router;
