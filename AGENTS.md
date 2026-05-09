<!-- For AI assistants working in this repo. Read this for stack, layout, conventions, and architecture before editing or planning. -->

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
- TypeScript: `tsconfig.base.json` is **partial**-strict (`strictFunctionTypes: false`, `noImplicitOverride: false`); the other strict flags are on

## Conventions

- **pnpm only.** `npm install` aborts via the root `package.json` preinstall hook. Use `pnpm` for everything.
- **`catalog:` versioning** for shared deps. When adding a dep that already appears in `pnpm-workspace.yaml`'s `catalog:`, reference it as `"name": "catalog:"` rather than pinning a version.
- **24-hour `minimumReleaseAge`.** New dependency versions must be ≥ 24 hours old before pnpm will install them (`pnpm-workspace.yaml: minimumReleaseAge: 1440`). Supply-chain mitigation; `@replit/*` and `stripe-replit-sync` are excluded.
- **OpenAPI is the source of truth** for the API contract (`lib/api-spec/openapi.yaml`). After editing it, run `pnpm --filter @workspace/api-spec run codegen` to regenerate `@workspace/api-zod` + `@workspace/api-client-react`, then **restart the api-server workflow** so its esbuild bundle picks up the new schemas.
- **No hex color literals in `.tsx`.** Use design tokens from `artifacts/fire-kaki/src/index.css`. Forbidden patterns: `bg-[#…]`, `text-[#…]`, `border-[#…]`.
- **aria-labels on interactive elements.** Especially important for an emergency-response app.
- **Edit `AGENTS.md`, not `replit.md`.** `replit.md` is auto-mirrored from `AGENTS.md` by a pre-commit hook and `scripts/post-merge.sh`. Direct edits to `replit.md` are silently overwritten.

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
- API contract source of truth: `lib/api-spec/openapi.yaml` — orval generates Zod and React Query hooks from it
- Generated Zod schemas (do not hand-edit): `lib/api-zod/src/generated/`
- Generated React Query hooks + custom-fetch (with bearer-to-cookie bridge): `lib/api-client-react/src/`
- Workspace scripts package (e.g. `seed-admin`): `scripts/`

## Architecture decisions

- Each role gets its own isolated "vault" table — `admin_users`, `reviewer_users`, `volunteer_users`, `vulnerable_users`, `nok_users` — so the same email can register independently as Volunteer and Vulnerable. Login is by email+password only and sweeps the vaults in priority order (admin → reviewer → volunteer → vulnerable → nok); first matching `(email, passwordHash)` wins.
- The fifth role `nok` (Next-of-kin) is created at vulnerable signup when the user opts into "Create a NOK login": `nok_users` row carries `linkedVulnerableId` (FK → vulnerable_users ON DELETE CASCADE), `email` (unique within vault), `passwordHash`, `name`, `contact`. NOK accounts skip email verification (treated like admin/reviewer). NOK login lets the next-of-kin sign in and watch over the linked vulnerable's SOS feed. NOK email must (a) differ from the vulnerable's own email, (b) be unique within `nok_users`, and (c) **not collide with any higher-priority vault** (admin/reviewer/volunteer/vulnerable) — otherwise the login sweep would shadow the NOK account and make it unreachable.
- `/admin/users/{role}/{id}` endpoints take a `ManagedUserRole` (admin|reviewer|volunteer|vulnerable) — NOK is intentionally excluded from admin user-management because NOK accounts are auto-managed via their linked Vulnerable (cascade-deleted when the Vulnerable is removed).
- Sessions are stored in Postgres via `connect-pg-simple` (table `session`, auto-created on first run) so they survive restarts.
- Email verification is **disabled** — every new signup is auto-verified (`email_verified_at = now()` set on insert) and no verification email is sent. The `verification_token` / `verification_token_expires_at` columns and the legacy `/auth/verify`, `/auth/resend-verification`, `/verify` page remain in place but are no longer reachable in the normal flow. `emailVerified` on the session is always `true` for new signups, and any pre-existing pending rows were backfilled to verified.
- All four user vaults carry a `disabled BOOLEAN` flag. `/api/auth/login` rejects disabled accounts with 403 before issuing a session. Admin manages it via `POST /api/admin/users/{role}/{id}/disable|enable` and `DELETE /api/admin/users/{role}/{id}` — list everything via `GET /api/admin/users-overview`.
- Reviewer and Admin accounts are not self-registerable. Bootstrap the first Admin with `pnpm --filter @workspace/scripts run seed-admin` (env vars `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, or positional args). Once signed in as Admin, use `/admin` to create more Reviewer or Admin accounts (POST `/api/admin/users`, gated by `requireAdmin` middleware).
- **Bearer-to-cookie bridge** for non-browser clients: `@workspace/api-client-react`'s custom-fetch translates an `Authorization: Bearer <token>` header into a cookie session header server-side. This lets the Expo mobile app authenticate without full cookie support; web clients keep using cookies directly.

## Product

- Public proposal site at `/` describing the Fire Kaki community safety network
- `/signup` — register as Volunteer and/or Vulnerable (creates a row in each chosen vault)
- `/login` — sign in with email + password + role
- `/dashboard` — post-login landing showing role, vault, and verification status
- `/admin` — Admin-only sidebar shell ("Fire Kaki Admin") with sections **Overview / Verifications / Volunteers / Vulnerable / Live emergencies / Staff**. Overview shows 4 stat cards (Vulnerable Verified, Volunteers Active, Live Emergencies in red, Coverage ≤2km = % volunteers with `gpsConsent`) plus a Verification Queue table (Resident · Address · Next of Kin · Date · Status badge). Verifications lists pending Vulnerable + pending Volunteer with one-tap Verify. Volunteers/Vulnerable show every account with Edit / Disable / Enable / Delete (admin-only). Live emergencies lets admin Deactivate active SOS calls. Staff is the admins+reviewers vault with an inline "Add staff" form (POST `/api/admin/users`). Edit opens the shared `<UserEditModal>` (partial update via `POST /api/admin/users/{role}/{id}`, only changed fields sent). Email uniqueness enforced per-vault. Self-protect: an admin cannot disable or delete themselves, and the last remaining admin cannot be deleted.
- `/reviewer` — Reviewer-only sidebar shell ("Fire Kaki Reviewer") with the same five sections as Admin minus Staff. Same Overview stats + Verification Queue. Volunteers/Vulnerable rows expose Verify + Edit only — no add/disable/delete. Live emergencies is read-only with an Activate Major card on top (POST `/api/emergencies` with `type=major`). Edit goes through `POST /api/reviewer/users/{role}/{id}` (restricted to `volunteer`/`vulnerable`). `/dashboard` redirects admin→`/admin` and reviewer→`/reviewer` automatically. The legacy `/reviewer/users` URL still resolves to the same page for back-compat. Endpoints used: `GET /api/reviewer/users-overview`, `POST /api/reviewer/volunteer/{id}/verify`, `POST /api/reviewer/vulnerable/{id}/verify`, `POST /api/reviewer/users/{role}/{id}`.
- The shell + tile components live in `artifacts/fire-kaki/src/components/dash-shell.tsx` (`<DashShell>`, `<StatCard>`, `<StatusBadge>`) and the shared edit form in `artifacts/fire-kaki/src/components/user-edit-modal.tsx` — both reused by `/admin` and `/reviewer`.
- Reviewer + Admin dashboards include an `EmergencyNotifier` that polls `/emergencies` (8 s) and fires a toast (and a browser `Notification` if permission granted) for every new active emergency, with a "Enable notifications" prompt and `localStorage` deduping on `firekaki:lastSeenEmergencyId:<userId>`. Initial backlog never alerts.
- `/dashboard` renders role-tiered panels (inheritance: Admin ⊃ Reviewer ⊃ {Volunteer, Vulnerable}; Volunteer is standalone). Vulnerable → simplified phone-style screen: greeting "Hi, Madam {name}", one giant red circular SOS button (tap = create Minor emergency at current GPS), Next-of-kin card. GPS auto-tracks via `navigator.geolocation.watchPosition` and pushes every fix to `POST /vulnerable/location`. Volunteer → GPS share + nearby (≤2 km) active emergencies + accept/decline. Reviewer → pending verifications + activate Major + see all emergencies (read-only). Admin → same as Reviewer + deactivate emergencies + Manage users link.
- `/my-requests` (vulnerable-only) — full history of the caller's emergencies with response stats. Header link "Past requests" appears next to Sign out for vulnerable users on `/dashboard`.
- Vulnerable endpoints: `GET /api/vulnerable/me` (id, name, email, address, NOK fields, verified, emailVerified) and `POST /api/vulnerable/location` (lat, lng → updates `vulnerable_users.last_lat/last_lng/last_seen_at`). Both require `role==="vulnerable"`.
- NOK endpoint: `GET /api/nok/me` (returns NOK's id/name/email/contact + `linkedVulnerable {id, name, address, verified, lastLat, lastLng, lastSeenAt}`). Requires `role==="nok"`. NOK's `GET /api/emergencies` is auto-scoped to only emergencies created by their `linkedVulnerableId`. NOK is rejected by `requireVolunteerOrHigher` (cannot accept/decline/arrive/create emergencies). Dashboard renders a simplified `NokPanel` with greeting, "Watching over" card (linked vulnerable's name/address/last GPS), active SOS card, and recent SOS history; `EmergencyNotifier` (8 s poll + browser Notification) runs for NOK too.

## Emergency model

- `emergencies` table: type (minor|major), status (active|deactivated|resolved), creator role/id/name, lat/lng/address, deactivated_by_admin_id.
- `emergency_responses` table: composite PK (emergency_id, volunteer_id), status (accepted|declined), distanceM at time of response, `arrived_at TIMESTAMP NULL`.
- Volunteer matching is server-side Haversine distance vs. `volunteer_users.last_lat/last_lng`; default radius 2 km (`NEARBY_RADIUS_M` in `routes/emergencies.ts`). Volunteers always see emergencies they've already responded to, regardless of distance.
- Real-time response telemetry on `GET /emergencies`: every emergency carries `responseStats {accepted, declined, arrived, total}`. Reviewer/Admin/Vulnerable/NOK scopes additionally get a `responders[]` array of accepted volunteers with `{volunteerId, name, respondedAt, arrivedAt, distanceM, etaSeconds}` — distance is recomputed on each request from the volunteer's *current* `last_lat/lng` (not the snapshot at response time), and ETA = `distanceM / (5 km/h walking)` (null once arrived or no GPS). Vulnerable + NOK only ever receive responders for their own / linked emergency since the row set is pre-scoped (vulnerable: `creatorUserId===self`; nok: `creatorUserId===linkedVulnerableId`). Volunteer scope adds `myArrivedAt` to their own response. Polled every 8 s by the dashboard query. The Vulnerable SOS screen and NOK "Watching over" card render a shared `<ResponderStatus>` component showing the accepted count, the arrived count, and a per-responder list (name + distance + live ETA, or an "Arrived" badge).
- `POST /emergencies/{id}/arrive` (volunteer) — sets `arrived_at = now()` only if the caller's response is `accepted`. Switching from accepted → declined via `/respond` clears any prior `arrived_at`.
- Role gating in `artifacts/api-server/src/lib/middleware.ts`: `requireAuth`, `requireAdmin`, `requireReviewerOrHigher`, `requireVolunteerOrHigher`. Per-endpoint type checks live in the route handlers: `type=minor` is allowed for `vulnerable`, `reviewer`, `admin`; `type=major` is allowed for `reviewer`, `admin`. The verified-vulnerable + email-verified gate and the idempotent-active-SOS check only apply when a `vulnerable` user creates the minor (so reviewer/admin can fire repeated minors freely). Frontend: the `/admin` and `/reviewer` "Live emergencies" sections both render an `ActivateEmergencyCard` with a Major/Minor toggle.

## Maps

- Google Maps is wired into the web app via `@vis.gl/react-google-maps`. The shared component lives in `artifacts/fire-kaki/src/components/emergency-map.tsx` and renders pins for active SOS calls (red = Major, amber = Minor) plus an optional "you" pin (blue, volunteer current location).
- Places used: Vulnerable SOS card (own active emergency, focused), NOK "Watching over" card (linked active emergency, focused), Volunteer "Nearby alerts" (all visible calls + own GPS), Reviewer + Admin "Live emergencies" (all calls).
- The browser API key is injected at vite startup via `VITE_GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_API_KEY"` in `artifacts/fire-kaki/package.json`'s `dev`/`build` scripts. Restrict the key by HTTP referrer in Google Cloud Console — it's exposed to clients (this is normal for the Maps JavaScript API).
- Responder pins are not rendered: the `EmergencyResponder` payload only carries `distanceM`, not coordinates, so we'd need to add `lastLat/lastLng` to the responder serializer if we ever want to plot them.

## Gotchas

- Resend will refuse to send from an unverified domain (403 `validation_error`). The default `from` is `onboarding@resend.dev` — override with `RESEND_FROM_EMAIL` only after verifying the domain at https://resend.com/domains. Email-send failures are logged but do not block signup.
- After any edit to `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` AND restart the api-server workflow so its esbuild bundle picks up the regenerated zod schemas.
- `pnpm --filter @workspace/db run push` will try to drop the manually-created `session` table. For additive schema changes, use raw SQL `ALTER TABLE` via `executeSql` instead.
- Resend uses Replit's `REPL_IDENTITY` connector token (`artifacts/api-server/src/lib/email.ts`). Email sending is not portable to non-Replit hosts without rewiring the integration.
- `lib/db` has no `migrations/` folder — schema changes are deployed via `drizzle-kit push`. **For additive changes to tables that were created manually (especially `session`), prefer raw SQL `ALTER TABLE`** because `push` will try to drop and recreate them.

## Pointers

- `CONTRIBUTING.md` — human-facing contributor process (prereqs, branching, commits, PR flow).
- `docs/superpowers/specs/` — active design specs.
- `docs/superpowers/plans/` — active implementation plans.
