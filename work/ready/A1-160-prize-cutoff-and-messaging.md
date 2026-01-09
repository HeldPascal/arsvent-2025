# A1-160 — Prize Cutoff & User Messaging

## Status
Ready

## Related Spec
- docs/specs/A1-feedback-and-prizes.md (A1.6)

## Goal
Clearly communicate prize availability and eligibility to users.

## Scope
- Prize cutoff handling
- User-facing banners and status messages

## Functional Requirements
- Pool config:
  - `cutoff_at` per pool (nullable; stored in `data/prizes/prizes.yaml`)
    - `pools.MAIN.cutoff_at` and `pools.VETERAN.cutoff_at` (ISO timestamp)
- After cutoff:
  - users completing after the pool cutoff are not eligible for that pool
    - completion timestamp is `User.lastSolvedAt`
  - existing published draws are unaffected
- UI messages:
  - not eligible
  - prizes ended
  - draw not published yet
  - no prize won
  - Message conditions:
    - "Not eligible": fails eligibility checks (A1-130 or A1-150).
    - "Prizes ended": user completed after pool `cutoff_at`.
    - "Draw not published yet": no published draw for the pool (A1-140).
    - "No prize won": published draw exists, user eligible, but assignment is none.
  - Message precedence (highest first):
    - "Prizes ended"
    - "Not eligible"
    - "No prize won"
    - "Draw not published yet"
- UI placement:
  - Prizes page: show the most relevant message per pool above the draw section.
    - Use `/api/eligibility` (A1-130) + `/api/draws` (A1-140) to determine the message.
  - Calendar banner:
    - "Prizes available" if cutoff not passed and a draw is published
    - "Prizes ended" if cutoff passed

## Acceptance Criteria
- [ ] Users see clear prize availability state
- [ ] Late players are informed about no prizes
- [ ] Messaging matches eligibility state
- [ ] Cutoff is applied per pool using `MAIN.cutoff_at` / `VETERAN.cutoff_at`
- [ ] Message conditions map to the defined rules
- [ ] Prizes page and calendar banner show the correct message

## Notes
Critical for trust and user satisfaction.
