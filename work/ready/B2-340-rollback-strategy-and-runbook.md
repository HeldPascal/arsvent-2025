# B2-340 — Rollback Strategy & Runbook

## Status
Ready

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

## Implementation Notes
- Rollback script: `ops/rollback.sh` (invoked by `/opt/arsvent-2025/rollback.sh`)
- Release metadata directory: `/opt/arsvent-2025/releases/`
  - `releases.log`
  - `current_release`
  - `previous_release`
- `releases.log` format (one line):
  - `YYYY-MM-DDTHH:MM:SSZ env=<staging|production> sha=<git-sha> tags=<optional>`
- Default rollback target: `previous_release` unless a SHA arg is passed.
- Runbook location: `docs/ops/rollback.md`

## Acceptance Criteria
- [ ] Rollback can be executed in one command
- [ ] Rollback restores the previous SHA reliably (where DB allows it)
- [ ] Rollback can target a specific SHA from `releases.log`
- [ ] Runbook documents decision points and DB migration caveats
- [ ] Release pointers are updated on deploy and rollback
- [ ] `releases.log` records timestamp, environment, and SHA (plus optional tags)
