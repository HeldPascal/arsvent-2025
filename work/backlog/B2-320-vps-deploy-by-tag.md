# B2-320 — VPS Deploy by Immutable Tag

## Status
Backlog

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

## Acceptance Criteria
- [ ] VPS can deploy a specified SHA without building images
- [ ] Maintenance window covers only restart + final checks
- [ ] Compose config supports selecting the target SHA via env var
- [ ] Releases are logged with tag and timestamp
