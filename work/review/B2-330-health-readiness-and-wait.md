# B2-330 — Health/Readiness Endpoints + Deploy Wait

## Status
Review

## Related Spec
- docs/specs/B2-low-downtime-deploys.md

## Goal
Ensure deploy only completes when the new version is actually ready.

## Scope
- Backend endpoints:
  - GET /healthz
  - GET /livez (process up + dependencies minimally reachable)
  - GET /readyz (DB reachable + app can serve traffic)
- Deploy script waits for readiness before disabling maintenance
- Timeouts and clear error output
- Scope addition: add Docker Compose healthcheck(s) using the new endpoints so container health is visible in `docker compose ps`.
- Deploy script rolls back to `current_release` when readiness fails.

## Implementation Notes
- Endpoints are unauthenticated and return JSON `{ status: "ok" }` or `{ status: "error", reason: "<msg>" }`.
- `/healthz` checks the process only (no external deps).
- `/livez` checks process + minimal deps (e.g., Redis reachable if required).
- `/readyz` checks DB connectivity and any required migrations.
- Deploy script polls `/readyz` with a timeout (e.g., 60s) before disabling maintenance.
- On timeout or non-200, deploy fails and triggers rollback logic.

## Acceptance Criteria
- [ ] /healthz returns success when process is up
- [ ] /livez returns success when the service can handle requests
- [ ] /readyz fails when DB is unreachable or app cannot serve
- [ ] Deploy waits for /readyz and aborts/rolls back on failure
