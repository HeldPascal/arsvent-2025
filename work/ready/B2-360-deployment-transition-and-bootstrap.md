# B2-360 — Deployment Transition & Bootstrap

## Status
Ready

## Related Spec
- docs/specs/B1-test-and-staging-environment.md
- docs/specs/B2-low-downtime-deploys.md
- docs/ops/README.md

## Goal
Transition the VPS to the new CI-driven deployment flow and make it bootstrapable
from a clean server state.

## Scope
- VPS bootstrap work and documentation only (applies to staging and production):
  - staging + production domains, nginx server blocks, and TLS
  - env/data directories for both environments
  - registry auth setup for image pulls
  - maintenance mode paths and checks for both environments
  - release metadata directory creation
  - documented production promotion steps (manual deploy by SHA)

## Functional Requirements
- One-time bootstrap steps are documented and reproducible
- Maintenance mode is always enabled during deploys
- Production promotion is a documented manual step using a SHA tag

## Out of Scope
- CI build/push changes (B2-310)
- VPS deploy script changes (B2-320)
- Health/live/ready endpoint implementation (B2-330)
- Rollback tooling/runbook (B2-340)
- Staging auto-deploy workflow (B2-350)

## Implementation Notes
- Document location: `docs/ops/bootstrap-vps.md`
- Checklist includes:
  - create `/opt/arsvent-2025/env/` and `/opt/arsvent-2025/data/` dirs for staging + production
  - add nginx server blocks for `arsvent25.arsnecandi.de` and `staging.arsvent25.arsnecandi.de`
  - obtain TLS certs (certbot) for both domains
  - add `/opt/arsvent-2025/maintenance/` flag paths for staging + production
  - create `/opt/arsvent-2025/releases/` for release metadata
  - GHCR login instructions for VPS
  - manual production deploy by SHA steps

## Acceptance Criteria
- [ ] A new VPS can be bootstrapped following documented steps
- [ ] Production deploys are manual by SHA tag
- [ ] Bootstrap doc references exact paths and commands
