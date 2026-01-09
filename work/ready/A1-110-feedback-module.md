# A1-110 — Anonymous Feedback Module

## Status
Ready

## Related Spec
- docs/specs/A1-feedback-and-prizes.md (A1.1)

## Goal
Allow users to submit anonymous, one-time feedback for an event.

## Scope
- User can submit feedback exactly once
- Feedback consists of:
  - emoji rating (5 options)
  - optional free-text (configurable)
- Feedback is anonymous and non-editable

## Out of Scope
- Editing or deleting feedback
- Per-user feedback moderation
- Public feedback display

## Functional Requirements
- Event-level settings:
  - `feedback.enabled`
  - `feedback.ends_at` (nullable)
  - `feedback.free_text_enabled`
  - `feedback.emoji_scale` fixed to 5
  - 5-point emoji set + labels (for a11y):
    - 😡 "Very dissatisfied"
    - 😕 "Dissatisfied"
    - 😐 "Neutral"
    - 🙂 "Satisfied"
    - 😍 "Very satisfied"
- API endpoints:
  - `POST /api/feedback` body `{ rating, comment? }`
    - `201` `{ ok: true }`
    - `400` invalid input
    - `403` feedback closed or already submitted
  - `GET /api/admin/feedback`
    - response `{ totals, count, comments? }`
      - `totals` keyed by rating `"1"`..`"5"`
      - `comments` items `{ text, createdAt }`
      - `comments` omitted when `feedback.free_text_enabled=false`
- Availability gating:
  - If `feedback.enabled=false`, block new submissions.
  - If `feedback.ends_at` is set and now > `feedback.ends_at`, block new submissions.
  - If `feedback.ends_at` is null, feedback remains open.
- Free-text gating:
  - If `feedback.free_text_enabled=false`, ignore `comment` and hide the UI field.
- Store feedback without user identifiers
- Feedback storage fields:
  - `id`
  - `rating` (int)
  - `comment` (text, nullable)
  - `created_at`
- Rating mapping:
  - `1=😡`, `2=😕`, `3=😐`, `4=🙂`, `5=😍`
- Free-text rules:
  - Trim whitespace
  - Max length: 1000 characters
  - Empty/whitespace-only stored as `null`
- Mark user as `has_submitted_feedback = true`
- Prevent second submission
- User entry point:
  - New "Prizes" page: show feedback module until submitted/skipped.
  - After feedback is submitted/skipped, show prize UI.
  - If user skips feedback, mark as submitted without creating a feedback record.
  - Skip submission responds `201 { ok: true, skipped: true }`.
  - Calendar page shows a banner linking to the Prizes page when prize info is available.
  - After submit/skip, show a toast: "Feedback submitted" or "Feedback skipped".
  - Prize UI behavior is covered in A1-140/A1-150/A1-160 (single Prizes page for messaging).

## Admin Requirements
- View aggregated emoji counts
- View total number of feedback submissions
- View free-text feedback list (if enabled)
- Per-entry timestamps are allowed
- No per-entry metadata that allows attribution
- Admin UI: add a Feedback panel on `/admin` (overview/diagnostics section)

## Acceptance Criteria
- [ ] User can submit feedback once
- [ ] User can skip feedback and is still marked as submitted without a record
- [ ] Second submission is blocked
- [ ] Admin UI shows aggregate counts and optional free-text list (if enabled)
- [ ] No user-identifying data exists in feedback storage

## Notes
Anonymity is prioritized over moderation or editability.
