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
- Frontend pages: `artifacts/fire-kaki/src/pages/{home,login,signup,dashboard}.tsx`
- Theme tokens: `artifacts/fire-kaki/src/index.css` (uses `--primary` for the ember red)

## Architecture decisions

- Each role gets its own isolated "vault" table — `admin_users`, `reviewer_users`, `volunteer_users`, `vulnerable_users` — so the same email can register independently as Volunteer and Vulnerable. Login requires a role to disambiguate.
- Sessions are stored in Postgres via `connect-pg-simple` (table `session`, auto-created on first run) so they survive restarts.
- Reviewer and Admin accounts are not self-registerable; they must be seeded by an Admin (out of scope for this slice).

## Product

- Public proposal site at `/` describing the Fire Kaki community safety network
- `/signup` — register as Volunteer and/or Vulnerable (creates a row in each chosen vault)
- `/login` — sign in with email + password + role
- `/dashboard` — post-login landing showing role, vault, and verification status

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
