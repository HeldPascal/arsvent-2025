# 1200 — Prize Pool Management

## Status
Backlog

## Related Spec
- docs/specs/A1-feedback-and-prizes.md (A1.2)

## Goal
Allow admins to define, organize, and maintain prize pools.

## Scope
- Prize CRUD
- Pool assignment (MAIN / VETERAN)
- Priority ordering
- Filler prizes
- Backup prizes

## Functional Requirements
- Prize fields:
  - name, description, image (optional)
  - pool
  - quantity
  - priority (lower = higher priority)
  - is_filler
  - backup_prizes
  - admin_notes
- Prizes can be activated/deactivated
- Public read-only view of prize pools

## Admin UI
- List prizes per pool
- Reorder by priority
- Assign backup prizes
- Toggle filler flag

## Acceptance Criteria
- [ ] Admin can manage prizes end-to-end
- [ ] Priority affects draw order
- [ ] Backup prizes are not part of draw pool
- [ ] Prize pool can be publicly displayed

## Notes
Assume prize count >= eligible users for MAIN pool due to fillers.
