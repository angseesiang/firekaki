import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, adminUsers, reviewerUsers } from "@workspace/db";
import { AdminCreateUserBody, AdminCreateUserResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function sendError(res: Response, status: number, message: string) {
  res.status(status).json({ message });
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const u = req.session.user;
  if (!u) return sendError(res, 401, "Not authenticated");
  if (u.role !== "admin") return sendError(res, 403, "Admin role required");
  next();
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

export default router;
