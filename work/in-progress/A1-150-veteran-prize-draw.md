# A1-150 — Veteran Prize Draw

## Status
In Progress

## Related Spec
- docs/specs/A1-feedback-and-prizes.md (A1.5)

## Goal
Run a separate prize draw for Veteran-complete users.

## Scope
- Separate pool (VETERAN)
- Separate eligibility rules
- Independent draw lifecycle

## Functional Requirements
- Eligibility:
  - full calendar completed (`User.lastSolvedDay >= 24`, `MAX_DAY=24`)
  - `User.mode == VETERAN` at draw time
  - Downgrades before draw time are not tracked; users may lose Veteran eligibility.
- Draw lifecycle identical to MAIN pool
- Overrides and delivery tracking follow A1-140 rules.
- API:
  - Reuse A1-140 endpoints with `pool=VETERAN`.
  - Veteran results appear in `/api/draws` and `/api/draws/:id`.
- User UI:
  - Prizes page shows a separate Veteran section labeled "Veteran".
  - `/api/draws` is user-scoped (A1-140); only eligible draws are returned.
  - Visibility rules (from A1-140 user API behavior):
    - If no published Veteran draw: show "No draw published yet".
    - If published and draw is returned: show prize card or "No prize".
- Admin UI:
  - Draws list shows both pools with a "Veteran" label.
  - Create draw action allows selecting pool (MAIN/VETERAN).
  - Only one published draw per pool at a time.

## Acceptance Criteria
- [ ] Veteran eligibility is computed correctly
- [ ] Veteran draw is isolated from main draw
- [ ] Users can see their veteran result
- [ ] Only one published Veteran draw exists at a time

## Notes
Prize count may be smaller than eligible users.
Eligibility uses A1-150 rules; draw visibility and API behavior follow A1-140.
