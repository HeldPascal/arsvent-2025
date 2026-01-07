# C2 — Server-Driven Updates (Near-Term Investigation)

## Status
Planned

## Motivation
Reduce excessive polling and improve responsiveness for key user flows,
while keeping changes small and reversible.

## Goals
- Identify one or two high-impact polling flows.
- Replace polling with server-driven updates where feasible.
- Keep scope limited to near-term wins.

## Non-Goals
- Full real-time architecture overhaul.
- Introducing new infrastructure without clear benefit.

## Scope
- Evaluate SSE as the default approach.
- WebSocket support is optional and only if SSE is insufficient.

## Requirements
- Define which endpoints/flows move off polling.
- Provide fallback to polling if server-driven updates fail.
- Ensure changes do not break existing clients.

## Acceptance Criteria
- At least one key polling flow uses server-driven updates.
- Client behavior remains stable when updates are unavailable.
- Document the chosen approach and rationale.

