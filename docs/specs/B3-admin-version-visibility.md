# B3 — Admin Version Visibility

## Status
Planned

## Motivation
Operators need a fast way to confirm which build is running in production or staging.
Today this requires logging into the host or registry. Showing the image tag (SHA)
inside the admin UI improves confidence during deploys and rollback verification.

---

## Goals
- Surface the running backend and frontend versions in the admin UI.
- Display the Docker image tag (SHA) and optionally the source commit SHA.
- Provide a backend endpoint so the frontend can fetch version metadata.
- Keep access admin-only.

## Non-Goals
- Public status/health endpoints for unauthenticated users.
- Build pipelines or tagging changes (handled in B2).
- Full release history UI (only current version).

---

## Requirements

### Version File
- `version.json` schema:
  - `imageTag` (string or null)
  - `commitSha` (string or null)
  - `dirty` (boolean or null)
  - `builtAt` (string or null, ISO)
- Backend reads `./version.json` relative to its working directory.
- Frontend exposes `/version.json` (built into the frontend output).
  - This file is public static content; exposing it is acceptable for ops visibility.

### Backend
- Add an admin-only endpoint: `GET /api/admin/version`.
- Response includes:
  - `backend`: `{ imageTag, commitSha, dirty, builtAt }`
  - `frontend`: `{ imageTag, commitSha, dirty, builtAt }`
  - `updatedAt` (ISO string, when server started or value loaded)
- Version discovery uses runtime data where possible:
  - Prefer baked `version.json` files inside both images (CI writes them at build time).
  - If a git repo is available at runtime (dev), read:
    - `commitSha` from `git rev-parse HEAD`
    - `dirty` from `git status --porcelain` (non-empty = `true`)
  - Optionally read `IMAGE_TAG` if it is present, but do not require it.
  - If data is unavailable, return `null` instead of erroring.
  - Backend reads its own `version.json` from its working directory.
  - Frontend version data is read from `/version.json` on `FRONTEND_ORIGIN`.
    - Use a short timeout and return `frontend: { ...null }` when unreachable.

### Frontend
- Admin UI displays the running versions in a compact panel on `/admin`.
- Show backend + frontend image tag (SHA), commit SHA, and dirty state (if present).
- Optionally show `builtAt` if provided.
- If missing, display `Unknown`.

---

## Acceptance Criteria
- Admin users can see backend and frontend `imageTag`, `commitSha`, and dirty state in the admin UI.
- Non-admin users cannot access the version endpoint (403/401).
- Endpoint returns `null` values when env vars are unset instead of erroring.
- Values are sourced from runtime detection and do not require DB access.
- Documentation notes the `version.json` approach and that `IMAGE_TAG` is optional.
- Documentation specifies the `version.json` path and schema.
- Documentation updates `docs/ops/environment-variables.md`.
- `builtAt` is surfaced per component when present; otherwise it is `null`.
