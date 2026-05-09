---
title: "Spec 1 — Docs & Conventions"
date: 2026-05-09
status: design
parent_initiative: "Dev infrastructure modernization (sub-spec 1 of 3)"
---

# Spec 1 — Docs & Conventions

## Goal

Establish authoritative repo documentation and contributor conventions for firekaki. Replace the current single ambiguously-named `replit.md` with a standard `AGENTS.md` (the de-facto convention for AI-assistant context files), surface conventions that are currently implicit in `pnpm-workspace.yaml` and `tsconfig.base.json`, and add a slim human-facing `CONTRIBUTING.md` plus a PR template.

This is sub-spec 1 of a 3-part initiative imported from `ajentik/suss-aje`. Spec 2 covers quality gates (ESLint + a11y, Vitest); Spec 3 covers GitHub Actions CI. Each ships independently.

## Background

`replit.md` is an 88-line context document that — despite its name — covers repo-wide concerns: stack, architecture, product description, the five-vault auth model, the emergency model, gotchas. Almost nothing in it is Replit-specific. AI agents (Claude Code, Codex, Cursor, etc.) standardise on reading `AGENTS.md` for this kind of content.

A deep survey of the monorepo also surfaced several conventions that are not documented anywhere a contributor or agent would find them:

- pnpm is enforced via the `package.json` preinstall hook (`npm install` aborts).
- `pnpm-workspace.yaml: minimumReleaseAge: 1440` — new dependencies must be 24 hours old before installation can succeed (supply-chain mitigation).
- Several shared dependencies use `catalog:` versioning rather than pinned versions.
- `lib/db` uses `drizzle-kit push` only — there is no migrations folder. Additive schema changes against the existing `session` table must use raw SQL `ALTER TABLE` because `push` will try to drop it.
- `lib/api-spec/openapi.yaml` is the source of truth for the API contract; orval regenerates Zod schemas (`@workspace/api-zod`) and React Query hooks (`@workspace/api-client-react`). After edits, the api-server must be restarted because its esbuild bundle inlines the regenerated schemas.
- `tsconfig.base.json` is *partial*-strict: `strictFunctionTypes: false` and `noImplicitOverride: false`.
- `@workspace/api-client-react/custom-fetch.ts` implements a bearer-to-cookie bridge for non-browser (mobile) clients.
- Resend email integration uses Replit's `REPL_IDENTITY` connector token and is not portable to other hosts.

## Scope

**In scope:**

1. New file: `AGENTS.md` (master).
2. Modified file: `replit.md` (becomes a build-time mirror of `AGENTS.md`, retains a banner saying so; preserved because Replit Agent reads it).
3. New file: `scripts/sync-agents-doc.sh` (idempotent `cp AGENTS.md replit.md`).
4. New file: `scripts/check-agents-sync.sh` (pre-commit auto-fix; runs sync, re-stages `replit.md`).
5. Modified file: `scripts/post-merge.sh` (calls sync after pulls).
6. Modified file: `package.json` (adds `simple-git-hooks` devDependency + config).
7. New file: `CONTRIBUTING.md`.
8. New file: `.github/pull_request_template.md`.

**Out of scope (handled in later sub-specs):**

- ESLint / a11y rules (Spec 2).
- Vitest setup, smoke tests (Spec 2).
- GitHub Actions CI (Spec 3) — including a CI step that diffs `AGENTS.md` against `replit.md` as a belt-and-suspenders check on the local hook.
- Spec Kit (`.specify/`, `.opencode/command/speckit.*`) — explicitly rejected. The `superpowers` workflow already covers the spec → plan → implement loop.
- Any change to `replit.md` content beyond the auto-mirror banner; the substantive content lives in `AGENTS.md` from now on.
- Any change to existing source code (no `.tsx` / `.ts` edits).

## Decisions made (with rationale)

- **Rename approach: keep both files, mirror `replit.md` from `AGENTS.md`.** Replit Agent reads `replit.md` literally; renaming would break that integration. A symlink was considered but rejected because Replit's runtime symlink behaviour is uncertain. Auto-mirror via post-merge hook + pre-commit auto-fix is robust against drift.
- **Single source of truth = `AGENTS.md`.** All substantive content lives there. `replit.md` is generated, banner-marked "do not edit directly".
- **`simple-git-hooks` over `husky`.** Single hook, ~3 KB dep, no runtime cost. Activates via `pnpm install` postinstall; no separate setup step for contributors.
- **Auto-fix at pre-commit, not fail.** If a contributor edits `AGENTS.md` and forgets to mirror, the hook silently re-syncs and stages `replit.md` rather than blocking the commit. Lower friction.
- **Banner on `replit.md` is an HTML comment**, so it renders invisibly in markdown viewers but is obvious to anyone editing the raw file.
- **Drop the empty `User preferences` placeholder** that exists in current `replit.md`. Per-user preferences belong in conversational memory, not in a shared repo doc.
- **Banner audience: generic** ("For AI assistants working in this repo"). Listing specific tools (Claude Code, Replit Agent, Codex) would go stale.
- **No conventional-commits prefixes.** All 100+ existing commits use sentence-case imperative without prefixes (`Add live volunteer tracking…`, `Fix map pin rendering error…`). CONTRIBUTING.md codifies this rather than introducing a new style.
- **Branch naming: free-form.** No prefix enforcement. The repo is small enough that a convention here would be ceremony without value; revisit if multiple contributors collide.
- **PR template encodes existing-but-unwritten rules** (no hex color literals, aria-labels, codegen-after-openapi, secrets-after-env-changes) — these rules already hold in the codebase and the template makes them visible.
- **Lint + test items are deferred from the PR template.** They get added in Spec 2 / Spec 3 once the underlying tooling exists.

## Deliverables — detailed contents

### `AGENTS.md` (~150 lines)

Sourced primarily from `replit.md`. Section-by-section:

1. **Banner / audience** — HTML comment + first H1 line stating this is the agent context document for the repo.
2. **What firekaki is** — 2 sentences: community-driven first-response network for Singapore's vulnerable residents.
3. **Run & operate** — verbatim from `replit.md` 5–12.
4. **Stack** — verbatim from `replit.md` 14–21, plus a one-line note that `tsconfig.base.json` is partial-strict (with the two disabled flags listed).
5. **Where things live** — the file map from `replit.md` 23–33, extended with `lib/api-spec/`, `lib/api-zod/`, `lib/api-client-react/`, and `scripts/` (the workspace package containing `seed-admin.ts`).
6. **Architecture decisions** — verbatim from `replit.md` 35–43, with one new bullet for the bearer-to-cookie bridge in `@workspace/api-client-react/custom-fetch.ts`.
7. **Conventions** — *new section*. Bullets for: pnpm enforced via preinstall; `catalog:` versioning for shared deps; `minimumReleaseAge: 1440` (24 h) on new deps; OpenAPI-first contract → run codegen + restart api-server after edits to `lib/api-spec/openapi.yaml`; design tokens only in tsx (no `bg-[#…]` / `text-[#…]` / `border-[#…]`); aria-labels on interactive elements (matters for an emergency-response app).
8. **Product** — verbatim from `replit.md` 45–58.
9. **Emergency model** — verbatim from `replit.md` 60–67.
10. **Maps** — verbatim from `replit.md` 73–78.
11. **Gotchas** — `replit.md` 80–84, plus: Resend coupled to Replit `REPL_IDENTITY` connector (not portable); `db push` only / no migrations / use raw `ALTER TABLE` for additive changes against `session`.
12. **Pointers** — replace `replit.md`'s pointer-to-skill with → `CONTRIBUTING.md` (human process), → `docs/superpowers/specs/` (active design specs).

Drop entirely: the `User preferences` empty placeholder.

### `replit.md`

Becomes:

```md
<!-- AUTO-GENERATED FROM AGENTS.md — DO NOT EDIT THIS FILE DIRECTLY.
     The pre-commit hook and scripts/post-merge.sh keep this file in sync
     with AGENTS.md. To change content, edit AGENTS.md. -->

(... identical body to AGENTS.md ...)
```

Layout: a leading HTML-comment banner, a blank line, then the verbatim body of `AGENTS.md`. Acceptance criterion 2 enforces byte-for-byte equality of everything after the banner.

### `scripts/sync-agents-doc.sh`

```sh
#!/usr/bin/env sh
# Mirror AGENTS.md → replit.md. AGENTS.md is the master.
set -e
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
if [ ! -f AGENTS.md ]; then
  echo "AGENTS.md not found at repo root" >&2
  exit 1
fi
{
  printf '%s\n' '<!-- AUTO-GENERATED FROM AGENTS.md — DO NOT EDIT THIS FILE DIRECTLY.'
  printf '%s\n' '     The pre-commit hook and scripts/post-merge.sh keep this file in sync'
  printf '%s\n' '     with AGENTS.md. To change content, edit AGENTS.md. -->'
  printf '\n'
  cat AGENTS.md
} > replit.md.tmp
mv replit.md.tmp replit.md
```

### `scripts/check-agents-sync.sh`

```sh
#!/usr/bin/env sh
# Pre-commit hook: ensure replit.md is the current mirror of AGENTS.md.
# Auto-fixes by running the sync and re-staging replit.md.
set -e
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
sh scripts/sync-agents-doc.sh
if ! git diff --quiet -- replit.md; then
  git add replit.md
fi
```

### `scripts/post-merge.sh` (modified)

Existing content preserved; one line appended:

```sh
sh scripts/sync-agents-doc.sh
```

### `package.json` (root, modified)

Add devDependency: `"simple-git-hooks": "^2.11.1"` (or current version compatible with the Node 24 / pnpm 9 setup; resolved at implementation time).

Add config block:

```json
"simple-git-hooks": {
  "pre-commit": "sh scripts/check-agents-sync.sh"
}
```

Add `prepare` script: `"prepare": "simple-git-hooks"` so hooks install on every `pnpm install`.

### `CONTRIBUTING.md` (~60 lines)

Section outline:

1. **Prerequisites** — Node 24, pnpm 9, Postgres 16 (only required if running `api-server` locally).
2. **First-time setup** — clone; `pnpm install` (this also installs git hooks via `simple-git-hooks` postinstall and runs the pnpm-only preinstall guard); set `DATABASE_URL` (link to `.env.example` if it exists at the time, otherwise note the var name).
3. **Running things** — pointer to `AGENTS.md § Run & operate`. No duplication.
4. **Branches** — free-form names; one branch per PR; rebase or merge `main` before PR.
5. **Commits** — sentence-case imperative, no prefixes (matches all existing history). Examples drawn from current `git log`.
6. **When to update `AGENTS.md`** — anything that changes how a future contributor or AI agent navigates the repo: new artifact, new lib package, architecture decision, gotcha, environment variable, command. Edit `AGENTS.md` only — `replit.md` updates automatically on commit.
7. **Code style** — TypeScript strict (per `tsconfig.base.json`, with documented exceptions); design tokens only — no hex literals in tsx; aria-labels on interactive elements; lucide-react for icons.
8. **Testing** — placeholder: "see Spec 2."
9. **PR process** — branch → push → open PR → fill template → green CI (Spec 3) → merge → Replit auto-deploys to production.

### `.github/pull_request_template.md` (~25 lines)

```md
## Summary
<!-- What changed and why. Link the issue or design doc. -->

## Type
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Docs
- [ ] Infra / CI
- [ ] Chore

## Checklist
- [ ] `pnpm run typecheck` passes locally
- [ ] `pnpm run build` passes locally
- [ ] No hard-coded hex colors added (`bg-[#…]`, `text-[#…]`, `border-[#…]`)
- [ ] aria-labels on new interactive elements
- [ ] Replit Secrets updated if new env vars introduced
- [ ] `AGENTS.md` updated if conventions / architecture / commands changed
- [ ] If `lib/api-spec/openapi.yaml` was edited: ran codegen and restarted api-server
- [ ] If `lib/db/src/schema/` was edited: noted whether `db push` is safe or raw SQL is required
```

## Implementation notes (non-binding hints for the planning step)

- The implementation plan should sequence: (1) write `AGENTS.md`; (2) write the two scripts and modify `post-merge.sh`; (3) wire `simple-git-hooks` and the `prepare` script; (4) generate initial `replit.md` mirror; (5) write `CONTRIBUTING.md`; (6) write the PR template.
- Validate the pre-commit hook by deliberately editing only `AGENTS.md`, attempting a commit, and confirming `replit.md` is auto-staged with matching content.
- Validate `post-merge.sh` by simulating a pull that updates `AGENTS.md` and confirming `replit.md` updates without manual intervention.
- The first commit that lands `AGENTS.md` will also update `replit.md`. Both should appear in the same commit.

## Acceptance criteria

1. `AGENTS.md` exists at repo root, contains all sections listed under "Deliverables — detailed contents", and is the byte source for `replit.md`'s body.
2. `replit.md` exists, starts with the auto-generated banner HTML comment, and its body matches `AGENTS.md` byte-for-byte (after the banner).
3. Editing `AGENTS.md` and running `git commit` results in `replit.md` being auto-staged and committed in the same commit, without the contributor doing anything manual.
4. Pulling a remote change to `AGENTS.md` triggers `scripts/post-merge.sh` to update `replit.md` locally without manual intervention.
5. `CONTRIBUTING.md` exists and references `AGENTS.md` rather than duplicating its content.
6. `.github/pull_request_template.md` exists and is picked up by GitHub when a PR is opened.
7. `pnpm install` installs `simple-git-hooks` and registers the pre-commit hook on a fresh clone, with no extra step required.
8. No source files under `artifacts/` or `lib/` are modified by this spec.

## Risks & mitigations

- **Risk:** `simple-git-hooks` `prepare` script doesn't run in CI because hooks aren't relevant there. **Mitigation:** Spec 3 will add a CI step that diffs `AGENTS.md` against `replit.md` as a server-side check, independent of local hooks.
- **Risk:** A contributor edits `replit.md` directly, missing the banner. **Mitigation:** the pre-commit hook auto-overwrites it from `AGENTS.md`, so the wrong edit silently disappears. The banner makes the intent obvious; the auto-fix makes mistakes harmless.
- **Risk:** Replit's runtime treats `replit.md` specially in some way we don't know about (e.g., re-reads it on every deploy and misbehaves on the banner). **Mitigation:** the banner is an HTML comment, invisible to most parsers; if Replit Agent or any other consumer breaks, we revert and switch to a tag-based separator (`<!-- begin agents.md -->`).
- **Risk:** `pnpm install`'s `prepare` script doesn't fire in some environments (e.g., Replit's deploy environment with `CI=true`). **Mitigation:** acceptable — hooks are a developer-machine concern; CI will enforce server-side in Spec 3.

## Open questions

None at design time. All are deferred to Spec 2 / Spec 3.
