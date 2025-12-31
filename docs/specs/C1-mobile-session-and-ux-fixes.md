# C1 — Mobile Session & UX Fixes

## Status
Planned

## Motivation
Mobile users experience short sessions and UI friction that interrupts play.
These fixes prioritize reliability and clarity without changing core gameplay.

## Goals
- Reduce unexpected session loss on mobile.
- Prevent mobile banners from blocking interaction.
- Keep fixes minimal and targeted to current app behavior.

## Non-Goals
- Major auth/session refactors.
- New long-term infrastructure (e.g., Redis clusters).
- Broad UI redesigns.

---

# C1.1 — Mobile Session Longevity

## Problem
Mobile users lose sessions too quickly, causing re-auth and lost progress.

## Requirements
- Identify the primary session loss causes on mobile (cookie, refresh, storage).
- Implement a pragmatic fix that improves session longevity.
- Preserve existing auth and session security guarantees.

## Acceptance Criteria
- Mobile session duration is improved compared to current behavior.
- Session loss scenarios are reduced or clearly messaged.
- No regression in desktop session behavior.

---

# C1.2 — Mobile Banner Does Not Block UI

## Problem
The mobile devices banner obstructs interaction on small screens.

## Requirements
- Banner must not cover primary interactions on typical mobile viewports.
- Banner is dismissible or auto-collapses when it would obstruct UI.
- Behavior is consistent across common mobile browsers.

## Acceptance Criteria
- Banner never blocks taps for core actions on mobile.
- Banner can be dismissed and stays dismissed for the session.

