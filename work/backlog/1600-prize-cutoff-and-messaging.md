# 1600 — Prize Cutoff & User Messaging

## Status
Backlog

## Related Spec
- docs/specs/A1-feedback-and-prizes.md (A1.6)

## Goal
Clearly communicate prize availability and eligibility to users.

## Scope
- Prize cutoff handling
- User-facing banners and status messages

## Functional Requirements
- Event config:
  - `prizes.cutoff_at` (nullable)
- After cutoff:
  - no new prize eligibility (completion timestamp after cutoff does not count)
  - existing published draws unaffected
- UI messages:
  - not eligible
  - prizes ended
  - draw not published yet
  - no prize won

## Acceptance Criteria
- [ ] Users see clear prize availability state
- [ ] Late players are informed about no prizes
- [ ] Messaging matches eligibility state

## Notes
Critical for trust and user satisfaction.
