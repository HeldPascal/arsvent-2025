# 3400 — Rollback Strategy & Runbook

## Status
Backlog

## Related Spec
- docs/specs/B2-low-downtime-deploys.md

## Goal
Define and document a safe rollback process for bad deploys.

## Scope
- Persist last-known-good SHA on VPS (e.g., in a file)
- Provide rollback script:
  - pull last-known-good images
  - restart services
  - verify readiness
- Write a short runbook in docs

## Acceptance Criteria
- [ ] Rollback can be executed in one command
- [ ] Rollback restores the previous SHA reliably (where DB allows it)
- [ ] Runbook documents decision points and DB migration caveats
