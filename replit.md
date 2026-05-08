# Fire Kaki

A neighbour-powered first-response network for Singapore's most vulnerable — proposal site presenting the four-frontend, layered-backend community safety platform inspired by the Jalan Besar Fire Safety Kakis.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- API contract (source of truth): `lib/api-spec/openapi.yaml`
- DB schemas (one file per role vault): `lib/db/src/schema/{admin,reviewer,volunteer,vulnerable}.ts`
- API server routes: `artifacts/api-server/src/routes/{health,auth}.ts`
- Session middleware: `artifacts/api-server/src/lib/session.ts` (express-session + connect-pg-simple)
- Frontend auth hooks: `artifacts/fire-kaki/src/lib/auth.ts`
- Frontend pages: `artifacts/fire-kaki/src/pages/{home,login,signup,dashboard,admin,verify}.tsx`
- Emergency / reviewer / volunteer routes: `artifacts/api-server/src/routes/{emergencies,reviewer,volunteer}.ts`
- Shared auth middleware: `artifacts/api-server/src/lib/middleware.ts`
- Theme tokens: `artifacts/fire-kaki/src/index.css` (uses `--primary` for the ember red)

## Architecture decisions

- Each role gets its own isolated "vault" table — `admin_users`, `reviewer_users`, `volunteer_users`, `vulnerable_users` — so the same email can register independently as Volunteer and Vulnerable. Login requires a role to disambiguate.
- Sessions are stored in Postgres via `connect-pg-simple` (table `session`, auto-created on first run) so they survive restarts.
- Volunteer and Vulnerable signups require email verification: a one-time 32-byte token (24h TTL) is stored on the row and a Resend email links to `/verify?token=…&role=…`. `email_verified_at` flags successful verification; the session carries `emailVerified: boolean` so the dashboard can show a banner with a "Resend" button (`POST /api/auth/resend-verification`). Reviewer/Admin accounts are admin-created so no email check is required.
- All four user vaults carry a `disabled BOOLEAN` flag. `/api/auth/login` rejects disabled accounts with 403 before issuing a session. Admin manages it via `POST /api/admin/users/{role}/{id}/disable|enable` and `DELETE /api/admin/users/{role}/{id}` — list everything via `GET /api/admin/users-overview`.
- Reviewer and Admin accounts are not self-registerable. Bootstrap the first Admin with `pnpm --filter @workspace/scripts run seed-admin` (env vars `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, or positional args). Once signed in as Admin, use `/admin` to create more Reviewer or Admin accounts (POST `/api/admin/users`, gated by `requireAdmin` middleware).

## Product

- Public proposal site at `/` describing the Fire Kaki community safety network
- `/signup` — register as Volunteer and/or Vulnerable (creates a row in each chosen vault)
- `/login` — sign in with email + password + role
- `/dashboard` — post-login landing showing role, vault, and verification status
- `/admin` — Admin-only "Manage users" page: create Reviewer/Admin, plus 4-tab table (Admins/Reviewers/Volunteers/Vulnerable) with Disable / Enable / Delete per row. Self-protect: an admin cannot disable or delete themselves, and the last remaining admin cannot be deleted.
- `/reviewer/users` — Reviewer (and Admin) "Manage users" page: read-only roster of every Volunteer + Vulnerable account with a single **Verify** action per row. No add/disable/delete (those stay Admin-only on `/admin`). Volunteers gained a `verified` boolean (mirroring vulnerables) so a Reviewer can vouch for them too. Endpoints: `GET /api/reviewer/users-overview`, `POST /api/reviewer/volunteer/{id}/verify`, `POST /api/reviewer/vulnerable/{id}/verify`.
- Reviewer + Admin dashboards include an `EmergencyNotifier` that polls `/emergencies` (8 s) and fires a toast (and a browser `Notification` if permission granted) for every new active emergency, with a "Enable notifications" prompt and `localStorage` deduping on `firekaki:lastSeenEmergencyId:<userId>`. Initial backlog never alerts.
- `/dashboard` renders role-tiered panels (inheritance: Admin ⊃ Reviewer ⊃ {Volunteer, Vulnerable}; Volunteer is standalone). Vulnerable → request Minor + own history. Volunteer → GPS share + nearby (≤2 km) active emergencies + accept/decline. Reviewer → pending verifications + activate Major + see all emergencies (read-only). Admin → same as Reviewer + deactivate emergencies + Manage users link.

## Emergency model

- `emergencies` table: type (minor|major), status (active|deactivated|resolved), creator role/id/name, lat/lng/address, deactivated_by_admin_id.
- `emergency_responses` table: composite PK (emergency_id, volunteer_id), status (accepted|declined), distanceM at time of response, `arrived_at TIMESTAMP NULL`.
- Volunteer matching is server-side Haversine distance vs. `volunteer_users.last_lat/last_lng`; default radius 2 km (`NEARBY_RADIUS_M` in `routes/emergencies.ts`). Volunteers always see emergencies they've already responded to, regardless of distance.
- Real-time response telemetry on `GET /emergencies`: every emergency carries `responseStats {accepted, declined, arrived, total}`. Reviewer/Admin scope additionally gets a `responders[]` array of accepted volunteers with `{volunteerId, name, respondedAt, arrivedAt, distanceM, etaSeconds}` — distance is recomputed on each request from the volunteer's *current* `last_lat/lng` (not the snapshot at response time), and ETA = `distanceM / (5 km/h walking)` (null once arrived or no GPS). Volunteer scope adds `myArrivedAt` to their own response. Polled every 8 s by the dashboard query.
- `POST /emergencies/{id}/arrive` (volunteer) — sets `arrived_at = now()` only if the caller's response is `accepted`. Switching from accepted → declined via `/respond` clears any prior `arrived_at`.
- Role gating in `artifacts/api-server/src/lib/middleware.ts`: `requireAuth`, `requireAdmin`, `requireReviewerOrHigher`, `requireVolunteerOrHigher`. Per-endpoint type checks live in the route handlers (e.g. only `vulnerable` may create `type=minor`; only `reviewer`/`admin` may create `type=major`).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Resend will refuse to send from an unverified domain (403 `validation_error`). The default `from` is `onboarding@resend.dev` — override with `RESEND_FROM_EMAIL` only after verifying the domain at https://resend.com/domains. Email-send failures are logged but do not block signup.
- After any edit to `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` AND restart the api-server workflow so its esbuild bundle picks up the regenerated zod schemas.
- `pnpm --filter @workspace/db run push` will try to drop the manually-created `session` table. For additive schema changes, use raw SQL `ALTER TABLE` via `executeSql` instead.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
