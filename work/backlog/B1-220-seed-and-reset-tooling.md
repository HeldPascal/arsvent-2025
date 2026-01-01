# B1-220 — Seed & Reset Tooling

## Status
Backlog

## Related Spec
- docs/specs/B1-test-and-staging-environment.md

## Goal
Allow repeatable setup of staging data.

## Scope
- Seed script
- Reset script
- Environment guards

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
  - re-run migrations
  - re-seed
  - guarded against production

## Acceptance Criteria
- [ ] Seed script creates usable test data
- [ ] Reset script cannot run in production
