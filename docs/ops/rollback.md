# Rollback Runbook

This runbook documents how to roll back to a previous release on the VPS.
It assumes the deploy user owns the deployment directory and can run Docker
Compose commands.

## Prerequisites

- Docker login is configured for GHCR (so images can be pulled).
- `deploy.env` is configured and points to the same deployment as production or staging.
- The app has been deployed at least once (so `releases/current_release` exists).

## Quick Rollback (Default: previous release)

1) Copy the wrapper script:

```
cp /opt/arsvent-2025/<env>/app/ops/rollback.wrapper.example.sh /opt/arsvent-2025/<env>/rollback.sh
```

2) Run rollback (uses `previous_release` by default):

```
/opt/arsvent-2025/<env>/rollback.sh /opt/arsvent-2025/<env>/env/deploy.env
```

## Rollback to a Specific SHA

```
/opt/arsvent-2025/<env>/rollback.sh /opt/arsvent-2025/<env>/env/deploy.env <IMAGE_TAG_SHA>
```

To find a SHA, inspect `releases.log` in the release directory:

```
tail -n 20 /opt/arsvent-2025/<env>/releases/releases.log
```

## What Happens

- Maintenance mode is enabled.
- Images for the target tag are pulled.
- Containers are restarted.
- `/readyz` is polled until ready (or timeout).
- Release metadata is updated:
  - `current_release`
  - `previous_release`
  - `releases.log` (with `tags=rollback`)
- Maintenance is disabled on success.

If readiness fails, maintenance stays enabled and the script exits with a non-zero code.

## Caveats

- DB migrations are not rolled back automatically. If the release introduced
  incompatible migrations, rollback may fail or require manual intervention.
- Rollback may restart services with older code that expects older schema/data.

## Release Log Format

Each rollback appends a line like:

```
YYYY-MM-DDTHH:MM:SSZ env=<staging|production> sha=<git-sha> tags=rollback
```
