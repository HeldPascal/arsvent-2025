# A1-130 — Discord-Based Eligibility

## Status
Backlog

## Related Spec
- docs/specs/A1-feedback-and-prizes.md (A1.3)

## Goal
Determine prize eligibility using Discord roles.

## Scope
- Single Discord server (v1)
- One or more eligible roles
- Eligibility snapshot at draw time

## Functional Requirements
- Event config:
  - discord_server_id
  - eligible_role_ids[]
- User is eligible if:
  - Discord account linked
  - Member of server
  - Has at least one eligible role

## UI Requirements
- User-facing eligibility status:
  - eligible / not eligible
  - reason if not eligible

## Acceptance Criteria
- [ ] Eligibility can be configured by admin
- [ ] System computes eligibility correctly
- [ ] UI clearly communicates eligibility

## Notes
No live role sync required; snapshot is sufficient.
