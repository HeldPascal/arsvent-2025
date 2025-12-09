Ideas and improvements to tackle

- Admin puzzle debug view  
  Provide an admin debug mode for any day that shows raw block data, validation details (solutions, min selections, socket shapes), and a way to simulate submissions. Goal: let admins verify puzzles before releasing or unlocking them.

- Test environment  
  Stand up a dedicated test setup (DB seeding, env flags) so flows can be validated without touching production data. Include a script to reset/seed test content and accounts.

- Developer ergonomics  
  Improve local dev with hot-reload scripts for both backend and frontend, clearer README setup steps, and sample `.env.example` files for quick starts.

- Inventory view  
  Add a page that lists all items the player has earned (name, rarity, image, description). Consider filters/sorting and a link-out from rewards.

- Admin content coverage  
  Show which days are missing content. Surface a per-day checklist in the dashboard so gaps are obvious at a glance and provide links to offending files.

- Broken content reporting  
  In the admin area, list content files that failed to load or parse (locale/mode combos). Include the error message so fixes are straightforward.

- Error and warning log  
  Expose recent server errors/warnings in the admin panel with timestamps and a quick filter. Helps diagnose content or auth issues without digging through server logs.

— Additional ideas (suggested)

- Puzzle debug “raw” panel (suggested)  
  In admin debug mode, show recent API calls for a day/puzzle (endpoint, payload, response, status). Include a compact visualization of the normalized puzzle block (options, sockets, minSelections, optionSize) and server-side validation results for quick inspection.

- Content linter (suggested)  
  Add a CLI or CI check that validates content files (frontmatter keys, image references, option sizes, shape values) and reports missing assets per locale/mode.

- Automated screenshots (suggested)  
  Headless snapshot script per day/locale/mode to capture the rendered puzzle. Admin page could display the latest thumbnail to spot layout issues quickly.

- Playthrough presets (suggested)  
  Admin tool to create a throwaway user with a chosen locale/mode and unlocked day, auto-login link provided. Speeds up QA across different states.

- Metrics hooks (suggested)  
  Emit structured events for puzzle starts, retries, and solves (with type metadata). Useful for later analytics or balancing difficulty.

User experience ideas (suggested)

- Accessibility polish  
  Add keyboard and screen-reader support across puzzles (focus outlines, aria-live feedback on correct/incorrect submissions, high-contrast theme).
- Adaptive hints  
  Offer progressive hints after failed attempts or idle time, configurable per puzzle to avoid spoilers.
- Locale-aware typography  
  Tune fonts/line-height per language to improve readability for longer German text; ensure consistent quotation styling.
- Offline-friendly assets  
  Cache static assets and day content for already unlocked days to reduce reload delays on shaky connections.
- Session expiry nudges  
  Gentle banner when session is about to expire with a one-click refresh to avoid losing answers mid-typing.

User settings ideas (suggested)

- Theme and contrast  
  Let users choose light/dark and a high-contrast mode; persist per user.
- Text scaling  
  Adjustable font size for riddle text and UI labels to improve readability.
- Motion reduction  
  Toggle to reduce or disable animations/hover effects for motion-sensitive users.
- Audio cues  
  Optional sound effects for correct/incorrect submissions and unlock events; master mute toggle.
- Hint preferences  
  Allow users to opt into or out of adaptive hints and set how intrusive they are.
- Language fallbacks  
  Let users specify whether to fall back to English if a locale-specific riddle is missing, or to block until localized.

Admin tooling ideas (suggested)

- Content diff viewer  
  Show git-style diffs of content changes per day/locale/mode inside the admin, with quick revert to last known good.
- Live impersonation  
  Admin can view the site as a selected user (read-only) to reproduce reported issues without changing state.
- Batch unlock schedule  
  Configure a schedule to auto-unlock days at set times; admin UI shows upcoming unlocks and allows pause/resume.
- Alerting on errors  
  Hook server warnings/errors into a lightweight alert feed (email/Discord webhook) with links to the admin log view.
- Asset integrity checker  
  Verify referenced images exist (content vs content-assets vs backend assets) and flag broken links in the admin dashboard.

Operations ideas (suggested)

- One-command bootstrap  
  Script to spin up both backend/frontend with seeded data and default envs; include health checks.
- Versioned content bundles  
  Package content per release and tag them; support rolling back to a previous content bundle if a regression is found.
- Staging parity  
  Ensure staging mirrors production env flags (Discord OAuth callback, CORS, sessions) and add a staging-only admin user.
- CI checks  
  Run type checks, linting, content lints, and screenshot diffs in CI; fail fast with actionable logs.
- Runtime health endpoints  
  Add `/healthz` and `/readyz` with DB + content checks for better container orchestration and monitoring.

Feature ideas (suggested)

- Leaderboard (privacy-aware)  
  Opt-in leaderboard showing solve streaks or fastest solves per day/difficulty without exposing personal data.
- Cooperative puzzles  
  Introduce puzzles requiring shared clues between users (with server-side validation to avoid cheating).
- Daily streak rewards  
  Grant cosmetic badges or inventory items for consecutive solves; display in inventory and profile.
- Dynamic difficulty hints  
  If a user repeatedly fails on VET, offer optional hint packs that do not spoil the solution outright.
- Discord bot integration  
  Bot announces new unlocked days, provides hint tokens, and lets users check their progress via commands.
