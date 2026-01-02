# B1-220 — Seed & Reset Tooling

## Status
Ready

## Related Spec
- docs/specs/B1-test-and-staging-environment.md

## Goal
Allow repeatable setup of staging data.

## Scope
- Seed script
- Reset script
- Environment guards

## Implementation Notes
- Scripts:
  - `backend/scripts/seed-staging.ts`
  - `backend/scripts/reset-staging.ts`
- Guard: refuse to run unless `APP_ENV=staging` and `IS_PRODUCTION=false`
- Prisma:
  - reset runs `prisma migrate deploy` before seeding
- Execution:
  - `cd backend && npm run seed:staging`
  - `cd backend && npm run reset:staging`

## Functional Requirements
- Seed:
  - users
  - Discord links
  - roles
  - events
  - content
  - completion states (including Veteran completion)
- Reset:
  - wipe DB
  - wipe Redis (staging only)
  - re-run migrations
  - re-seed
  - guarded against production

## Acceptance Criteria
- [ ] Seed script creates usable test data
- [ ] Reset script cannot run in production
- [ ] Seed/reset scripts are runnable via npm scripts and logged clearly
