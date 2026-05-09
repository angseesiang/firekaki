# Spec 1 — Docs & Conventions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish `AGENTS.md` as the master repo context document, auto-mirror it to `replit.md` via a pre-commit hook and post-merge script, and add `CONTRIBUTING.md` plus a PR template — without modifying any source code under `artifacts/` or `lib/`.

**Architecture:** `AGENTS.md` is the single source of truth. A `simple-git-hooks` pre-commit hook runs `scripts/check-agents-sync.sh`, which calls `scripts/sync-agents-doc.sh` to copy `AGENTS.md → replit.md` (with a banner) and re-stages `replit.md`. The same sync script is appended to `scripts/post-merge.sh` so it also runs after `git pull`. Replit Agent continues to read `replit.md` as before; contributors only ever edit `AGENTS.md`.

**Tech Stack:** pnpm 9 + workspaces, `simple-git-hooks ^2.11.1`, POSIX `sh`, plain markdown.

**Spec:** [`docs/superpowers/specs/2026-05-09-spec-1-docs-and-conventions-design.md`](../specs/2026-05-09-spec-1-docs-and-conventions-design.md)

---

## File structure

Files created or modified by this plan, in dependency order:

| Path | Action | Purpose |
|---|---|---|
| `AGENTS.md` | create | Master repo context document |
| `scripts/sync-agents-doc.sh` | create | Idempotent: AGENTS.md → replit.md (with banner) |
| `replit.md` | regenerate | Mirror of AGENTS.md (rewritten by sync script) |
| `scripts/check-agents-sync.sh` | create | Pre-commit hook: runs sync, re-stages replit.md |
| `scripts/post-merge.sh` | modify | Append call to sync-agents-doc.sh |
| `package.json` | modify (root) | Add simple-git-hooks dep, prepare script, config block |
| `pnpm-lock.yaml` | regenerate | Updated by `pnpm install` |
| `CONTRIBUTING.md` | create | Human-facing contributor process |
| `.github/pull_request_template.md` | create | Standardised PR description + checklist |

No files under `artifacts/`, `lib/`, or `lib/integrations/` are touched.

---

## Task 1: Create AGENTS.md (master)

**Files:**
- Create: `/Users/Vernes/firekaki/AGENTS.md`
- Reference: `/Users/Vernes/firekaki/replit.md` (existing 88-line source; will be regenerated in Task 3)

This task creates the new master document. The body is largely identical to current `replit.md` with seven targeted modifications: an audience banner, a new Conventions section, augmented Stack / Where things live / Architecture decisions / Gotchas, dropped User preferences placeholder, replaced Pointers section.

- [ ] **Step 1: Verify the source file**

Run:
```sh
wc -l /Users/Vernes/firekaki/replit.md && head -3 /Users/Vernes/firekaki/replit.md
```

Expected: 88 lines; first three lines start with `# Fire Kaki`, blank, then the subtitle paragraph.

- [ ] **Step 2: Copy replit.md as the AGENTS.md base**

Run:
```sh
cp /Users/Vernes/firekaki/replit.md /Users/Vernes/firekaki/AGENTS.md
```

- [ ] **Step 3: Add the audience banner above the H1**

Insert these two lines at the very top of `AGENTS.md` (above the existing `# Fire Kaki`):

```html
<!-- For AI assistants working in this repo. Read this for stack, layout, conventions, and architecture before editing or planning. -->

```

After this edit, `# Fire Kaki` is on line 3.

- [ ] **Step 4: Add a partial-strict TypeScript bullet to the Stack section**

In the Stack section, append one new bullet at the end of its bullet list (after `- Build: esbuild (CJS bundle)`):

```markdown
- TypeScript: `tsconfig.base.json` is **partial**-strict (`strictFunctionTypes: false`, `noImplicitOverride: false`); the other strict flags are on
```

- [ ] **Step 5: Insert a new Conventions section after Stack**

Insert a complete new H2 section between the existing `## Stack` section and the existing `## Where things live` section:

```markdown
## Conventions

- **pnpm only.** `npm install` aborts via the root `package.json` preinstall hook. Use `pnpm` for everything.
- **`catalog:` versioning** for shared deps. When adding a dep that already appears in `pnpm-workspace.yaml`'s `catalog:`, reference it as `"name": "catalog:"` rather than pinning a version.
- **24-hour `minimumReleaseAge`.** New dependency versions must be ≥ 24 hours old before pnpm will install them (`pnpm-workspace.yaml: minimumReleaseAge: 1440`). Supply-chain mitigation; `@replit/*` and `stripe-replit-sync` are excluded.
- **OpenAPI is the source of truth** for the API contract (`lib/api-spec/openapi.yaml`). After editing it, run `pnpm --filter @workspace/api-spec run codegen` to regenerate `@workspace/api-zod` + `@workspace/api-client-react`, then **restart the api-server workflow** so its esbuild bundle picks up the new schemas.
- **No hex color literals in `.tsx`.** Use design tokens from `artifacts/fire-kaki/src/index.css`. Forbidden patterns: `bg-[#…]`, `text-[#…]`, `border-[#…]`.
- **aria-labels on interactive elements.** Especially important for an emergency-response app.
- **Edit `AGENTS.md`, not `replit.md`.** `replit.md` is auto-mirrored from `AGENTS.md` by a pre-commit hook and `scripts/post-merge.sh`. Direct edits to `replit.md` are silently overwritten.
```

- [ ] **Step 6: Extend the "Where things live" section**

In the existing `## Where things live` bullet list, append four bullets at the end:

```markdown
- API contract source of truth: `lib/api-spec/openapi.yaml` — orval generates Zod and React Query hooks from it
- Generated Zod schemas (do not hand-edit): `lib/api-zod/src/generated/`
- Generated React Query hooks + custom-fetch (with bearer-to-cookie bridge): `lib/api-client-react/src/`
- Workspace scripts package (e.g. `seed-admin`): `scripts/`
```

- [ ] **Step 7: Add a bearer-to-cookie bullet to "Architecture decisions"**

In the existing `## Architecture decisions` bullet list, append one bullet at the end:

```markdown
- **Bearer-to-cookie bridge** for non-browser clients: `@workspace/api-client-react`'s custom-fetch translates an `Authorization: Bearer <token>` header into a cookie session header server-side. This lets the Expo mobile app authenticate without full cookie support; web clients keep using cookies directly.
```

- [ ] **Step 8: Delete the "User preferences" placeholder section**

Remove these three lines (and the surrounding blank lines so two `## ` headings don't end up with no spacing between them):

```markdown
## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._
```

After deletion, `## Emergency model` should be followed (after one blank line) directly by `## Maps`.

- [ ] **Step 9: Augment the Gotchas section with two new bullets**

In the existing `## Gotchas` bullet list, append two bullets at the end:

```markdown
- Resend uses Replit's `REPL_IDENTITY` connector token (`artifacts/api-server/src/lib/email.ts`). Email sending is not portable to non-Replit hosts without rewiring the integration.
- `lib/db` has no `migrations/` folder — schema changes are deployed via `drizzle-kit push`. **For additive changes to tables that were created manually (especially `session`), prefer raw SQL `ALTER TABLE`** because `push` will try to drop and recreate them.
```

- [ ] **Step 10: Replace the Pointers section**

Delete the existing `## Pointers` section in full (the heading and its single bullet about the `pnpm-workspace` skill) and replace it with:

```markdown
## Pointers

- `CONTRIBUTING.md` — human-facing contributor process (prereqs, branching, commits, PR flow).
- `docs/superpowers/specs/` — active design specs.
- `docs/superpowers/plans/` — active implementation plans.
```

- [ ] **Step 11: Verify AGENTS.md is well-formed**

Run:
```sh
head -3 /Users/Vernes/firekaki/AGENTS.md
echo "---"
grep -c '^## ' /Users/Vernes/firekaki/AGENTS.md
echo "---"
grep -c 'User preferences' /Users/Vernes/firekaki/AGENTS.md
echo "---"
grep -c '^## Conventions$' /Users/Vernes/firekaki/AGENTS.md
```

Expected:
- First line is `<!-- For AI assistants working in this repo. ... -->`.
- `## ` heading count: `10` (Run & Operate, Stack, Conventions, Where things live, Architecture decisions, Product, Emergency model, Maps, Gotchas, Pointers).
- `User preferences` count: `0`.
- `## Conventions` heading count: `1`.

- [ ] **Step 12: Do not commit yet**

The first commit (Task 3) lands `AGENTS.md`, the sync script, and the regenerated `replit.md` together so they form one coherent change.

---

## Task 2: Create the sync script

**Files:**
- Create: `/Users/Vernes/firekaki/scripts/sync-agents-doc.sh`

- [ ] **Step 1: Write the script**

Create `/Users/Vernes/firekaki/scripts/sync-agents-doc.sh` with this exact content:

```sh
#!/usr/bin/env sh
# Mirror AGENTS.md → replit.md. AGENTS.md is the master.
# Idempotent: rerunning produces the same output.
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

- [ ] **Step 2: Make the script executable**

Run:
```sh
chmod +x /Users/Vernes/firekaki/scripts/sync-agents-doc.sh
```

- [ ] **Step 3: Verify it's executable**

Run:
```sh
test -x /Users/Vernes/firekaki/scripts/sync-agents-doc.sh && echo OK
```

Expected: `OK`

- [ ] **Step 4: Do not commit yet** (combined commit at end of Task 3).

---

## Task 3: Regenerate replit.md and commit Tasks 1–3 together

**Files:**
- Modify: `/Users/Vernes/firekaki/replit.md` (regenerated)

- [ ] **Step 1: Run the sync script**

```sh
sh /Users/Vernes/firekaki/scripts/sync-agents-doc.sh
```

Expected: succeeds silently. `replit.md` is now AGENTS.md with the 4-line banner prepended (3 banner lines + 1 blank).

- [ ] **Step 2: Verify the banner**

```sh
head -4 /Users/Vernes/firekaki/replit.md
```

Expected:
```
<!-- AUTO-GENERATED FROM AGENTS.md — DO NOT EDIT THIS FILE DIRECTLY.
     The pre-commit hook and scripts/post-merge.sh keep this file in sync
     with AGENTS.md. To change content, edit AGENTS.md. -->

```

- [ ] **Step 3: Verify the body matches AGENTS.md byte-for-byte after the banner**

```sh
tail -n +5 /Users/Vernes/firekaki/replit.md | diff - /Users/Vernes/firekaki/AGENTS.md
```

Expected: no output (silent diff means identical).

- [ ] **Step 4: Stage all three files**

```sh
cd /Users/Vernes/firekaki && git add AGENTS.md scripts/sync-agents-doc.sh replit.md
```

- [ ] **Step 5: Verify what's staged**

```sh
git -C /Users/Vernes/firekaki status --short
```

Expected output (order may vary):
```
A  AGENTS.md
M  replit.md
A  scripts/sync-agents-doc.sh
```

- [ ] **Step 6: Commit**

```sh
cd /Users/Vernes/firekaki && git commit -m "$(cat <<'EOF'
Add AGENTS.md as master repo context document

AGENTS.md becomes the single source of truth for repo context:
stack, layout, conventions, architecture, product, gotchas. replit.md
is now an auto-generated mirror, banner-marked do-not-edit. The new
sync script (scripts/sync-agents-doc.sh) regenerates replit.md from
AGENTS.md and is wired into the pre-commit hook and post-merge in
follow-up tasks.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 7: Verify the commit landed**

```sh
git -C /Users/Vernes/firekaki log -1 --stat
```

Expected: 3 files changed (`AGENTS.md`, `replit.md`, `scripts/sync-agents-doc.sh`).

---

## Task 4: Add the pre-commit auto-fix script

**Files:**
- Create: `/Users/Vernes/firekaki/scripts/check-agents-sync.sh`

- [ ] **Step 1: Write the script**

Create `/Users/Vernes/firekaki/scripts/check-agents-sync.sh` with this exact content:

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

- [ ] **Step 2: Make it executable**

```sh
chmod +x /Users/Vernes/firekaki/scripts/check-agents-sync.sh
```

- [ ] **Step 3: Verify it runs cleanly against current state**

```sh
sh /Users/Vernes/firekaki/scripts/check-agents-sync.sh && echo OK
```

Expected: `OK`. Files are already in sync from Task 3, so the script is a no-op other than the sync write (which produces an identical file).

- [ ] **Step 4: Verify replit.md is unchanged in git**

```sh
git -C /Users/Vernes/firekaki diff --quiet -- replit.md && echo CLEAN
```

Expected: `CLEAN`.

- [ ] **Step 5: Stage and commit**

```sh
cd /Users/Vernes/firekaki && git add scripts/check-agents-sync.sh && git commit -m "$(cat <<'EOF'
Add pre-commit auto-fix script for AGENTS.md/replit.md sync

scripts/check-agents-sync.sh runs the sync and re-stages replit.md
if it diverged. Wired into git via simple-git-hooks in a follow-up
task; the hook auto-fixes rather than failing so contributors don't
have to remember to mirror.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Append the sync call to scripts/post-merge.sh

**Files:**
- Modify: `/Users/Vernes/firekaki/scripts/post-merge.sh`

- [ ] **Step 1: Confirm current contents**

```sh
cat /Users/Vernes/firekaki/scripts/post-merge.sh
```

Expected (4 lines + trailing newline):
```sh
#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push
```

- [ ] **Step 2: Append the sync call**

Append one new line so the final file is:

```sh
#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push
sh scripts/sync-agents-doc.sh
```

- [ ] **Step 3: Verify**

```sh
tail -1 /Users/Vernes/firekaki/scripts/post-merge.sh
```

Expected: `sh scripts/sync-agents-doc.sh`

- [ ] **Step 4: Stage and commit**

```sh
cd /Users/Vernes/firekaki && git add scripts/post-merge.sh && git commit -m "$(cat <<'EOF'
Run AGENTS.md→replit.md sync after every merge

.replit's [postMerge] config invokes scripts/post-merge.sh on every
pull. Appending the sync call ensures replit.md stays current after
pulls without requiring contributor action.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Wire simple-git-hooks (deps + prepare + config + install)

**Files:**
- Modify: `/Users/Vernes/firekaki/package.json`
- Regenerate: `/Users/Vernes/firekaki/pnpm-lock.yaml`
- Created (by `pnpm install` postinstall): `/Users/Vernes/firekaki/.git/hooks/pre-commit`

- [ ] **Step 1: Read current package.json**

```sh
cat /Users/Vernes/firekaki/package.json
```

Current shape:
```json
{
  "name": "workspace",
  "version": "0.0.0",
  "license": "MIT",
  "scripts": {
    "preinstall": "sh -c '...'",
    "build": "pnpm run typecheck && pnpm -r --if-present run build",
    "typecheck:libs": "tsc --build",
    "typecheck": "..."
  },
  "private": true,
  "devDependencies": {
    "typescript": "~5.9.2",
    "prettier": "^3.8.1"
  }
}
```

- [ ] **Step 2: Add the `prepare` script**

Add a `prepare` entry as the last script in the `scripts` object:

```json
"prepare": "simple-git-hooks"
```

- [ ] **Step 3: Add `simple-git-hooks` to devDependencies**

Add to the `devDependencies` object:

```json
"simple-git-hooks": "^2.11.1"
```

(Version 2.11.1 was published mid-2024 — well over 24 hours old, satisfies `minimumReleaseAge: 1440`.)

- [ ] **Step 4: Add the `simple-git-hooks` config block**

Add a new top-level key (after `devDependencies`):

```json
"simple-git-hooks": {
  "pre-commit": "sh scripts/check-agents-sync.sh"
}
```

The final `package.json` should look like:

```json
{
  "name": "workspace",
  "version": "0.0.0",
  "license": "MIT",
  "scripts": {
    "preinstall": "sh -c 'rm -f package-lock.json yarn.lock; case \"$npm_config_user_agent\" in pnpm/*) ;; *) echo \"Use pnpm instead\" >&2; exit 1 ;; esac'",
    "build": "pnpm run typecheck && pnpm -r --if-present run build",
    "typecheck:libs": "tsc --build",
    "typecheck": "pnpm run typecheck:libs && pnpm -r --filter \"./artifacts/**\" --filter \"./scripts\" --if-present run typecheck",
    "prepare": "simple-git-hooks"
  },
  "private": true,
  "devDependencies": {
    "typescript": "~5.9.2",
    "prettier": "^3.8.1",
    "simple-git-hooks": "^2.11.1"
  },
  "simple-git-hooks": {
    "pre-commit": "sh scripts/check-agents-sync.sh"
  }
}
```

- [ ] **Step 5: Verify the package.json parses as JSON**

```sh
python3 -m json.tool /Users/Vernes/firekaki/package.json > /dev/null && echo OK
```

Expected: `OK`. If you don't have python3 available, use `node -e 'JSON.parse(require("fs").readFileSync("/Users/Vernes/firekaki/package.json"))' && echo OK` instead.

- [ ] **Step 6: Run `pnpm install` to fetch the dep, regenerate the lockfile, and trigger `prepare`**

```sh
cd /Users/Vernes/firekaki && pnpm install
```

Expected:
- `simple-git-hooks` resolves and installs.
- `pnpm-lock.yaml` updates.
- The `prepare` script runs `simple-git-hooks`, which writes `.git/hooks/pre-commit`.

If `minimumReleaseAge` blocks the install, pin to an older specific version: change `"^2.11.1"` to `"2.11.1"` (no caret).

- [ ] **Step 7: Verify the hook file exists and contains the right command**

```sh
cat /Users/Vernes/firekaki/.git/hooks/pre-commit
```

Expected: file exists, includes the line `sh scripts/check-agents-sync.sh` (possibly with surrounding boilerplate from simple-git-hooks).

- [ ] **Step 8: Verify the hook is executable**

```sh
test -x /Users/Vernes/firekaki/.git/hooks/pre-commit && echo OK
```

Expected: `OK`

- [ ] **Step 9: Stage and commit**

The hook will fire during this commit. AGENTS.md is unchanged from Task 3, so the sync produces a byte-identical replit.md and the hook is a no-op.

```sh
cd /Users/Vernes/firekaki && git add package.json pnpm-lock.yaml && git commit -m "$(cat <<'EOF'
Install simple-git-hooks for AGENTS.md/replit.md pre-commit sync

Adds the prepare script so 'pnpm install' wires the pre-commit hook
to scripts/check-agents-sync.sh on every clone — no separate setup
step for contributors. Spec 3 (CI) will add a server-side diff check
as belt-and-suspenders.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 10: Verify the commit**

```sh
git -C /Users/Vernes/firekaki log -1 --stat
```

Expected: 2 files changed (`package.json`, `pnpm-lock.yaml`). `replit.md` should NOT appear (it didn't change).

---

## Task 7: End-to-end validation of the hook

**Files:** none committed in this task. We deliberately make a throwaway commit and revert it. The behaviour-under-test is acceptance criterion 3: editing only AGENTS.md should result in replit.md being auto-staged.

> **Note:** This task uses `git reset --hard HEAD~1` to remove the validation commit. The data is recoverable via `git reflog` if anything goes wrong.

- [ ] **Step 1: Append a marker to AGENTS.md**

```sh
printf '\n<!-- hook-test -->\n' >> /Users/Vernes/firekaki/AGENTS.md
```

- [ ] **Step 2: Verify replit.md does NOT yet contain the marker**

```sh
grep -c hook-test /Users/Vernes/firekaki/replit.md
```

Expected: `0`

- [ ] **Step 3: Stage only AGENTS.md (deliberately not replit.md)**

```sh
cd /Users/Vernes/firekaki && git add AGENTS.md
```

- [ ] **Step 4: Verify only AGENTS.md is staged**

```sh
git -C /Users/Vernes/firekaki diff --cached --name-only
```

Expected: `AGENTS.md` (only).

- [ ] **Step 5: Commit — the hook should auto-stage replit.md**

```sh
cd /Users/Vernes/firekaki && git commit -m "Hook validation (will be reverted)"
```

Expected: commit succeeds. The pre-commit hook ran, sync regenerated replit.md, and `git add replit.md` was invoked, so the resulting commit contains both files.

- [ ] **Step 6: Verify both files are in the commit**

```sh
git -C /Users/Vernes/firekaki log -1 --name-only
```

Expected output includes both `AGENTS.md` and `replit.md`.

- [ ] **Step 7: Verify replit.md now has the marker**

```sh
grep -c hook-test /Users/Vernes/firekaki/replit.md
```

Expected: `1`

- [ ] **Step 8: Revert the validation commit**

```sh
cd /Users/Vernes/firekaki && git reset --hard HEAD~1
```

- [ ] **Step 9: Confirm reverted state**

```sh
grep -c hook-test /Users/Vernes/firekaki/AGENTS.md /Users/Vernes/firekaki/replit.md
```

Expected output (each file reports 0):
```
/Users/Vernes/firekaki/AGENTS.md:0
/Users/Vernes/firekaki/replit.md:0
```

(No commit lands from this task. It is a behavioural test of Tasks 1–6.)

---

## Task 8: Add CONTRIBUTING.md

**Files:**
- Create: `/Users/Vernes/firekaki/CONTRIBUTING.md`

- [ ] **Step 1: Write CONTRIBUTING.md**

Create `/Users/Vernes/firekaki/CONTRIBUTING.md` with this exact content:

```markdown
# Contributing to firekaki

Thanks for working on firekaki — Singapore's neighbour-powered first-response network. This document covers the human-facing contributor workflow. For architecture, layout, and conventions, read [`AGENTS.md`](./AGENTS.md) first; this file points at it rather than duplicating.

## Prerequisites

- **Node.js 24** (matches `.replit`'s `nodejs-24` module).
- **pnpm 9** — `npm install` aborts via the root `package.json` preinstall hook. Install pnpm with `corepack enable` or your package manager of choice.
- **PostgreSQL 16** — only required if you want to run the `api-server` artifact locally. Set `DATABASE_URL` to a reachable Postgres URI before booting it.

## First-time setup

```sh
git clone https://github.com/angseesiang/firekaki.git
cd firekaki
pnpm install
```

`pnpm install` does three things automatically:

1. The `preinstall` hook enforces pnpm.
2. Dependencies install (subject to the 24-hour `minimumReleaseAge` policy in `pnpm-workspace.yaml`).
3. The `prepare` script runs `simple-git-hooks`, registering the pre-commit hook that keeps `AGENTS.md` and `replit.md` in sync.

## Running things

See [`AGENTS.md` § Run & Operate](./AGENTS.md). Common commands:

- `pnpm --filter @workspace/api-server run dev` — run the API server.
- `pnpm --filter @workspace/fire-kaki run dev` — run the web SPA.
- `pnpm run typecheck` — typecheck everything.
- `pnpm run build` — typecheck + build all packages.

## Branches and commits

- **Branches:** free-form names. One branch per PR. Rebase or merge `main` before opening a PR.
- **Commit messages:** sentence-case imperative, no `feat:`/`fix:`/`chore:` prefixes (matching all existing history). Examples from current `git log`:
  - `Add live volunteer tracking and routing to the reviewer emergency dashboard`
  - `Filter volunteer history to show only accepted and arrived alerts`
  - `Fix map pin rendering error on the login page`

## When to update `AGENTS.md`

Edit `AGENTS.md` whenever you change anything that affects how a future contributor or AI agent navigates the repo:

- A new artifact, lib package, or workspace.
- An architecture decision (new auth pattern, new data model, etc.).
- A new gotcha (workflow that breaks unexpectedly, environment quirk).
- A new environment variable, command, or tooling convention.

**Edit `AGENTS.md` only.** `replit.md` is auto-mirrored on every commit by the pre-commit hook and on every pull by `scripts/post-merge.sh`. Direct edits to `replit.md` are silently overwritten.

## Code style

- **TypeScript strict** per `tsconfig.base.json` (with `strictFunctionTypes` and `noImplicitOverride` documented as off).
- **Design tokens only.** No hex literals in `.tsx` (`bg-[#…]`, `text-[#…]`, `border-[#…]`); use the tokens from `artifacts/fire-kaki/src/index.css`.
- **aria-labels** on all interactive elements. This is an emergency-response app; a11y is not optional.
- **Lucide-react** for icons.

## Testing

Test tooling lands in Spec 2 (see `docs/superpowers/specs/`). Until then there is no test runner; rely on `pnpm run typecheck` and `pnpm run build` plus manual verification.

## PR process

1. Push the branch.
2. Open a PR — GitHub will pre-fill the description from `.github/pull_request_template.md`.
3. Fill the summary, tick the type box, work through the checklist.
4. Wait for green CI (lands in Spec 3).
5. Merge to `main` — Replit auto-deploys to production via the connected GitHub deployment.

## Replit specifics

[`replit.md`](./replit.md) is an auto-generated mirror of `AGENTS.md`. Replit Agent reads that file by name. For Replit deployment, connector, and secrets specifics, see `.replit` and the Replit Deployments tab.
```

- [ ] **Step 2: Stage and commit**

The hook will fire — AGENTS.md is unchanged so the sync is a no-op.

```sh
cd /Users/Vernes/firekaki && git add CONTRIBUTING.md && git commit -m "$(cat <<'EOF'
Add CONTRIBUTING.md for human contributor workflow

Covers prerequisites, first-time setup, branching, commit style
(sentence-case imperative), when to update AGENTS.md, and the PR
process. Points at AGENTS.md for architecture rather than duplicating.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Verify**

```sh
git -C /Users/Vernes/firekaki log -1 --name-only
```

Expected: only `CONTRIBUTING.md` listed (replit.md should NOT appear).

---

## Task 9: Add the PR template

**Files:**
- Create: `/Users/Vernes/firekaki/.github/pull_request_template.md`

- [ ] **Step 1: Create the .github directory**

```sh
mkdir -p /Users/Vernes/firekaki/.github
```

- [ ] **Step 2: Write the PR template**

Create `/Users/Vernes/firekaki/.github/pull_request_template.md` with this exact content:

```markdown
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
- [ ] If `lib/api-spec/openapi.yaml` was edited: ran `pnpm --filter @workspace/api-spec run codegen` and restarted api-server
- [ ] If `lib/db/src/schema/` was edited: noted whether `db push` is safe or raw `ALTER TABLE` is required
```

- [ ] **Step 3: Stage and commit**

```sh
cd /Users/Vernes/firekaki && git add .github/pull_request_template.md && git commit -m "$(cat <<'EOF'
Add pull request template

Encodes existing-but-unwritten rules: no hex color literals,
aria-labels, codegen-after-openapi, secrets-after-env-changes,
AGENTS.md update on convention changes. Lint and test items added
in Spec 2/3 once the underlying tooling exists.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Verify**

```sh
ls /Users/Vernes/firekaki/.github/ && git -C /Users/Vernes/firekaki log --oneline -8
```

Expected: `pull_request_template.md` listed; commit log shows the spec-1 work.

---

## Task 10: Final integration check (no commits)

This task verifies all 8 acceptance criteria from the spec and confirms no source files were modified.

- [ ] **Step 1: AC1 — AGENTS.md exists and has the expected sections**

```sh
test -f /Users/Vernes/firekaki/AGENTS.md && grep -c '^## ' /Users/Vernes/firekaki/AGENTS.md
```

Expected: count is `10`.

- [ ] **Step 2: AC2 — replit.md has the banner and matches AGENTS.md**

```sh
head -3 /Users/Vernes/firekaki/replit.md
echo "---"
tail -n +5 /Users/Vernes/firekaki/replit.md | diff - /Users/Vernes/firekaki/AGENTS.md && echo MATCH
```

Expected: banner is present (3 lines starting `<!-- AUTO-GENERATED FROM AGENTS.md…`); diff prints `MATCH`.

- [ ] **Step 3: AC3 — already validated by Task 7**

No re-run needed; Task 7 succeeded if you got here.

- [ ] **Step 4: AC4 — post-merge.sh contains the sync call**

```sh
grep -c 'sync-agents-doc.sh' /Users/Vernes/firekaki/scripts/post-merge.sh
```

Expected: `1`

- [ ] **Step 5: AC5 — CONTRIBUTING.md references AGENTS.md and is concise**

```sh
grep -c 'AGENTS.md' /Users/Vernes/firekaki/CONTRIBUTING.md
echo "---"
wc -l /Users/Vernes/firekaki/CONTRIBUTING.md
```

Expected: ≥ 4 references; ≤ 80 lines.

- [ ] **Step 6: AC6 — PR template exists**

```sh
test -f /Users/Vernes/firekaki/.github/pull_request_template.md && echo OK
```

Expected: `OK`

- [ ] **Step 7: AC7 — pnpm install installed the hook**

```sh
grep -c 'check-agents-sync.sh' /Users/Vernes/firekaki/.git/hooks/pre-commit
```

Expected: `1`

- [ ] **Step 8: AC8 — no source files modified by this spec**

Find the SHA of the commit before Task 1 (the spec-doc commit `f1eeace` from the brainstorming step):

```sh
git -C /Users/Vernes/firekaki log f1eeace..HEAD --name-only --pretty=format: -- 'artifacts/**' 'lib/**' 'lib/integrations/**' | sort -u
```

Expected: empty output. (If `f1eeace` is no longer the boundary commit when this plan runs, substitute the actual pre-Task-1 SHA.)

- [ ] **Step 9: Final commit summary**

```sh
git -C /Users/Vernes/firekaki log f1eeace..HEAD --oneline
```

Expected: 6 commits — one each from Tasks 3, 4, 5, 6, 8, 9. Tasks 1, 2, 7, and 10 produce no commits (Task 1 + 2 fold into Task 3's commit; Task 7 makes a test commit then reverts; Task 10 is verification-only).

- [ ] **Step 10: Push to origin/main**

This is the last step and the deploy trigger. Confirm with the user before pushing if there's any doubt.

```sh
cd /Users/Vernes/firekaki && git push origin main
```

Expected: clean push. Replit auto-deploys via the GitHub integration. Replit Agent continues to read `replit.md` without disruption.
