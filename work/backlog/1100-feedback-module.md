# 1100 — Anonymous Feedback Module

## Status
Backlog

## Related Spec
- docs/specs/A1-feedback-and-prizes.md (A1.1)

## Goal
Allow users to submit anonymous, one-time feedback for an event.

## Scope
- User can submit feedback exactly once
- Feedback consists of:
  - emoji rating (4 or 5 options, configurable)
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
  - `feedback.emoji_scale` (4 or 5)
- Store feedback without user identifiers
- Mark user as `has_submitted_feedback = true`
- Prevent second submission

## Admin Requirements
- View aggregated emoji counts
- View total number of feedback submissions
- View free-text feedback list (if enabled)
- Per-entry timestamps are allowed
- No per-entry metadata that allows attribution

## Acceptance Criteria
- [ ] User can submit feedback once
- [ ] Second submission is blocked
- [ ] Admin UI shows only aggregated data
- [ ] No user-identifying data exists in feedback storage

## Notes
Anonymity is prioritized over moderation or editability.
