# B1-250 — Staging Login Lockdown & Configurable Seed Users

## Status
Backlog

## Related Spec
- docs/specs/B1-test-and-staging-environment.md (B1)

## Goal
Restrict staging logins to seeded users only and make seed users configurable.

## Scope
- Prevent new user signups in staging (only seeded users may authenticate).
- Seed script reads user list from configuration (not hardcoded).
- Guardrails to ensure production is unaffected.

## Implementation Notes
- Use `APP_ENV`/`IS_PRODUCTION` guards to limit lockdown to staging.
- Seed user config should be explicit and auditable (file or env-driven list).
- Login attempts by non-seeded users should fail with a clear auth error.

## Acceptance Criteria
- [ ] Staging blocks logins for users not present in the configured seed list.
- [ ] Seed user list is configurable and not hardcoded.
- [ ] Production behavior is unchanged.
- [ ] Error response for blocked staging logins is clear and consistent with auth patterns.
