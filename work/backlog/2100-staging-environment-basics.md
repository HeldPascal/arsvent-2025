# 2100 — Staging Environment Basics

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

## Functional Requirements
- APP_ENV and IS_PRODUCTION flags
- Separate connection strings
- Per-environment secrets

## Acceptance Criteria
- [ ] Staging and production do not share state
- [ ] Migrations can run independently
- [ ] Environment flags are enforced in code
