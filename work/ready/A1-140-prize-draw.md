# A1-140 — Prize Draw Lifecycle

## Status
Ready

## Related Spec
- docs/specs/A1-feedback-and-prizes.md (A1.4)

## Goal
Allow admins to safely run and publish prize draws.

## Scope
- Draft draw
- Review & manual overrides
- Publish
- Post-publish overrides (backup prizes only)

## Functional Requirements
- Admin-triggered draw per pool
- Draft state:
  - assignments generated
  - not visible to users
- Publish state:
  - visible to users
  - draw cannot be re-run
- Overrides:
  - allowed in draft (any prize)
  - allowed after publish (backup prizes only)
  - override reason required
- User assignments are private (only the user + admins can see them; aligns with A1.2).
- Draft can be re-run before publish (replaces draft assignments).
  - Re-run clears draft overrides and replaces assignments.
- Override rules:
  - Draft overrides: any `is_active=true` prize in the same pool.
  - Post-publish overrides: only backup prizes attached to the originally assigned prize.
  - Cannot override to the same prize.
  - Each override appends a `DrawOverride` record.
- Draw algorithm:
  - Build eligible user list from eligibility snapshot.
    - Admins and super admins are always excluded from eligibility.
  - Shuffle users deterministically (use `seed` if provided).
  - Build prize list:
    - include only `is_active=true` prizes in the selected pool
    - expand by `quantity` (null = unlimited; use only as needed)
    - sort by `priority` ascending (fillers at same priority use round-robin)
  - Assign prizes in order to shuffled users.
  - If prizes run out: remaining users get "no prize".
  - If prizes remain: keep unassigned.
- API endpoints:
  - `POST /api/admin/draws` body `{ pool }` where `pool` is `MAIN|VETERAN`
  - `GET /api/admin/draws/:id`
  - `POST /api/admin/draws/:id/publish`
  - `POST /api/admin/draws/:id/override` body `{ assignmentId, newPrizeId, reason }`
  - `GET /api/draws` (user view; published draws only)
    - response list of `{ id, pool }`
    - only includes draws where the user is eligible
  - `GET /api/draws/:id` (user view; published draws only)
    - response `{ id, pool, status, prize?, delivery? }`
      - `status` values: `published` | `delivered`
      - `prize` fields: `{ id, name, description, image }`
        - `image` is a resolved asset URL (e.g., `/asset/<token>.<ext>`)
      - `delivery` optional: `{ status, method? }`
        - `status` values: `pending` | `delivered`

## Admin UI
- Routes:
  - `/admin/draws` (list)
  - `/admin/draws/:id` (review)
- Draft review:
  - Show assignments and allow overrides with required reason.
  - Publish action with confirmation (no re-draw after publish).
  - Delivery tracking UI: mark assignment delivered and set `deliveryMethod`.

## User UI
- Lives on the Prizes page (see A1-110).
- States driven by `GET /api/draws`:
  - If empty: show "No draw published yet".
  - If present: show prize card(s) or "No prize."

## Data Requirements
- Draw metadata:
  - pool
  - created_at
  - created_by
  - published_at
  - status
  - eligibility snapshot counts (eligible/assigned) per A1-130
- Assignment history (append-only)
- Assignments are immutable; overrides are tracked only in `DrawOverride`.
  - Delivery status updates are allowed on assignments for fulfillment tracking.
  - Current prize is computed from the latest `DrawOverride` (fallback to original `DrawAssignment.prizeId`).
- Tables:
  - `Draw`:
    - Fields:
      - `id` (string)
      - `pool` (`MAIN` | `VETERAN`)
      - `status` (`draft` | `published` | `delivered`)
      - `createdAt`, `createdBy`, `publishedAt`, `publishedBy`
      - `seed` (optional)
      - `eligibleCount`, `assignedCount`
      - `eligibilitySnapshotId` (optional; links to the eligibility snapshot used for the draw)
    - `delivered` when all assigned prizes are marked delivered
  - `DrawAssignment`:
    - `id`, `drawId`, `userId`, `prizeId` (nullable)
    - `status` (assigned/none), `createdAt`
    - `deliveryStatus` (pending/delivered), `deliveredAt` (optional)
    - `deliveryMethod` (optional; e.g., "ingame mail", "crown store")
  - `DrawOverride` (append-only):
    - `id`, `drawAssignmentId`, `oldPrizeId`, `newPrizeId`
    - `reason`, `createdAt`, `createdBy`

## Acceptance Criteria
- [ ] Draft draw can be created
- [ ] Draw can be published
- [ ] No redraw after publish
- [ ] Overrides are audited
- [ ] User view reflects draft vs published state
- [ ] Admin review shows override history with reasons
- [ ] Draw stores eligibleCount and assignedCount from the snapshot
- [ ] Admin can mark deliveries and set delivery method
- [ ] Draw status becomes `delivered` when all assignments are delivered

## Notes
Deterministic behavior preferred; optional RNG seed.
