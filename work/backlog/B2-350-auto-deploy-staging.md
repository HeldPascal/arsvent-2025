# B2-350 — Auto-Deploy Staging on Main

## Status
Backlog

## Related Spec
- docs/specs/B1-test-and-staging-environment.md
- docs/specs/B2-low-downtime-deploys.md

## Goal
Deploy staging automatically on `main` push using CI-built images.

## Scope
- Update GitHub Actions to trigger on `main` push
- Deploy to staging environment on VPS
- Always enable maintenance mode during deploy

## Functional Requirements
- Use immutable image tags from CI
- No manual trigger required for staging deploys
- Deploy logs indicate the deployed SHA

## Acceptance Criteria
- [ ] Staging deploys automatically on `main` push
- [ ] Deployment uses SHA-tagged images
- [ ] Maintenance mode is enabled during deploy

