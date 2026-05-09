#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db push
sh scripts/sync-agents-doc.sh
