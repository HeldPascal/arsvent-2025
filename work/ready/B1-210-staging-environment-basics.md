# B1-210 — Staging Environment Basics

## Status
Ready

## Related Spec
- docs/specs/B1-test-and-staging-environment.md

## Goal
Introduce a fully isolated staging environment.

## Scope
- Separate DB and Redis
- Environment flags
- Independent migrations
- Separate domain and ports
- Staging uses a single compose file with project isolation (profiles optional)

## Implementation Notes
- Domain: `staging.arsvent25.arsnecandi.de`
- Ports (host):
  - backend: `4100` -> container `4000`
  - frontend: `4273` -> container `80`
- VPS paths:
  - env: `/opt/arsvent-2025/env/backend.staging.env`, `/opt/arsvent-2025/env/frontend.staging.env`
  - data: `/opt/arsvent-2025/data/backend-staging`, `/opt/arsvent-2025/data/redis-staging`
- Env values:
  - `APP_ENV=staging`
  - `IS_PRODUCTION=false`
  - `DATABASE_URL="file:/app/data/staging.db"`
  - `REDIS_URL=redis://redis:6379`
- Compose isolation:
  - single `docker-compose.yml`
  - `COMPOSE_PROJECT_NAME=arsvent-2025-staging` (prod remains `arsvent-2025`)
  - staging runs its own Redis container (same compose file, isolated by project name)
- Nginx:
  - new server block for `staging.arsvent25.arsnecandi.de`
  - proxies to `127.0.0.1:4273` and `127.0.0.1:4100`
  - TLS via certbot
  - maintenance mode supported (separate flag file for staging)

## Functional Requirements
- APP_ENV and IS_PRODUCTION flags
- Separate connection strings
- Per-environment secrets
- Staging runs on the same VPS with distinct ports
- Staging uses its own domain and TLS

## Acceptance Criteria
- [ ] Staging and production do not share state
- [ ] Migrations can run independently
- [ ] Environment flags are enforced in code
- [ ] Staging traffic is isolated by domain and port
- [ ] Staging env files and data directories exist at the defined VPS paths
