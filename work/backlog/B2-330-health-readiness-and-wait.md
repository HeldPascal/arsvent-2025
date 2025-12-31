# B2-330 — Health/Readiness Endpoints + Deploy Wait

## Status
Backlog

## Related Spec
- docs/specs/B2-low-downtime-deploys.md

## Goal
Ensure deploy only completes when the new version is actually ready.

## Scope
- Backend endpoints:
  - GET /healthz
  - GET /readyz (DB reachable + app can serve traffic)
- Deploy script waits for readiness before disabling maintenance
- Timeouts and clear error output

## Acceptance Criteria
- [ ] /healthz returns success when process is up
- [ ] /readyz fails when DB is unreachable or app cannot serve
- [ ] Deploy waits for /readyz and aborts/rolls back on failure
