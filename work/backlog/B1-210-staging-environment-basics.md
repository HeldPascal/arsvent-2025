# B1-210 — Staging Environment Basics

## Status
Backlog

## Related Spec
- docs/specs/B1-test-and-staging-environment.md

## Goal
Introduce a fully isolated staging environment.

## Scope
- Separate DB and Redis
- Environment flags
- Independent migrations
- Separate domain and ports
- Staging uses a single compose file with project isolation (profiles optional)

## Functional Requirements
- APP_ENV and IS_PRODUCTION flags
- Separate connection strings
- Per-environment secrets
- Staging runs on the same VPS with distinct ports
- Staging uses its own domain and TLS

## Acceptance Criteria
- [ ] Staging and production do not share state
- [ ] Migrations can run independently
- [ ] Environment flags are enforced in code
- [ ] Staging traffic is isolated by domain and port
