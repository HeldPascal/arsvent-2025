# 1400 — Prize Draw Lifecycle

## Status
Backlog

## Related Spec
- docs/specs/A1-feedback-and-prizes.md (A1.4)

## Goal
Allow admins to safely run and publish prize draws.

## Scope
- Draft draw
- Review & manual overrides
- Publish
- Post-publish overrides (backup prizes only)

## Functional Requirements
- Admin-triggered draw per pool
- Draft state:
  - assignments generated
  - not visible to users
- Publish state:
  - visible to users
  - draw cannot be re-run
- Overrides:
  - allowed in draft (any prize)
  - allowed after publish (backup prizes only)
  - override reason required

## Data Requirements
- Draw metadata:
  - pool
  - created_at
  - created_by
  - published_at
  - status
- Assignment history (append-only)

## Acceptance Criteria
- [ ] Draft draw can be created
- [ ] Draw can be published
- [ ] No redraw after publish
- [ ] Overrides are audited

## Notes
Deterministic behavior preferred; optional RNG seed.
