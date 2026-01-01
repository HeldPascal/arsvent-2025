# B2-360 — Deployment Transition & Bootstrap

## Status
Backlog

## Related Spec
- docs/specs/B1-test-and-staging-environment.md
- docs/specs/B2-low-downtime-deploys.md
- docs/ops/README.md

## Goal
Transition the VPS to the new CI-driven deployment flow and make it bootstrapable
from a clean server state.

## Scope
- Staging domain + nginx server block + TLS
- Staging env/data directories
- Compose changes for staging
- Registry auth and image pulls
- Release logging + rollback tooling
- Health/live/ready endpoints integration
- GitHub Actions auto-deploy for staging
- Production promotion steps documented (manual deploy by SHA)

## Functional Requirements
- One-time bootstrap steps are documented and reproducible
- Deploy scripts support both staging and production by SHA tag
- Staging auto-deploys on `main` push
- Maintenance mode is always enabled during deploys
- Rollback uses `previous_release`
- Production promotion is a documented manual step using a SHA tag

## Acceptance Criteria
- [ ] A new VPS can be bootstrapped following documented steps
- [ ] Staging deploys automatically from `main`
- [ ] Production deploys are manual by SHA tag
- [ ] Releases are logged with `current_release`/`previous_release`
- [ ] Rollback succeeds using the last known good release
- [ ] Health/live/ready checks are used in deploy flow
