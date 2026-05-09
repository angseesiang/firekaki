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
