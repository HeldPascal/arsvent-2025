# A1-120 — Prize Pool Management

## Status
Ready

## Related Spec
- docs/specs/A1-feedback-and-prizes.md (A1.2)

## Goal
Allow admins to define, organize, and maintain prize pools.

## Scope
- Prize CRUD (YAML-backed)
- Pool assignment (MAIN / VETERAN)
- Priority ordering
- Filler prizes
- Backup prizes

## Functional Requirements
- YAML storage:
  - Source of truth is a YAML file (same pattern as item inventory).
  - Admin UI edits write back to YAML.
  - Admin can import/export the YAML to edit locally.
  - File path: `data/prizes/prizes.yaml` (relative to app root).
  - Uploaded prize images are stored under `data/assets/`.
  - Docker deployments mount `/app/data` so `data/*` persists across restarts and is included in backups.
  - YAML structure includes pool metadata:
    - `pools.MAIN.cutoff_at` and `pools.VETERAN.cutoff_at` (ISO timestamp, nullable).
- Asset management:
  - Admin-only asset endpoints:
    - `GET /api/admin/assets` (list)
    - `POST /api/admin/assets` (upload, multipart)
    - `POST /api/admin/assets/bulk` (bulk upload)
    - `DELETE /api/admin/assets/:id`
  - Defaults: allow PNG/JPG/WebP, max 5 MB per file.
  - Assets are stored under `data/assets/` and referenced by relative path.
  - Asset metadata:
    - Each asset has `id`, `name`, `originalName`, `checksum`, `token`, `mime`, `size`, `createdAt`.
    - `name` is a display label; `originalName` is the immutable filename used for tokenization.
    - `name` is editable in the UI; `originalName` is not.
    - If source is PNG/JPG, auto-generate WebP variant; store `variants` list with file paths.
    - Renaming updates `name` only; file paths remain unchanged.
    - `references` list shows where the asset is used (e.g., prize IDs).
    - Asset `id` can be changed; when it is, update all references and warn with a list of affected items.
    - Asset `id` must remain unique; reject changes that conflict with an existing id.
  - Upload defaults:
    - Accept file-only uploads; default `name = originalName` and generate `id`.
    - Prompt the admin to adjust `id` and `name` after upload.
  - Protection rules:
    - Delete only when `references` is empty.
  - Tokenization:
    - Tokens are derived from original name + checksum.
  - Variants:
    - One token per variant, derived from the original file.
    - Store only tokenized filenames for original + variants.
    - Use `originalName` from the manifest when providing downloads.
  - Dedupe:
    - Changing original name or content yields a new token.
    - Original name is immutable.
    - Reject uploads only when both checksum and original name match an existing asset (token collision).
    - If checksum matches but name differs, show a warning with side-by-side comparison and allow proceed.
      - Comparison includes: name, size, mime, token, uploadedAt.
      - User must confirm to continue or cancel.
  - Manifest:
    - Store under `data/assets/` (e.g., `data/assets/manifest.json`).
    - Format is JSON (simple and fast to parse/write).
    - References are computed on demand from all sources (currently prizes).
  - SVG uploads are not allowed.
  - Storage:
    - Save original file as `<token>.<ext>`.
    - If `<ext>` is an image type and not WebP, also generate `<token>.webp`.
  - Asset serving:
    - Use `/asset/<token>.<ext>` for public asset URLs.
    - Proxy serves `data/assets/` directly when available.
    - If proxy is not configured, backend serves `/asset/*` as a fallback.
    - Update ops docs for proxy configuration and the fallback route.
    - Assets are publicly accessible (no auth).
- Prize fields (types):
  - id (string, explicit)
  - name (string), description (string), image (string, optional)
  - pool (`MAIN` | `VETERAN`)
  - quantity (int, optional; if null = unlimited)
  - priority (int, lower = higher priority)
  - is_filler (boolean)
  - is_active (boolean)
  - backup_prizes (list of prize IDs)
  - admin_notes (string, optional)
- Prizes can be activated/deactivated
- Public read-only view of prize pools
  - Public fields: name, description, image, pool, quantity, is_filler
  - Only `is_active=true` prizes are returned
  - Sorted by `priority` ascending
- Backup prize constraints:
  - Must reference existing prize IDs in the same pool
  - Self-references are not allowed
  - Duplicates are not allowed
  - Only `is_active=true` prizes are selectable
- Deletion rules:
  - `is_active` can be set to `false` only when the prize has no references and no assignments.
  - Delete is allowed only when `is_active=false`.
- API endpoints:
  - `GET /api/admin/prizes`
  - `POST /api/admin/prizes`
  - `PATCH /api/admin/prizes/:id`
  - `DELETE /api/admin/prizes/:id`
  - `GET /api/admin/prizes/export` (download YAML)
  - `POST /api/admin/prizes/import` (upload YAML)
  - `GET /api/prizes` (public read-only)

## Admin UI
- List prizes per pool
- Reorder by priority
- Assign backup prizes
- Toggle filler flag
- Import/export YAML actions
- Asset manager UI with upload, bulk upload, and delete
- Admin routes:
  - `/admin/prizes` for full management
  - Admin overview includes a prize stats section linking to `/admin/prizes`
- Pool metadata editing:
  - Admin can edit `cutoff_at` for MAIN and VETERAN pools.

## Priority Behavior
- Lower `priority` is drawn first.
- Filler prizes share the same `priority`; when multiple fillers are used, assign in round-robin order.

## Acceptance Criteria
- [ ] Admin can manage prizes end-to-end
- [ ] Priority affects draw order
- [ ] Backup prizes are not part of draw pool
- [ ] Prize pool can be publicly displayed
- [ ] Public endpoint returns only active prizes and hides admin-only fields
- [ ] Delete/disable rules are enforced
- [ ] Filler prizes use round-robin ordering when drawn
- [ ] Admin can import/export prize YAML
- [ ] Admin can upload/list/delete assets with the defined constraints

## Notes
Assume prize count >= eligible users for MAIN pool due to fillers.
Assignments are created by A1-140 and referenced here for delete constraints.
