import type { Request, Response, NextFunction } from "express";

export function sendError(res: Response, status: number, message: string) {
  res.status(status).json({ message });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) return sendError(res, 401, "Not authenticated");
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const u = req.session.user;
  if (!u) return sendError(res, 401, "Not authenticated");
  if (u.role !== "admin") return sendError(res, 403, "Admin role required");
  next();
}

export function requireReviewerOrHigher(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const u = req.session.user;
  if (!u) return sendError(res, 401, "Not authenticated");
  if (u.role !== "admin" && u.role !== "reviewer")
    return sendError(res, 403, "Reviewer role required");
  next();
}

export function requireVolunteerOrHigher(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const u = req.session.user;
  if (!u) return sendError(res, 401, "Not authenticated");
  if (u.role === "vulnerable")
    return sendError(res, 403, "Volunteer role required");
  next();
}
