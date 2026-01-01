# B2-340 — Rollback Strategy & Runbook

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
- Maintain `current_release` and `previous_release` pointers
- Define release logging format (`releases.log`)
- Support rollback to any release in `releases.log` (default: `previous_release`)

## Acceptance Criteria
- [ ] Rollback can be executed in one command
- [ ] Rollback restores the previous SHA reliably (where DB allows it)
- [ ] Rollback can target a specific SHA from `releases.log`
- [ ] Runbook documents decision points and DB migration caveats
- [ ] Release pointers are updated on deploy and rollback
- [ ] `releases.log` records timestamp, environment, and SHA (plus optional tags)
