# B2-310 — CI Build & Push Images

## Status
Ready

## Related Spec
- docs/specs/B2-low-downtime-deploys.md

## Goal
Build backend/frontend container images in CI and push them to a registry using immutable tags.

## Scope
- Build docker images for backend and frontend
- Push to registry (e.g., GHCR)
- Tag images by git SHA
- Optionally build `staging-latest` / `prod-latest` tags (non-authoritative)
- Store image tags for deploy scripts to consume

## Implementation Notes
- Registry: GHCR
  - `ghcr.io/<org-or-user>/arsvent-backend:<git-sha>`
  - `ghcr.io/<org-or-user>/arsvent-frontend:<git-sha>`
- CI workflow: `.github/workflows/build.yml`
- Build context:
  - `backend/Dockerfile`
  - `frontend/Dockerfile`
- Auth via `GITHUB_TOKEN` with `packages: write`
- Expose SHA for deploy:
  - write to build output as `ARTIFACTS_SHA=<git-sha>`

## Acceptance Criteria
- [ ] CI produces two images (backend, frontend)
- [ ] Images are pushed with `:<git-sha>` tags
- [ ] Deploy scripts can reference the SHA tags
- [ ] No image builds are required on the VPS for deploy
- [ ] Image names and registry are consistent across CI and deploy scripts
