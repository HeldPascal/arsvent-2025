# B1 — Test / Staging Environment

## Status
Planned

## Motivation
Development and validation currently happen too close to production.
Critical flows (auth, prizes, draws) must be testable end-to-end without
touching production data or causing downtime.

This spec defines a dedicated test/staging environment that mirrors
production behavior while remaining isolated.

---

## Goals
- Enable safe end-to-end testing of features (e.g. A1).
- Prevent any interaction with production data or users.
- Reduce deployment risk by validating changes before prod deploy.
- Improve developer confidence and iteration speed.

## Non-Goals
- Zero-downtime production deploys (handled separately).
- Load / stress testing.
- Kubernetes or orchestration changes.
- Feature flags or multi-tenant runtime routing.

---

## Environment Model

### Environments
The system supports at least the following environments:
- `production`
- `staging` (a.k.a. test)

Each environment has:
- its own database
- its own Redis instance
- its own OAuth / Discord configuration
- its own secrets

No environment may share stateful resources with another.

---

## Configuration

### Environment Flags
Each environment exposes:
- `APP_ENV=production|staging`
- `IS_PRODUCTION=true|false`

These flags control:
- logging verbosity
- admin-only test utilities
- safety checks (e.g. prize draws)

---

## Data Isolation

### Databases
- Staging uses a separate database instance/schema.
- Migrations must run independently per environment.

### Redis / Cache
- Separate Redis DB or instance per environment.
- No shared session or cache keys.

---

## Authentication & External Services

### Discord / OAuth
- Staging uses a **separate Discord application**.
- Callback URLs must be environment-specific.
- Test Discord server is used for staging.

---

## Seed & Reset Tooling

### Seed Script
Provide a script to populate staging with:
- test users
- linked Discord accounts
- roles
- events
- content
- completion states (including Veteran completion)

### Reset Script
Provide a script to:
- wipe staging data
- re-run migrations
- re-seed initial data

Scripts must be:
- explicit
- environment-guarded (cannot run against production)

---

## Admin-Only Test Utilities

Available only when `IS_PRODUCTION=false`:
- unlock arbitrary event days
- mark users as completed (normal / veteran)
- bypass time locks
- simulate eligibility states

These tools must never be enabled in production.

---

## Safety Guarantees

- Staging must never:
  - send real Discord messages
  - assign real prizes
  - write to production DBs
- Guardrails must exist to prevent misconfiguration.

---

## Acceptance Criteria
- A complete user flow (login → play → feedback → prize draw) can be tested in staging.
- No staging action can affect production data.
- Staging environment can be reset and re-seeded at will.
- Admin-only test tools are inaccessible in production.
