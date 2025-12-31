# C2-010 — Server-Driven Updates (Investigation)

## Status
Backlog

## Related Spec
- docs/specs/C2-server-driven-updates.md

## Goal
Identify and implement one high-impact server-driven update to replace polling.

## Scope
- Audit current polling flows
- Select 1–2 candidate flows
- Implement a minimal server-driven update (prefer SSE)
- Provide fallback to polling

## Functional Requirements
- Choose and document the target flow(s)
- Use SSE unless a clear blocker requires WebSockets
- Keep changes reversible and scoped

## Acceptance Criteria
- [ ] At least one polling flow uses server-driven updates
- [ ] Polling fallback works if updates fail
- [ ] Rationale documented in the ticket or spec

