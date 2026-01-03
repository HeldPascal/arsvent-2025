# B1-240 — Admin Test Utilities

## Status
In Progress

## Related Spec
- docs/specs/B1-test-and-staging-environment.md

## Goal
Provide admin-only helpers for staging.

## Scope
- Unlock days
- Force completion
- Simulate eligibility
- Bypass time locks

## Constraints
- Only available when IS_PRODUCTION=false
- Hidden behind staging domain only

## Implementation Notes
- Backend-only admin endpoints under `/api/admin/test/` (staging only).
- Guard: reject unless `APP_ENV=staging` and `IS_PRODUCTION=false`.
- Require an admin role (existing auth) for all test utilities.
- UI link appears only when `APP_ENV=staging` and `IS_PRODUCTION=false`.

## Acceptance Criteria
- [ ] Utilities are hidden in production
- [ ] Utilities simplify E2E testing
- [ ] All endpoints are gated by env and admin role checks
