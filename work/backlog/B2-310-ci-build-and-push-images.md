# B2-310 — CI Build & Push Images

## Status
Backlog

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

## Acceptance Criteria
- [ ] CI produces two images (backend, frontend)
- [ ] Images are pushed with `:<git-sha>` tags
- [ ] Deploy scripts can reference the SHA tags
- [ ] No image builds are required on the VPS for deploy
