import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq, ne, desc } from "drizzle-orm";
import {
  db,
  adminUsers,
  reviewerUsers,
  volunteerUsers,
  vulnerableUsers,
} from "@workspace/db";
import {
  AdminCreateUserBody,
  AdminCreateUserResponse,
} from "@workspace/api-zod";
import { requireAdmin, sendError } from "../lib/middleware";

const router: IRouter = Router();

type Role = "admin" | "reviewer" | "volunteer" | "vulnerable";

function tableForRole(role: Role) {
  switch (role) {
    case "admin":
      return adminUsers;
    case "reviewer":
      return reviewerUsers;
    case "volunteer":
      return volunteerUsers;
    case "vulnerable":
      return vulnerableUsers;
  }
}

function isRole(s: string): s is Role {
  return s === "admin" || s === "reviewer" || s === "volunteer" || s === "vulnerable";
}

router.post("/admin/users", requireAdmin, async (req, res) => {
  const parsed = AdminCreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const { email, password, name, role } = parsed.data;
  const emailNorm = email.trim().toLowerCase();
  const nameNorm = name.trim();

  if (!nameNorm) return sendError(res, 400, "Name is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return sendError(res, 400, "Please enter a valid email address");
  }

  const table = role === "admin" ? adminUsers : reviewerUsers;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const existing = await db
      .select({ id: table.id })
      .from(table)
      .where(eq(table.email, emailNorm))
      .limit(1);
    if (existing.length > 0) {
      return sendError(res, 409, `Email already registered as ${role}`);
    }
    const inserted = await db
      .insert(table)
      .values({ email: emailNorm, passwordHash, name: nameNorm })
      .returning({ id: table.id });
    const row = inserted[0];
    if (!row) return sendError(res, 500, "Insert failed");
    res.json(
      AdminCreateUserResponse.parse({
        id: row.id,
        email: emailNorm,
        name: nameNorm,
        role,
      }),
    );
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "23505"
    ) {
      return sendError(res, 409, `Email already registered as ${role}`);
    }
    req.log.error({ err }, "admin create user failed");
    sendError(res, 500, "Could not create user");
  }
});

router.get("/admin/users-overview", requireAdmin, async (req, res) => {
  try {
    const [admins, reviewers, volunteers, vulnerables] = await Promise.all([
      db.select().from(adminUsers).orderBy(desc(adminUsers.createdAt)),
      db.select().from(reviewerUsers).orderBy(desc(reviewerUsers.createdAt)),
      db.select().from(volunteerUsers).orderBy(desc(volunteerUsers.createdAt)),
      db.select().from(vulnerableUsers).orderBy(desc(vulnerableUsers.createdAt)),
    ]);
    res.json({
      admins: admins.map((a) => ({
        id: a.id,
        email: a.email,
        name: a.name,
        disabled: a.disabled,
        createdAt: a.createdAt.toISOString(),
      })),
      reviewers: reviewers.map((r) => ({
        id: r.id,
        email: r.email,
        name: r.name,
        disabled: r.disabled,
        createdAt: r.createdAt.toISOString(),
      })),
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
    req.log.error({ err }, "admin list users failed");
    sendError(res, 500, "Could not list users");
  }
});

async function setDisabled(
  role: Role,
  id: number,
  disabled: boolean,
): Promise<boolean> {
  const t = tableForRole(role);
  const updated = await db
    .update(t)
    .set({ disabled })
    .where(eq(t.id, id))
    .returning({ id: t.id });
  return updated.length > 0;
}

router.post("/admin/users/:role/:id/disable", requireAdmin, async (req, res) => {
  const u = req.session.user!;
  const role = String(req.params.role ?? "");
  const idStr = String(req.params.id ?? "");
  if (!isRole(role)) return sendError(res, 400, "Invalid role");
  const id = Number(idStr);
  if (!Number.isInteger(id)) return sendError(res, 400, "Invalid id");
  if (role === "admin" && id === u.id) {
    return sendError(res, 400, "You cannot disable your own admin account");
  }
  try {
    const ok = await setDisabled(role, id, true);
    if (!ok) return sendError(res, 404, "User not found");
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "disable user failed");
    sendError(res, 500, "Could not disable user");
  }
});

router.post("/admin/users/:role/:id/enable", requireAdmin, async (req, res) => {
  const role = String(req.params.role ?? "");
  const idStr = String(req.params.id ?? "");
  if (!isRole(role)) return sendError(res, 400, "Invalid role");
  const id = Number(idStr);
  if (!Number.isInteger(id)) return sendError(res, 400, "Invalid id");
  try {
    const ok = await setDisabled(role, id, false);
    if (!ok) return sendError(res, 404, "User not found");
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "enable user failed");
    sendError(res, 500, "Could not enable user");
  }
});

router.post("/admin/users/:role/:id", requireAdmin, async (req, res) => {
  const role = String(req.params.role ?? "");
  const idStr = String(req.params.id ?? "");
  if (!isRole(role)) return sendError(res, 400, "Invalid role");
  const id = Number(idStr);
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
      set.skills = body.skills === null ? null : (body.skills as string).trim() || null;
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

  try {
    const t = tableForRole(role);
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
    req.log.error({ err }, "admin update user failed");
    sendError(res, 500, "Could not update user");
  }
});

router.delete("/admin/users/:role/:id", requireAdmin, async (req, res) => {
  const u = req.session.user!;
  const role = String(req.params.role ?? "");
  const idStr = String(req.params.id ?? "");
  if (!isRole(role)) return sendError(res, 400, "Invalid role");
  const id = Number(idStr);
  if (!Number.isInteger(id)) return sendError(res, 400, "Invalid id");
  if (role === "admin" && id === u.id) {
    return sendError(res, 400, "You cannot delete your own admin account");
  }
  if (role === "admin") {
    // protect against deleting the last admin
    const others = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(ne(adminUsers.id, id))
      .limit(1);
    if (others.length === 0) {
      return sendError(res, 400, "Cannot delete the last remaining admin");
    }
  }
  try {
    const t = tableForRole(role);
    const deleted = await db
      .delete(t)
      .where(eq(t.id, id))
      .returning({ id: t.id });
    if (deleted.length === 0) return sendError(res, 404, "User not found");
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "delete user failed");
    sendError(res, 500, "Could not delete user");
  }
});

export default router;
