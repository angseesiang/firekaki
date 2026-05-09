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
