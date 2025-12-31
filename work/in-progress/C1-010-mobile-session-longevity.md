# C1-010 — Mobile Session Longevity

## Status
In Progress

## Related Spec
- docs/specs/C1-mobile-session-and-ux-fixes.md (C1.1)

## Goal
Improve mobile session longevity without weakening security.

## Scope
- Investigate current session loss on mobile
- Implement a pragmatic fix
- Add user-facing messaging if session loss still occurs

## Functional Requirements
- Identify root causes (cookies, refresh, storage, or expiry)
- Preserve existing auth/session security guarantees
- Avoid regressions for desktop sessions

## Acceptance Criteria
- [ ] Mobile sessions last longer than current behavior
- [ ] Session loss scenarios are reduced or clearly messaged
- [ ] Desktop session behavior remains unchanged
