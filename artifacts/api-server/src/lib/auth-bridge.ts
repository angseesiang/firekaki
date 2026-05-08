import type { RequestHandler } from "express";
import * as signature from "cookie-signature";

const COOKIE_NAME = "connect.sid";

function getSecret(): string {
  const secret = process.env["SESSION_SECRET"];
  if (!secret) throw new Error("SESSION_SECRET must be set");
  return secret;
}

export function signSessionToken(sid: string): string {
  return "s:" + signature.sign(sid, getSecret());
}

export const bearerToCookie: RequestHandler = (req, _res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token && !(req.headers.cookie ?? "").includes(`${COOKIE_NAME}=`)) {
      const encoded = encodeURIComponent(token);
      const existing = req.headers.cookie ?? "";
      req.headers.cookie = existing
        ? `${existing}; ${COOKIE_NAME}=${encoded}`
        : `${COOKIE_NAME}=${encoded}`;
    }
  }
  next();
};
