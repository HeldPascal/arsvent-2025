# C1-020 — Mobile Banner Does Not Block UI

## Status
Review

## Related Spec
- docs/specs/C1-mobile-session-and-ux-fixes.md (C1.2)

## Goal
Ensure the header banner does not consume excessive space on mobile and leaves
more room for page content.

## Scope
- Adjust header layout/behavior on small screens
- Allow the header to shrink or collapse
- Keep the header from overlapping or blocking content

## Functional Requirements
- Header must shrink or collapse on mobile viewports to free content space
- Header must not be a large sticky block on mobile
- Header must not overlap or block page content
- Behavior is consistent across common mobile browsers

## Acceptance Criteria
- [ ] Header occupies significantly less vertical space on mobile
- [ ] Content area is visibly larger on mobile without losing access to navigation

## Findings (Initial)
- The global header is the `topbar` in `frontend/src/views/Layout.tsx` and is `position: sticky`.
- Mobile styles (<=640px) stack the header, but do not reduce logo size or padding.
- Brand logo is 84px square and the header has 18px vertical padding plus a 72px min-height.

## Decision
- Make the header non-sticky on mobile viewports to free vertical space.

## Implementation Notes
- Remove mobile sticky behavior; header scrolls away with content on small screens.
