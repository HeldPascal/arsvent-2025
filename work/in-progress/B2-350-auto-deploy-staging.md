# B2-350 — Auto-Deploy Staging on Main

## Status
In Progress

## Related Spec
- docs/specs/B1-test-and-staging-environment.md
- docs/specs/B2-low-downtime-deploys.md

## Goal
Deploy staging automatically after the CI build on `main` completes using CI-built images.

## Scope
- Update GitHub Actions to trigger on `workflow_run` for the build workflow on `main`
- Deploy to staging environment on VPS
- Always enable maintenance mode during deploy

## Implementation Notes
- Workflow: `.github/workflows/deploy.yml`
- Trigger: `on: workflow_run` for the build workflow on `main` (manual dispatch allowed)
- Deploy command targets staging explicitly (env or arg), e.g. `APP_ENV=staging`
- SSH user/host from repo secrets (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`)
- Log the SHA used for deployment in workflow output

## Functional Requirements
- Use immutable image tags from CI
- No manual trigger required for staging deploys (manual dispatch allowed)
- Deploy logs indicate the deployed SHA

## Acceptance Criteria
- [ ] Staging deploys automatically on `main` push
- [ ] Deployment uses SHA-tagged images
- [ ] Maintenance mode is enabled during deploy
