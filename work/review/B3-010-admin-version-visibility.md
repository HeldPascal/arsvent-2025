# B3-010 — Admin Version Visibility

## Status
Review

## Related Spec
- docs/specs/B3-admin-version-visibility.md (B3.1)

## Goal
Expose the running backend and frontend image tags (SHA) and commit SHAs in the admin UI.

## Scope
- Backend admin endpoint: `GET /api/admin/version`.
- Frontend admin UI panel showing backend + frontend version info.
- Prefer baked `version.json` files in both backend and frontend images.
- Compute commit SHA and dirty state at runtime when a git repo is present.
- `IMAGE_TAG` may be used if present but is optional.
- Update docs to mention `version.json` and optional `IMAGE_TAG`.
- Add generated `version.json` files to `.gitignore` (global ignore is acceptable).

## Implementation Notes
- Endpoint should be admin-only and return JSON `{ backend, frontend, updatedAt }` where each component includes `builtAt`.
- `backend` and `frontend` share `{ imageTag, commitSha, dirty, builtAt }` shape.
- `version.json` schema: `{ imageTag, commitSha, dirty, builtAt }`.
- Backend reads `./version.json` relative to its working directory.
- Frontend exposes `/version.json` from its built output.
- Backend fetches frontend version from `${FRONTEND_ORIGIN}/version.json` with a short timeout; failures yield null fields.
- Generate `version.json` during Docker builds (backend/ and frontend/ Dockerfiles).
- Prefer returning `null` for missing values and showing `Unknown` in UI.
- Add UI to the existing `/admin` overview/diagnostics section.

## Acceptance Criteria
- [ ] Admin users can view backend + frontend image tag, commit SHA, and dirty state in the admin UI.
- [ ] Endpoint returns `null` for unavailable values and does not error.
- [ ] Non-authenticated requests return 401; non-admin authenticated requests return 403.
- [ ] UI handles missing values gracefully.
- [ ] Docs updated for `version.json` and optional `IMAGE_TAG`.
