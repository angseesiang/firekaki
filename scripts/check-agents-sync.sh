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
