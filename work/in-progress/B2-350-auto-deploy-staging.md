# B2-350 — Auto-Deploy Staging on Main

## Status
In Progress

## Related Spec
- docs/specs/B1-test-and-staging-environment.md
- docs/specs/B2-low-downtime-deploys.md

## Goal
Deploy staging automatically after the CI build on `main` completes using CI-built images.

## Scope
- Update GitHub Actions to run deploy as a dependent job in the build workflow
- Deploy to staging environment on VPS
- Always enable maintenance mode during deploy

## Implementation Notes
- Workflow: `.github/workflows/build-deploy.yml` (deploy job depends on build)
- Trigger: `on: push` for `main` (manual dispatch allowed with inputs)
- Deploy command targets staging explicitly (env or arg), e.g. `APP_ENV=staging`
- SSH user/host from repo secrets (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`)
- GitHub environment vars required: `DEPLOY_SCRIPT`, `DEPLOY_ENV_FILE`
- Manual dispatch inputs: `run_build`, `run_deploy`, optional `image_tag` for deploy-only runs
- Log the SHA used for deployment in workflow output

## Functional Requirements
- Use immutable image tags from CI
- No manual trigger required for staging deploys (manual dispatch allowed)
- Deploy logs indicate the deployed SHA

## Acceptance Criteria
- [ ] Staging deploys automatically on `main` push
- [ ] Deployment uses SHA-tagged images
- [ ] Maintenance mode is enabled during deploy
