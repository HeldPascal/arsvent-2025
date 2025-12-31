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
  - enable maintenance (optional)
  - docker login to registry
  - pull images by SHA tag
  - run migrations
  - restart services
  - disable maintenance

## Constraints
- Use immutable tags `:<git-sha>` for all prod deploys.

## Acceptance Criteria
- [ ] VPS can deploy a specified SHA without building images
- [ ] Maintenance window covers only restart + final checks
- [ ] Compose config supports selecting the target SHA via env var
