# B1-250 — Staging Login Lockdown & Configurable Seed Users

## Status
In Progress

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
- Seed user config is a JSON array of objects (extensible metadata).
  - Seed script receives the file path as an explicit argument.
  - Example:
    ```json
    [
      { "discordUserId": "123456789012345678", "label": "qa-user-1" },
      { "discordUserId": "234567890123456789", "label": "qa-user-2" }
    ]
    ```
  - Required field: `discordUserId` (string). Optional fields are ignored for now.
- Seed script inserts users into DB; auth checks DB for existing users only.
  - In staging, auth must not create new users.
  - Empty seed file is allowed; logins will be blocked (no users exist).
- Login attempts by non-seeded users should fail with a clear auth error.
  - Return 403 with `{ error: "staging_login_disabled" }`.

## Acceptance Criteria
- [ ] Staging blocks logins for users not present in the configured seed list.
- [ ] Seed user list is configurable via a JSON file passed to the seed script.
- [ ] Production behavior is unchanged.
- [ ] Error response for blocked staging logins is a 403 with a clear error code.
