import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  db,
  adminUsers,
  reviewerUsers,
  volunteerUsers,
  vulnerableUsers,
} from "@workspace/db";
import {
  SignupBody,
  LoginBody,
  SignupResponse,
  LoginResponse,
  LogoutResponse,
  GetMeResponse,
  VerifyEmailQueryParams,
  VerifyEmailResponse as VerifyEmailResponseSchema,
  ResendVerificationResponse,
} from "@workspace/api-zod";
import type { Role } from "./auth-types";
import { sendVerificationEmail } from "../lib/email";

const router: IRouter = Router();

type SessionUser = NonNullable<Request["session"]["user"]>;
type EmailedRole = "volunteer" | "vulnerable";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24h

function sendError(res: Response, status: number, message: string) {
  res.status(status).json({ message });
}

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

function emailableTable(role: EmailedRole) {
  return role === "volunteer" ? volunteerUsers : vulnerableUsers;
}

function regenerateAndSet(req: Request, user: SessionUser): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.user = user;
      req.session.save((saveErr) => {
        if (saveErr) return reject(saveErr);
        resolve();
      });
    });
  });
}

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

function newToken() {
  return randomBytes(32).toString("hex");
}

router.post("/auth/signup", async (req, res) => {
  const parsed = SignupBody.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const { email, password, name, roles, volunteer, vulnerable } = parsed.data;
  const emailNorm = email.trim().toLowerCase();
  const nameNorm = name.trim();

  if (!nameNorm) return sendError(res, 400, "Name is required");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return sendError(res, 400, "Please enter a valid email address");
  }
  if (roles.includes("volunteer") && !volunteer) {
    return sendError(res, 400, "Volunteer profile details are required");
  }
  if (roles.includes("vulnerable") && !vulnerable) {
    return sendError(res, 400, "Vulnerable profile details are required");
  }
  if (roles.includes("vulnerable") && vulnerable) {
    for (const [k, v] of Object.entries(vulnerable)) {
      if (typeof v === "string" && !v.trim()) {
        return sendError(res, 400, `Vulnerable ${k} is required`);
      }
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = newToken();
  const tokenExpires = new Date(Date.now() + TOKEN_TTL_MS);

  let sessionUser: SessionUser;
  let primaryRole: EmailedRole;
  try {
    const result = await db.transaction(async (tx) => {
      let last:
        | { id: number; role: EmailedRole; verified?: boolean }
        | null = null;

      if (roles.includes("volunteer")) {
        const existing = await tx
          .select({ id: volunteerUsers.id })
          .from(volunteerUsers)
          .where(eq(volunteerUsers.email, emailNorm))
          .limit(1);
        if (existing.length > 0) {
          throw new HttpError(409, "Email already registered as Volunteer");
        }
        const inserted = await tx
          .insert(volunteerUsers)
          .values({
            email: emailNorm,
            passwordHash,
            name: nameNorm,
            skills: volunteer?.skills?.trim() || null,
            gpsConsent: volunteer?.gpsConsent ?? false,
            verificationToken,
            verificationTokenExpiresAt: tokenExpires,
          })
          .returning({ id: volunteerUsers.id });
        const row = inserted[0];
        if (row) last = { id: row.id, role: "volunteer" };
      }

      if (roles.includes("vulnerable")) {
        const existing = await tx
          .select({ id: vulnerableUsers.id })
          .from(vulnerableUsers)
          .where(eq(vulnerableUsers.email, emailNorm))
          .limit(1);
        if (existing.length > 0) {
          throw new HttpError(409, "Email already registered as Vulnerable");
        }
        const inserted = await tx
          .insert(vulnerableUsers)
          .values({
            email: emailNorm,
            passwordHash,
            name: nameNorm,
            address: vulnerable!.address.trim(),
            nokName: vulnerable!.nokName.trim(),
            nokRelation: vulnerable!.nokRelation.trim(),
            nokContact: vulnerable!.nokContact.trim(),
            verificationToken,
            verificationTokenExpiresAt: tokenExpires,
          })
          .returning({
            id: vulnerableUsers.id,
            verified: vulnerableUsers.verified,
          });
        const row = inserted[0];
        if (row)
          last = { id: row.id, role: "vulnerable", verified: row.verified };
      }

      if (!last) throw new HttpError(400, "No role selected");
      return last;
    });

    primaryRole = result.role;
    sessionUser = {
      id: result.id,
      email: emailNorm,
      name: nameNorm,
      role: result.role,
      verified: result.verified,
      emailVerified: false,
    };
  } catch (err) {
    if (err instanceof HttpError) {
      return sendError(res, err.status, err.message);
    }
    const code = (err as { code?: string }).code;
    if (code === "23505") {
      return sendError(res, 409, "Email already registered");
    }
    req.log.error({ err }, "signup failed");
    return sendError(res, 500, "Could not complete sign-up");
  }

  // Send verification email (non-fatal — user can request resend later)
  const sendResult = await sendVerificationEmail({
    to: emailNorm,
    name: nameNorm,
    role: primaryRole,
    token: verificationToken,
  });
  if (!sendResult.ok) {
    req.log.warn({ err: sendResult.error }, "verification email send failed");
  }

  try {
    await regenerateAndSet(req, sessionUser);
  } catch (err) {
    req.log.error({ err }, "session regenerate failed");
    return sendError(res, 500, "Could not start session");
  }
  res.json(SignupResponse.parse(sessionUser));
});

router.get("/auth/verify", async (req, res) => {
  const parsed = VerifyEmailQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return sendError(res, 400, "Missing or invalid token");
  }
  const { token, role } = parsed.data;
  const table = emailableTable(role);

  const rows = await db
    .select()
    .from(table)
    .where(eq(table.verificationToken, token))
    .limit(1);
  const user = rows[0];
  if (!user) return sendError(res, 400, "Invalid or already-used token");
  if (user.emailVerifiedAt) {
    if (req.session.user?.id === user.id && req.session.user.role === role) {
      req.session.user.emailVerified = true;
      req.session.save(() => {});
    }
    return res.json(
      VerifyEmailResponseSchema.parse({ ok: true, email: user.email, role }),
    );
  }
  if (
    !user.verificationTokenExpiresAt ||
    user.verificationTokenExpiresAt.getTime() < Date.now()
  ) {
    return sendError(res, 400, "This link has expired. Request a new one.");
  }

  await db
    .update(table)
    .set({
      emailVerifiedAt: new Date(),
      verificationToken: null,
      verificationTokenExpiresAt: null,
    })
    .where(eq(table.id, user.id));

  if (req.session.user?.id === user.id && req.session.user.role === role) {
    req.session.user.emailVerified = true;
    req.session.save(() => {});
  }

  res.json(
    VerifyEmailResponseSchema.parse({ ok: true, email: user.email, role }),
  );
});

router.post("/auth/resend-verification", async (req, res) => {
  const u = req.session.user;
  if (!u) return sendError(res, 401, "Not authenticated");
  if (u.role !== "volunteer" && u.role !== "vulnerable") {
    return sendError(res, 400, "This role does not need email verification");
  }
  if (u.emailVerified) {
    return sendError(res, 400, "Email already verified");
  }
  const role = u.role;
  const table = emailableTable(role);
  const token = newToken();
  const expires = new Date(Date.now() + TOKEN_TTL_MS);
  await db
    .update(table)
    .set({ verificationToken: token, verificationTokenExpiresAt: expires })
    .where(and(eq(table.id, u.id), eq(table.email, u.email)));

  const sendResult = await sendVerificationEmail({
    to: u.email,
    name: u.name,
    role,
    token,
  });
  if (!sendResult.ok) {
    req.log.error({ err: sendResult.error }, "resend verification failed");
    return sendError(res, 500, "Could not send email right now");
  }
  res.json(ResendVerificationResponse.parse({ ok: true }));
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const { email, password, role } = parsed.data;
  const emailNorm = email.trim().toLowerCase();
  const table = tableForRole(role);

  const rows = await db
    .select()
    .from(table)
    .where(eq(table.email, emailNorm))
    .limit(1);
  const user = rows[0];
  if (!user) return sendError(res, 401, "Invalid email or password");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return sendError(res, 401, "Invalid email or password");

  const verified =
    role === "vulnerable" ? (user as { verified: boolean }).verified : undefined;
  const emailVerified =
    role === "volunteer" || role === "vulnerable"
      ? Boolean((user as { emailVerifiedAt: Date | null }).emailVerifiedAt)
      : true;

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role,
    verified,
    emailVerified,
  };

  try {
    await regenerateAndSet(req, sessionUser);
  } catch (err) {
    req.log.error({ err }, "session regenerate failed");
    return sendError(res, 500, "Could not start session");
  }
  res.json(LoginResponse.parse(sessionUser));
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json(LogoutResponse.parse({ ok: true }));
  });
});

router.get("/auth/me", (req: Request, res) => {
  const u = req.session.user;
  if (!u) return sendError(res, 401, "Not authenticated");
  res.json(GetMeResponse.parse(u));
});

export default router;
