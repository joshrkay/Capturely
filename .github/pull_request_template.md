## Summary

- <!-- What does this PR do? -->
- <!-- Why is it needed? -->

## Type of change

- [ ] Bug fix
- [ ] New feature (Gate A / B / C / D / E / F / G / H / I)
- [ ] Refactor / DX
- [ ] Docs / tests only

## Checklist

### Code quality
- [ ] TypeScript strict — `npm run typecheck` passes (zero errors)
- [ ] Tests pass — `npm run test`
- [ ] No `any` types introduced
- [ ] No secrets committed (no `.env.local`, no API keys)

### Security & multi-tenancy
- [ ] Every Prisma query includes `accountId` in the WHERE clause
- [ ] New API routes call `withAccountContext()` and check RBAC
- [ ] Input validated with Zod on all new/changed API routes
- [ ] No new env vars exposed to client (`NEXT_PUBLIC_*` only where safe)

### AI features (Gate G / H — if applicable)
- [ ] All Claude calls are server-side only (no client key exposure)
- [ ] AI usage incremented in `AccountUsage.aiGenerationsCount`
- [ ] Plan limit checked before calling Claude (return 402/403 if exceeded)
- [ ] New prompts added to `src/lib/ai/prompts/` with version constant

### A/B testing / optimization (Gate D / H — if applicable)
- [ ] GrowthBook experiment created/updated when variants change
- [ ] Manifest republished after variant promotion
- [ ] Circuit breaker logic preserved in cron job

### Shopify (if applicable)
- [ ] Script tag injection tested against a dev store
- [ ] HMAC verification unchanged

### Database (if applicable)
- [ ] Migration files committed under `prisma/migrations/`
- [ ] `npm run db:migrate` runs cleanly
- [ ] No raw SQL unless unavoidable

## Test plan

<!-- What did you test manually? -->

- [ ] <!-- e.g. Created campaign → enabled A/B → confirmed GrowthBook experiment created -->
- [ ] <!-- e.g. Triggered cron → confirmed OptimizationRun created -->
- [ ] <!-- e.g. Connected Shopify store → confirmed script tag installed -->

## Screenshots / evidence

<!-- Add screenshots, curl output, or Playwright results here -->

## Risk & rollback

- **Risk:**
- **Rollback:**
