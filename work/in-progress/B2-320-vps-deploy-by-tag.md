# B2-320 — VPS Deploy by Immutable Tag

## Status
In Progress

## Related Spec
- docs/specs/B2-low-downtime-deploys.md

## Goal
Deploy by pulling prebuilt images on the VPS and switching containers quickly.

## Scope
- Update compose configuration to use image tags (no local build)
- Deploy script:
  - ensure maintenance is enabled
  - docker login to registry
  - pull images by SHA tag
  - run migrations
  - restart services
  - disable maintenance after readiness
- Record releases in `releases.log` and update `current_release` / `previous_release`

## Constraints
- Use immutable tags `:<git-sha>` for all prod deploys.
- Maintenance mode is always enabled during deploy.

## Implementation Notes
- Compose: images reference a single `IMAGE_TAG` env var for both backend and frontend.
- Deploy script: update `ops/deploy.sh` to accept a SHA (arg or env) and export `IMAGE_TAG`.
- VPS wrapper: `/opt/arsvent-2025/deploy.sh` continues toggling maintenance before/after.
- Release metadata written under `/opt/arsvent-2025/releases/`:
  - `releases.log`
  - `current_release`
  - `previous_release`

## Acceptance Criteria
- [ ] VPS can deploy a specified SHA without building images
- [ ] Maintenance window covers only restart + final checks
- [ ] Compose config supports selecting the target SHA via env var
- [ ] Releases are logged with tag and timestamp
