import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@workspace/db";
import type { Role } from "../routes/auth-types";

declare module "express-session" {
  interface SessionData {
    user?: {
      id: number;
      email: string;
      name: string;
      role: Role;
      verified?: boolean;
    };
  }
}

const PgStore = connectPgSimple(session);

const secret = process.env["SESSION_SECRET"];
if (!secret) {
  throw new Error("SESSION_SECRET must be set");
}

export const sessionMiddleware = session({
  store: new PgStore({
    pool,
    tableName: "session",
  }),
  secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
});
