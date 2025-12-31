# Arsvent Platform – Backlog Overview

This document captures all known ideas, problems, and potential features for the
Arsvent platform. It is intentionally non-prioritized and non-exhaustive.

Its purpose is long-term orientation and shared understanding.
Items listed here are not ready for implementation and must be promoted to a
spec before work begins.

---

## Platform & Architecture

- Event / Project System  
  Support multiple events running sequentially or in parallel, with isolated
  content and state but shared user and authentication infrastructure.

- Content / Core Split  
  Separate platform logic (auth, users, prizes, metrics) from event-specific
  content and rules.

- Mode Abstraction  
  Abstract difficulty and play modes (e.g. normal, veteran) as first-class
  concepts.

- Language Abstraction  
  First-class multilingual content support with configurable fallbacks.

- Plugin System  
  Extend the platform with new puzzle types, modes, or language packs without
  modifying core code.

- Stateless Services  
  Move towards stateless frontend and backend services to allow replication and
  horizontal scaling.

- Database Evolution  
  Potential migration from SQLite to PostgreSQL for improved robustness and
  concurrency.

<!-- - Quest System (Generalized Event Progression)

  Generalize the existing event structure into a quest-based model.
  In this model, an event (e.g. Arsvent) is represented as a questline,
  each day corresponds to a quest, and puzzles represent objectives
  within a quest.

  This generalization enables:
  - branching questlines and optional quests
  - conditional progression and mutually exclusive paths
  - narrative elements such as dialog systems with choices
  - rewards and state changes tied to quest completion
  - multiple possible end states (endings 1–N)
  - optional audio/voice acting for narrative elements

  The current Arsvent implementation is considered a linear,
  non-branching specialization of this model. -->

- Quest System (Narrative & Branching Gameplay)  
  A narrative-driven quest system inspired by RPG-style quests, enabling deep,
  branching storylines with player decisions and irreversible paths.

  Typical elements include:
  - dialog systems with branching choices and conditional responses
  - tasks/objectives that may be optional, parallel, or mutually exclusive
  - rewards and state changes based on player decisions
  - interactive elements beyond daily puzzles
  - support for multiple endings (end states 1–N)
  - optional or core audio/voice acting for dialogs

  Quests may span multiple days or events and are not required to be linear or
  time-locked. This system represents a separate gameplay layer alongside
  puzzle-based events.

- Microservice Architecture (Long-Term Consideration)  
  Explore a microservice split only if operational needs justify it (scaling,
  isolation, deployment velocity). Not a default direction; evaluated via ADRs.

- Server-Driven UI Updates  
  Prefer server-driven state propagation for interactive flows to reduce client polling
  and improve perceived performance (SSE as a pragmatic default).

---

## Development, Testing & Operations

- Test / Staging Environment  
  Dedicated non-production environment with isolated data, seed/reset tooling,
  and test-only admin helpers.

- Low-Downtime Deploys  
  Build artifacts in CI and deploy by pulling prebuilt images, minimizing
  production downtime.

- Automatic Tests  
  Unit, integration, and content-level tests.

- CI Checks  
  Type checks, linting, content validation, and optional screenshot diffs.

- Health & Readiness  
  Runtime health and readiness endpoints for monitoring and orchestration.

- Codebase Audit (Security & Best Practices)  
  Periodic review of the existing codebase and infrastructure for security issues and
  best practices (auth/session handling, dependency hygiene, secrets, logging, input
  validation, OWASP-style checks), resulting in actionable remediation tickets.

- Operational Security Review  
  Review deployment, environment separation, access control, and admin powers/trust
  boundaries as the platform evolves.

---

## Content & Authoring

- Content Edit UI  
  Browser-based editing interface for event content.

- Preview Mode  
  Preview content and puzzles before release without affecting production users.

- Content Linter  
  Validate content structure, assets, and constraints.

- Content Diff Viewer  
  Inspect changes between content versions in a git-style view.

- Asset Integrity Checker  
  Verify referenced images and assets exist and are accessible.

- Automated Screenshots  
  Generate preview images for puzzles and event days.

---

## Users, Profiles & Motivation

- Public Profile Page  
  User-facing summary (e.g. “Spotify Wrapped”-style recap of participation).

- Achievements  
  Badges and milestones such as veteran completion or streaks.

- Leaderboards  
  Privacy-aware, opt-in rankings.

- Daily Streak Rewards  
  Cosmetic rewards for consecutive participation.

- Cooperative Puzzles  
  Puzzles that require collaboration between users.

---

## Admin & Moderation

- Extended Roles  
  Support additional roles such as authors, moderators, and reviewers.

- User Management  
  Admin tools for inspecting and managing users.

- Error & Warning Logs  
  Recent backend errors and warnings visible in the admin UI.

- Metrics & Analytics  
  Structured events for usage, engagement, and difficulty insights.

- Batch Scheduling  
  Configure automatic unlock schedules for content and events.

---

## UX, Accessibility & Devices

- Mobile Experience  
  Address short sessions and mobile-first usage patterns.

- Device Support Policy  
  Define which devices and browsers are officially supported.

- Accessibility  
  Keyboard navigation, screen reader support, contrast modes, and reduced motion.

- Offline-Friendly Assets  
  Cache static assets to reduce load times on unstable connections.

- Session Expiry Handling  
  Clear warnings before sessions expire to avoid lost progress.

- Theming (First-Class Light/Dark Mode)  
  Support light/dark themes as a first-class feature with a user preference and a
  sensible default. Consider high-contrast as an extension.

---

## Community & Integrations

- Discord Integration  
  Roles, announcements, progress checks, and bot interactions.

- Twitch Integration  
  “Twitch plays Arsvent” style interactions and live events.

- Notifications  
  Discord or email notifications for key platform events.

---

## Meta & Branding

- Project Name  
  Potential rename from “Arsventskalender” to a more general platform name.

- Logo & Visual Identity  
  Consistent branding across app, repositories, bots, and streams.

- License  
  Explicit open-source license for the platform.

---

## Experimental / Fun Ideas

- Mascot (Scruut)  
  Use a mascot for playful UI feedback, maintenance notices, or developer tools.
