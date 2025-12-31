# A1 — Feedback & Prize System

## Status
Planned

## Motivation
After the Arsvent event, users should return to the app to:
- submit **anonymous feedback** (non-attributable, no edits),
- see whether they **won a prize**,
- clearly understand eligibility and prize availability windows.

Admins should be able to:
- manage prize pools,
- run controlled draws (draft → publish),
- adjust assignments after publication using backup prizes.

## Goals
- Feedback is **anonymous** and **non-editable**.
- Prize draws are **admin-triggered**, **two-phase** (draft → publish), and **auditable**.
- Prize pools can be public, but **user winnings are private** (user + admins only).
- Eligibility is based on Discord roles (single Discord server for v1).
- Support a separate **Veteran** prize pool with its own draw.

## Non-Goals
- Public winner lists with user identities.
- Automatic draws (no cron-based drawing).
- Multi-Discord-server support in v1.
- Fraud-proofing against a fully compromised server + database (out of scope).

---

# A1.1 — Anonymous Feedback Module

## User Story
As a user, I want to submit feedback anonymously, so that nobody (including admins) can see which feedback belongs to me.

## Functional Requirements

### Feedback Submission
- A user can submit feedback **at most once**.
- Feedback consists of:
  - a rating using **4 or 5 emoji** (configurable per event),
  - optional free-text comment (configurable per event).
- Once submitted, feedback **cannot be edited or deleted** by the user.

### Feedback Availability
- Event setting: `feedback.enabled` (boolean)
- Optional end time: `feedback.ends_at` (nullable)
- If `feedback.ends_at` is set and the current time is after it, new feedback is disabled.
- If `feedback.ends_at` is null, feedback remains open indefinitely.

### Anonymity Requirements
- Feedback storage must contain **no user identifier** (no user_id, no discord_id, no session_id).
- The only user-linked state is a boolean:
  - `users.has_submitted_feedback = true`
- Admin UI must only expose:
  - aggregate rating counts,
  - list of free-text comments (timestamps allowed and considered non-attributable by policy).

### Admin View
- Aggregate counts per emoji.
- Total number of feedback submissions.
- Free-text list (if enabled).
- Per-entry timestamps may be displayed and are considered non-attributable by policy.

## Acceptance Criteria
- Users can submit feedback exactly once.
- Submitted feedback cannot be changed.
- Admins cannot attribute a specific vote/comment to a user through the UI.
- Feedback may remain open after the event depending on configuration.

## Open Questions
- 4 vs 5 emoji default for the next event.

---

# A1.2 — Prize Pool Management

## Admin Story
As an admin, I want to define prize pools and priorities so that the system assigns meaningful prizes first and only uses filler prizes if needed.

## Concepts

### Prize Pools
- `MAIN` — general eligible participants
- `VETERAN` — participants who completed the full calendar in Veteran difficulty

### Prize Types / Priority
- Each prize has a `priority` integer (lower = higher priority).
- Prizes may be marked as `is_filler`:
  - filler prizes are intended to be used only if participant count exceeds premium prizes.
- Prizes may define `backup_prizes`:
  - backup prizes are **not part of the draw**
  - they are used for manual overrides (especially after publish)

## Prize Definition (fields)
- `id`
- `pool` (`MAIN` | `VETERAN`)
- `name`
- `description`
- `image_url` (optional)
- `quantity` (default 1)
- `priority` (integer)
- `is_filler` (boolean)
- `backup_prizes` (list of prize references, optional)
- `admin_notes` (optional, admin-only)
- `is_active` (boolean)

## Public Visibility
- The complete prize pool (names, descriptions, images) may be publicly viewable.
- Prize-to-user assignments are **not public**.

## Acceptance Criteria
- Admins can create/edit prizes and assign them to a pool.
- Admins can order prizes via priority.
- Admins can mark filler prizes.
- Admins can attach backup prizes to a primary prize.

---

# A1.3 — Eligibility & Discord Roles (v1)

## Admin Story
As an admin, I want to define which Discord roles are eligible for prize draws.

## Rules (v1)
- Exactly one Discord server is linked to the event.
- Admin config contains one or more eligible role IDs for that server.
- A user is eligible if:
  - their account is linked to Discord, AND
  - they are a member of the configured server, AND
  - they have at least one eligible role.

Users not on the server or without the roles are **not eligible**.

## UI Requirements
- Users must see a clear status:
  - eligible / not eligible
  - if not eligible: why (not linked, not on server, missing role)

## Acceptance Criteria
- Eligibility can be configured via admin settings.
- System can compute eligibility for all users at draw time.
- User-facing UI communicates eligibility status clearly.

---

# A1.4 — Prize Draw: Draft → Publish → Post-Publish Overrides

## Admin Story
As an admin, I want to run a prize draw in draft mode, review it, publish it, and still be able to override individual prizes later using backup prizes.

## Draw Lifecycle

### Phase 1: Draft Draw (admin-triggered)
- Admin triggers a draw for a given pool (`MAIN` or `VETERAN`).
- System computes eligible participants at that time.
- System assigns prizes according to:
  - prize list sorted by `priority` (ascending),
  - each prize repeated by `quantity`,
  - assignments created for participants.
- If there are fewer prizes than eligible users:
  - remaining users get "no prize" (unless filler prizes exist)
- If there are more prizes than eligible users:
  - remaining prizes remain unassigned.

**Important:** In MAIN pool it is expected that prizes >= eligible users due to filler prizes.

### Phase 2: Review
- Admin can review draft assignments.
- Admin can override any assignment in draft:
  - swap to another prize (including backup prizes)
  - write an override reason

### Phase 3: Publish (immutable draw, but override allowed)
- Admin publishes the draw.
- After publish:
  - the draw cannot be re-run (no “re-draw”)
  - assignments are visible to users (their own only)
  - admins may still override **only** using backup prizes attached to the originally assigned prize (or a configured backup group)
  - override reason is required

### Determinism / Randomness
- The draw uses a server-side RNG.
- The draw record stores:
  - draw time
  - initiator admin
  - pool
  - eligibility snapshot metadata (counts)
  - status (draft/published)

(Optionally) store a `seed` so the draft can be reproduced in logs if needed.

## User Visibility
- Before publish: users see “draw not published yet”.
- After publish:
  - user sees their assigned prize, OR “no prize”
  - user sees a banner if prizes are no longer available for late players (see A1.6)

## Acceptance Criteria
- Admin can create a draft draw per pool.
- Admin can publish the draw.
- After publish, admin can override only via backup prizes.
- Draw cannot be re-run after publish.

---

# A1.5 — Veteran Draw

## Rules
- Separate pool `VETERAN`.
- Eligibility: user completed the entire calendar on Veteran difficulty and is in VETERAN mode at draw time (mode can be downgraded later).
- Prize count may be smaller than eligible users.

## Lifecycle
- Same as A1.4: draft → review → publish → post-publish overrides.

## Acceptance Criteria
- Veteran draw is separate from main draw.
- Eligible veteran users can see their veteran result after publish.

---

# A1.6 — Prize Availability Window & Messaging

## Motivation
The app can remain online and playable after the main event period, but prizes should not be awarded indefinitely.

## Requirements
- Event setting: `prizes.cutoff_at` (nullable datetime)
- If `cutoff_at` is set and current time is after it:
  - no new prize eligibility is granted for users who finish after cutoff
  - UI must clearly show: “No prizes are available anymore (finished after cutoff).”
- Users must also see eligibility messaging (A1.3).

## Acceptance Criteria
- Users who play after cutoff see a clear “no prizes” banner.
- The app can remain functional after cutoff without affecting existing published draws.

---

# Admin UI Checklist
- Prize management CRUD (pool, priority, filler, backups).
- Eligibility config (server + role IDs).
- Draw controls:
  - create draft draw
  - view assignments summary
  - publish draw
  - override assignment (draft: any; post-publish: backup-only)
- Feedback dashboard:
  - aggregates
  - free-text list (if enabled)

---

# Security & Trust Notes
- Feedback data must not include user identifiers.
- Draw publishing is a trust boundary: no re-draw after publish.
- Overrides after publish must be auditable (who, when, what, why).
