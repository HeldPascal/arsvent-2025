# A1-130 — Discord-Based Eligibility

## Status
Ready

## Related Spec
- docs/specs/A1-feedback-and-prizes.md (A1.3)

## Goal
Determine prize eligibility using Discord roles.

## Scope
- Single Discord server (v1)
- One or more eligible roles
- Eligibility snapshot at draw time

## Functional Requirements
- Event config:
  - discord_server_id
  - eligible_role_ids[]
  - refresh_interval_minutes (int)
  - API endpoints:
    - `GET /api/admin/eligibility`
    - `PUT /api/admin/eligibility` body `{ discordServerId, eligibleRoleIds, refreshIntervalMinutes }`
    - `GET /api/admin/eligibility/roles` response `{ roles: [{ id, name }] }`
      - `400` `{ error: "bot_missing_or_inactive_server" }` when no active server or bot missing
    - `POST /api/admin/eligibility/refresh` (force refresh)
      - response `{ ok: true }`
  - User endpoint:
    - `GET /api/eligibility` (current user status + reason)
      - response `{ eligible, reason, checkedAt }`
      - `checkedAt` comes from `User.discordRolesUpdatedAt`
- User is eligible if:
  - Discord account linked
  - Member of server
  - Has at least one eligible role
- Eligibility evaluation:
  - Compute eligibility snapshot at draw time and store with the draw record.
  - Cache user roles via periodic bot fetch; use cached roles for eligibility.
  - Provide an admin-only "Force refresh roles" action.
  - If role data is unavailable, show "unknown".
  - Empty `eligible_role_ids` is allowed and results in all users being ineligible.
  - Backend runs a scheduled refresh job using `refreshIntervalMinutes`.
- Discord role source:
  - Use a Discord bot in the configured server.
  - Fetch member roles via the Guild Member endpoint (`/guilds/{guild.id}/members/{user.id}`) using the bot token.
    - `/api/admin/eligibility/roles` also uses the bot token.
  - Bot requirements:
    - Bot token stored in env (`DISCORD_BOT_TOKEN`).
    - Bot is added to the configured server.
    - Bot has permissions to read member roles and the Guild Members intent enabled.
- Admin Discord connect (user OAuth2):
  - Same Discord app is used for user OAuth2 and bot invite.
  - Scopes: `identify`, `guilds`.
  - Callback URL: `/auth/discord/admin/callback`.
  - After callback, store admin access token for guild list fetches.
  - Refresh flow:
    - Store refresh token and refresh access tokens when expired.
  - Fetch guilds via `GET /users/@me/guilds`.
  - Filter to guilds where admin can manage/install (owner OR `ADMINISTRATOR`/`MANAGE_GUILD`).
- Bot invite flow:
  - Callback URL: `/auth/discord/bot/callback`.
  - Build invite URL with `client_id`, `scope=bot applications.commands`, `permissions=<bitmask>`,
    `guild_id=<selected>`, `disable_guild_select=true`, `response_type=code`, `state=<csrf+guildId>`.
    - Validate state on callback; reject if invalid.
  - Invite link uses `DISCORD_APP_ID` for `client_id`.

- Persistence:
  - `EventConfig` table (single row) stores:
    - `discordServerId` (string, nullable)
    - `eligibleRoleIds` (string[], default empty)
    - `refreshIntervalMinutes` (int, default 60)
  - User role snapshots stored in `UserDiscordRole` table:
    - `userId` (FK)
    - `guildId` (Discord server ID)
    - `roleId`
    - `createdAt`
  - `User` stores `discordRolesUpdatedAt` (timestamp) for refresh tracking.
  - `AdminDiscordToken` table stores:
    - `userId` (FK)
    - `accessToken` (string)
    - `refreshToken` (string, optional)
    - `expiresAt` (timestamp)
    - Tokens are scoped to the admin user only (no sharing).
  - Draw eligibility snapshot stored with the draw record.

## UI Requirements
- User-facing eligibility status:
  - eligible / not eligible
  - reason if not eligible
  - reason codes: `not_linked`, `not_in_server`, `missing_role`, `unknown`
- Display eligibility on the Prizes page and in Settings
  - Show `checkedAt` timestamp to indicate last eligibility update

## Admin UI
- Dedicated admin settings page for eligibility config
- Fields:
  - Discord server list (tiles)
    - Each tile shows: guild name (icon optional), bot status, active badge.
    - Bot status: "Bot installed" / "Bot not installed".
    - Active guild: highlighted, with "Active" badge.
    - If active guild is not in the admin's list, show "Active (no access)".
  - Eligible roles (multi-select from `/api/admin/eligibility/roles`)
  - Refresh interval (minutes)
  - Force refresh roles button
- Flow:
  - Connect Discord (user OAuth2) to fetch server list.
  - Merge guild list with bot membership to show installed/not installed.
    - Bot presence detected from the bot's known guild set.
  - Invite the bot to missing guilds (show invite link).
    - Invite URL uses `guild_id` + `disable_guild_select=true`.
    - OAuth `state` includes CSRF + guildId + returnUrl.
  - Set active server (requires bot already present).
    - Disabled if bot not installed; show hint "Invite bot first".
  - Load roles from `/api/admin/eligibility/roles`, select eligible roles, save.
  - Force refresh triggers a role refresh job and updates `discordRolesUpdatedAt`.
  - Multi-admin rules:
    - Each admin sees only their own Discord guild list.
    - The currently active server is visible to all admins (even if not in their list).
    - Admins can change the active server only to guilds they can administer (appear in their list).

## Acceptance Criteria
- [ ] Eligibility can be configured by admin
- [ ] System computes eligibility correctly
- [ ] UI clearly communicates eligibility
- [ ] Eligibility endpoint returns status + reason codes
- [ ] Eligibility is shown on Prizes and Settings
- [ ] UI displays an "unknown" state when role data is missing
- [ ] Bot setup steps are documented and required env is listed
- [ ] Bot-based role lookup succeeds for eligible users in the configured server
- [ ] Refresh tokens are used to avoid repeated Discord reauth for admins

## Notes
Backend also hosts the bot, so bot presence can be assumed.
