# Ops Plan

## Purpose
Provide a phased, actionable path to a DevOps-grade setup (CI/CD, multi-env,
observability, security hardening, cost control) for Arsvent now, with a clean
migration path to self-hosted Kubernetes and future guild-related services.

## Goals
- Reliable deployments with staging and production promotion gates.
- Clear environment boundaries (dev/staging/prod + preview).
- Measurable uptime and quick incident response.
- Security-first defaults with minimal operational friction.
- Cost-aware hosting and monitoring choices.
- Smooth transition from Docker Compose on a VPS to self-hosted Kubernetes.

## Non-Goals (for now)
- No large refactors of app internals.
- No immediate switch to Kubernetes.
- No full ticket/spec workflow until later.

## Environment Strategy
- dev: local development.
- staging: mirrors production, auto-deploys from main.
- prod: manual promotion by immutable image tag.
- preview: ephemeral per-PR, minimal data footprint and strict cleanup.

## Repository and Organization Structure (proposal)
To host additional guild services later, split responsibilities while keeping
shared infra and standards centralized.

### GitHub Organization
- ars-necandi (org)
  - arsvent-2025 (this repo)
  - guild-portal (future)
  - guild-tools (future)
  - guild-bot (future)
  - infra (shared infrastructure)
  - ops-handbook (shared ops standards and runbooks)

### infra repo (future)
- Terraform for VPS/DNS provisioning; Ansible for host config and deployments.
- Shared CI/CD templates (GitHub Actions reusable workflows).
- Common monitoring/logging stack definitions.
- Secrets management tooling (SOPS + age or Vault).

### ops-handbook repo (future)
- Incident response playbooks.
- Environment standards and release procedures.
- Security and compliance policies.

## Phased Roadmap

### Phase 0: Foundations
- Define environment matrix and data boundaries.
- Standardize config and secrets handling.
- Document deploy, rollback, backup, and restore procedures.
- Produce ADRs for key choices (CI/CD, secrets, hosting path).

### Phase 1: CI/CD Baseline (GitHub Actions)
- CI: lint/build/test and Docker image builds.
- CD: auto-deploy staging from main, manual prod promotion.
- Preview environments for PRs.

### Phase 2: VPS Hardening and Observability
- Harden VPS (SSH, firewall, fail2ban, unattended updates).
- Monitoring and alerting (uptime checks, metrics, logs).
- Backup and restore drills.
- Transition most infra/deploy shell scripts into Ansible playbooks/roles while
  keeping app-level scripts in-repo (Ansible can invoke them).

### Phase 3: Compose to Kubernetes Transition
- Refine container images and health probes.
- Define Helm chart structure and per-env values.
- Choose cluster baseline (k3s or talos).

### Phase 4: Security Enhancements
- Secrets management with Vault (keep SOPS + age as a fallback).
- Image and dependency scanning.
- Audit logging and access reviews.

### Phase 5: Cost and Reliability Controls
- Resource sizing and autoscaling later.
- Log retention rules and alerts.
- Basic budgets/alerts for infrastructure spend.

## Decisions (ADRs to create)
- CI/CD platform and release strategy.
- Secrets management: HashiCorp Vault (SOPS + age remains a fallback option).
- Infrastructure path: VPS now, k3s/talos later.
- Provisioning vs configuration: Terraform provisions, Ansible configures.
- Infra/deploy orchestration moves to Ansible; app scripts stay in-repo.
- Team password manager: Vaultwarden (self-hosted) pending validation.
- Observability stack choice.

## Identity and SSO Options (for third-party services)
Goal: one login (Discord) grants access to all services via a centralized IdP.

### IdP Choices
- Authentik: modern UI, OIDC/SAML, simple setup; strong for small ops teams.
- Keycloak: powerful, enterprise-grade; heavier to operate and tune.
- Authelia: lightweight and great for reverse-proxy SSO; fewer enterprise features.

### Trade-offs
- Operations: Keycloak is heaviest; Authentik is moderate; Authelia is lightest.
- Protocol coverage: Keycloak/Authentik handle OIDC/SAML broadly; Authelia is best for forward-auth patterns.
- App compatibility: services with native OIDC/SAML integrate cleanly; others require reverse-proxy auth.

### LDAP Consideration
- LDAP is optional; only needed when services lack OIDC/SAML and require LDAP.
- Keycloak offers stronger LDAP integration; Authentik can integrate, but LDAP
  typically adds operational overhead and complexity.

### LDAP Bridge Options and Trade-offs
- Authentik LDAP Outpost: provides an LDAP endpoint backed by Authentik users;
  simplest bridge when Authentik is the IdP, but adds another component to run.
- FreeIPA/OpenLDAP as source of truth: robust LDAP with native tooling; IdP
  reads from LDAP, but adds LDAP management complexity.
- Keycloak federation with LDAP: Keycloak can read from LDAP, but still does not
  expose LDAP to apps; LDAP server remains required.

## Vault Bootstrap Notes
- Vault has a bootstrap step: initialize once to generate a root token and
  recovery keys.
- Store recovery keys offline (password manager or hardware vault).
- Prefer auto-unseal when possible; otherwise manual unseal on VPS.
- Enable OIDC auth for daily access; avoid routine root token usage.
- Use AppRole/OIDC for CI/CD to fetch deployment secrets.

### IdP Migration Considerations
- Easier if Discord remains the source of identity and apps rely on standard
  OIDC/SAML claims.
- Harder with local users, custom claim mapping, or deep LDAP dependencies.
- Plan for a parallel run and cutover window if migration becomes necessary.

### Recommended Flow
- IdP authenticates via Discord (OIDC).
- IdP issues OIDC/SAML assertions to apps that support it.
- Reverse proxy enforces forward-auth for apps without native SSO.

## Additional Considerations
### Platform and Access
- Edge auth gateway: standardize on reverse-proxy forward-auth for non-SSO apps.
- Discord role mapping: map guild roles to IdP groups for consistent access control.
- Service catalog: simple portal listing services with status and entry links.
- Wildcard TLS + DNS automation: DNS-01 for easier subdomain onboarding.
- SSH via SSO: short-lived SSH certs (e.g., via Vault) instead of static keys.

### CI/CD and Repo Standards
- Reusable CI workflows: shared build/deploy logic across repos.
- Branch protections and required checks for main.
- Dependabot with auto-merge for patch updates.
- Release tags for immutable deployments and traceability.
- Repo standards: CODEOWNERS, PR templates, and contribution guidelines.
- Conventional commits or commit linting for clean release history.
- Pre-commit hooks: format/lint gates for consistent local workflows.

### Security and Supply Chain
- Secrets linting via pre-commit or CI checks.
- IaC and container security scans: Trivy, tfsec/Checkov, gitleaks.
- SBOM generation and image signing (Syft + cosign) for supply chain trust.

### Observability and Operations
- Central logging/metrics: decide between Grafana/Prometheus/Loki or a lighter stack.
- OpenTelemetry tracing (Tempo) alongside metrics/logs for deeper debugging.
- Standard health/readiness endpoints on all services.
- Incident log and post-mortem template under docs/ops/.
- Operational standards: define SLIs/SLOs, an on-call/alerting policy, and runbooks.
- Backup tiering: local fast backups + off-site object storage; practice restores.

### Automation
- n8n for lightweight automation and notifications between services.
- GitOps and progressive delivery for Kubernetes later (Argo CD + Argo Rollouts).

## Bootstrap Notes (End-to-End, Cost-First)
These notes outline a minimal-cost path that can scale to multiple repos/services.

### 1) Domain and DNS
- Establish a base domain and subdomain scheme (e.g., `staging`, `preview`, `vault`).
- Decide on DNS provider that supports API access for DNS-01 (wildcard TLS).
- Set up DNS records for initial services and reverse proxy.

### 2) VPS Baseline
- Harden SSH (keys only, disable password auth).
- Enable firewall (allow 22/80/443 only).
- Install Docker and Docker Compose plugin.
- Create dedicated app user and directories for data, backups, and env files.

### 3) Reverse Proxy and TLS
- Install Nginx/Traefik/Caddy on the host or as a container.
- Obtain TLS certificates (DNS-01 wildcard recommended).
- Configure per-service routing and headers for forward-auth.

### 4) CI/CD Bootstrap
- Create container registry (GitHub Packages or alternative).
- Configure GitHub Actions to build and push images on `main`.
- Add staging auto-deploy; keep prod manual promotion by tag.
- Record releases and keep rollback metadata.

### 5) Secrets and Passwords
- Stand up Vaultwarden for team passwords and shared operational credentials.
- Decide on Vault timeline; if used, bootstrap with offline recovery keys.
- Keep app env files on the server with strict permissions until Vault is ready.

### 6) Identity Provider
- Deploy IdP (Authentik/Keycloak) and integrate Discord as the upstream IdP.
- Configure OIDC/SAML clients for services that support it.
- Enable forward-auth at the reverse proxy for non-SSO apps.

### 7) Observability
- Add uptime checks (self-hosted or external).
- Collect basic host metrics and logs (lightweight stack first).
- Define alert channels and test a notification.

### 8) Backups and Restore
- Automate SQLite/DB backups on deploy and on schedule.
- Store off-site copies (object storage or another VPS).
- Run a restore drill and document the steps.

### 9) Multi-Repo Expansion
- Add new services behind the same reverse proxy and IdP.
- Reuse Ansible roles for bootstrap and deployment.
- Standardize CI/CD templates across repos.

## Deliverables (near-term)
- docs/ops/ops-plan.md (this document).
- docs/ops/environments.md (env matrix and data boundaries).
- docs/ops/security.md (baseline hardening and access policies).
- ADRs for initial decisions.

## Next Steps
- Confirm the org/repo structure direction.
- Choose initial observability stack and secrets tooling.
- Draft ADRs and environment matrix.
