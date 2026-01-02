# B1-230 — Staging Auth & Discord Setup

## Status
Ready

## Related Spec
- docs/specs/B1-test-and-staging-environment.md

## Goal
Isolate authentication and Discord integration for staging.

## Scope
- Separate Discord app
- Separate callback URLs
- Test Discord server
- Separate domain for staging

## Implementation Notes
- Staging uses a dedicated Discord application (not shared with prod).
- Backend env (`/opt/arsvent-2025/env/backend.staging.env`) includes:
  - `DISCORD_CLIENT_ID`
  - `DISCORD_CLIENT_SECRET`
  - `DISCORD_CALLBACK_URL=https://staging.arsvent25.arsnecandi.de/auth/discord/callback`
  - `FRONTEND_ORIGIN=https://staging.arsvent25.arsnecandi.de`
- Discord app settings:
  - OAuth2 Redirects: `https://staging.arsvent25.arsnecandi.de/auth/discord/callback`
  - Restrict login to a test Discord server (use a staging-only guild)

## Acceptance Criteria
- [ ] Staging auth uses different credentials
- [ ] Production credentials cannot be used accidentally
- [ ] Staging callback URLs are bound to the staging domain
- [ ] Staging env file contains the dedicated Discord credentials and callback URL
