# C1-010 — Mobile Session Longevity

## Status
Review

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
- [ ] Mobile sessions last longer than current behavior (pending prod deploy validation)
- [ ] Session loss scenarios are reduced or clearly messaged (pending prod deploy validation)
- [ ] Desktop session behavior remains unchanged (pending prod deploy validation)

## Findings
- Session cookie is session-only (no `maxAge`/`expires`).
- iOS Safari drops the session when the app is closed and reopened.

## Plan
- Set a persistent `maxAge` for the session cookie.
- Enable `rolling` to refresh expiry on activity.
