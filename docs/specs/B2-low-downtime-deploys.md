# B2 — Low-Downtime Deploys (Docker Compose)

## Status
Planned

## Motivation
Production deployments currently cause extended downtime because images are built during the maintenance window. We want deployments that:
- build images **before** switching production traffic,
- minimize downtime to a short window (target: < 10–30 seconds),
- provide a clear rollback path,
- remain compatible with a Docker Compose + VPS setup.

This spec focuses on deployment mechanics, not a full platform re-architecture.

---

## Goals
- Build and publish container images in CI (tagged by commit SHA).
- Deploy by pulling prebuilt images, applying migrations, and switching containers quickly.
- Short, predictable maintenance window.
- Safe rollback for non-destructive releases.

## Non-Goals
- Kubernetes / microservices migration.
- True zero-downtime for breaking DB migrations (may still require a window).
- Advanced traffic shifting (canary, gradual rollout).
- Multi-region deployment.

---

## High-Level Approach

### Build Phase (CI)
- CI builds images for backend and frontend.
- Images are pushed to a container registry (e.g., GHCR).
- Tags:
  - immutable: `:<git-sha>`
  - optional convenience: `:staging-latest`, `:prod-latest` (avoid using for deploy logic)

### Deploy Phase (VPS)
- VPS pulls images by immutable tag.
- Maintenance mode is enabled only for the switching window.
- DB migrations run before traffic resumes.
- Containers are restarted with the new images.
- Maintenance mode is disabled.

### Rollback
- If deploy fails before switching traffic, abort and keep running old containers.
- If deploy fails after switching, re-deploy last known good tag.
- DB rollback is not guaranteed; prefer forward-compatible migrations.

---

## Database Migration Strategy
- Migrations must be runnable as a dedicated step (`migrate` command).
- Prefer backward-compatible migrations:
  - additive changes first (new columns/tables),
  - deploy code that can read both old/new,
  - optional cleanup in a later deploy.
- If destructive migrations are unavoidable, accept downtime and document it.

---

## Maintenance Window
- Target downtime: < 10–30 seconds (depends on container restart time).
- Maintenance window includes only:
  - enabling maintenance page,
  - stopping/restarting containers,
  - any final health checks,
  - disabling maintenance page.
- Image builds must not happen during this window.

---

## Health Checks & Readiness
- Backend exposes:
  - `/healthz` (process up)
  - `/readyz` (DB reachable + migrations applied or compatible)
- Deploy script waits for readiness before disabling maintenance.
- If readiness fails, auto-rollback to previous tag.

---

## Environment Separation
- Staging uses the same deploy mechanism and scripts but different:
  - compose file or env file
  - registry tags/variables
  - secrets

---

## Acceptance Criteria
- Production deploy does not build images on the VPS.
- Downtime window is limited to container switch + readiness checks.
- Rollback to previous version is possible by tag.
- Deploy logs clearly show which commit SHA is running.
