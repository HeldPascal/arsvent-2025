import { useCallback, useEffect, useMemo, useState } from "react";
import ConfirmDialog from "./components/ConfirmDialog";
import {
  fetchAdminEligibility,
  fetchAdminEligibilityRoles,
  fetchAdminFeedbackSettings,
  refreshAdminEligibility,
  updateAdminEligibility,
  updateAdminFeedbackSettings,
} from "../services/api";
import type { AdminEligibilityConfig, AdminEligibilityGuild, AdminEligibilityRole, AdminFeedbackSettings } from "../types";

const toLocalInputValue = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
};

const toIsoValue = (value: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminFeedbackSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ enabled: false, freeTextEnabled: false, endsAt: "" });
  const [eligibilityConfig, setEligibilityConfig] = useState<AdminEligibilityConfig | null>(null);
  const [eligibilityForm, setEligibilityForm] = useState<AdminEligibilityConfig | null>(null);
  const [eligibilityGuilds, setEligibilityGuilds] = useState<AdminEligibilityGuild[]>([]);
  const [eligibilityRoles, setEligibilityRoles] = useState<AdminEligibilityRole[]>([]);
  const [eligibilityConnected, setEligibilityConnected] = useState(false);
  const [botTokenConfigured, setBotTokenConfigured] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [eligibilitySaving, setEligibilitySaving] = useState(false);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [eligibilityConfirm, setEligibilityConfirm] = useState<
    | { type: "set-active"; guildId: string; guildName: string }
    | { type: "reset" }
    | null
  >(null);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminFeedbackSettings();
      setSettings(data);
      setForm({
        enabled: data.enabled,
        freeTextEnabled: data.freeTextEnabled,
        endsAt: toLocalInputValue(data.endsAt),
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const loadEligibility = useCallback(async () => {
    setEligibilityLoading(true);
    setEligibilityError(null);
    try {
      const data = await fetchAdminEligibility();
      setEligibilityConfig(data.config);
      setEligibilityForm(data.config);
      setEligibilityGuilds(data.guilds);
      setEligibilityConnected(data.connected);
      setBotTokenConfigured(data.botTokenConfigured);
    } catch (err) {
      setEligibilityError((err as Error).message);
    } finally {
      setEligibilityLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEligibility();
  }, [loadEligibility]);

  useEffect(() => {
    if (!eligibilityConfig?.discordServerId) {
      setEligibilityRoles([]);
      return;
    }
    setRolesLoading(true);
    setRolesError(null);
    fetchAdminEligibilityRoles()
      .then((payload) => {
        setEligibilityRoles(payload.roles);
      })
      .catch((err) => setRolesError((err as Error).message))
      .finally(() => setRolesLoading(false));
  }, [eligibilityConfig?.discordServerId]);

  const endsAtIso = useMemo(() => toIsoValue(form.endsAt), [form.endsAt]);
  const feedbackStatus = useMemo(() => {
    if (!settings) return "Unknown";
    if (!settings.enabled) return "Disabled";
    if (settings.endsAt && Date.now() > new Date(settings.endsAt).getTime()) return "Closed";
    return "Open";
  }, [settings]);
  const feedbackStatusLabel = feedbackStatus === "Open" ? "Open" : feedbackStatus;
  const feedbackStatusTone = feedbackStatus === "Open" ? "success" : "muted";
  const endsAtLabel = useMemo(() => {
    if (!settings?.endsAt) return "No end date";
    const date = new Date(settings.endsAt);
    return Number.isNaN(date.getTime()) ? "Invalid date" : date.toLocaleString("de-DE");
  }, [settings?.endsAt]);
  const feedbackEnded = useMemo(() => {
    if (!settings?.endsAt) return false;
    return Date.now() > new Date(settings.endsAt).getTime();
  }, [settings?.endsAt]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateAdminFeedbackSettings({
        enabled: form.enabled,
        freeTextEnabled: form.freeTextEnabled,
        endsAt: endsAtIso,
      });
      setSettings(updated);
      setForm({
        enabled: updated.enabled,
        freeTextEnabled: updated.freeTextEnabled,
        endsAt: toLocalInputValue(updated.endsAt),
      });
      window.dispatchEvent(new CustomEvent("app:toast", { detail: { type: "success", key: "settingsSaved" } }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleEligibilitySave = async () => {
    if (!eligibilityForm) return;
    setEligibilitySaving(true);
    setEligibilityError(null);
    try {
      const updated = await updateAdminEligibility(eligibilityForm);
      setEligibilityConfig(updated);
      setEligibilityForm(updated);
      await loadEligibility();
    } catch (err) {
      setEligibilityError((err as Error).message);
    } finally {
      setEligibilitySaving(false);
    }
  };

  const handleForceRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAdminEligibility();
      await loadEligibility();
    } catch (err) {
      setEligibilityError((err as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleRole = (roleId: string) => {
    if (!eligibilityForm) return;
    const next = eligibilityForm.eligibleRoleIds.includes(roleId)
      ? eligibilityForm.eligibleRoleIds.filter((id) => id !== roleId)
      : [...eligibilityForm.eligibleRoleIds, roleId];
    setEligibilityForm({ ...eligibilityForm, eligibleRoleIds: next });
  };

  const selectGuild = (guildId: string, guildName: string) => {
    setEligibilityConfirm({ type: "set-active", guildId, guildName });
  };

  const handleConfirmSetActive = async (guildId: string) => {
    if (!eligibilityForm) return;
    setEligibilitySaving(true);
    setEligibilityError(null);
    try {
      const updated = await updateAdminEligibility({
        discordServerId: guildId,
        eligibleRoleIds: [],
        userRolesRefreshIntervalMinutes: eligibilityForm.userRolesRefreshIntervalMinutes,
      });
      setEligibilityConfig(updated);
      setEligibilityForm(updated);
      await loadEligibility();
    } catch (err) {
      setEligibilityError((err as Error).message);
    } finally {
      setEligibilitySaving(false);
    }
  };

  const handleResetEligibility = async () => {
    if (!eligibilityForm) return;
    setEligibilitySaving(true);
    setEligibilityError(null);
    try {
      const updated = await updateAdminEligibility({
        discordServerId: null,
        eligibleRoleIds: [],
        userRolesRefreshIntervalMinutes: 60,
      });
      setEligibilityConfig(updated);
      setEligibilityForm(updated);
      await loadEligibility();
    } catch (err) {
      setEligibilityError((err as Error).message);
    } finally {
      setEligibilitySaving(false);
    }
  };

  const getGuildIcon = (guild: AdminEligibilityGuild) =>
    guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=64` : null;

  const getGuildInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");

  return (
    <div className="panel">
      <header className="panel-header">
        <div>
          <div className="eyebrow">Admin</div>
          <h2>Settings</h2>
          <p className="muted">Configure feedback availability and submission rules.</p>
        </div>
      </header>

      {loading && <p>Loading settings…</p>}
      {error && <p className="error">{error}</p>}

      {settings && (
        <div className="panel subpanel settings-card stack">
          <div className="settings-header">
            <div>
              <h3>Feedback</h3>
              <p className="muted">Open or close feedback and choose whether comments are allowed.</p>
            </div>
            <span className={`pill ${feedbackStatusTone}`}>{feedbackStatusLabel}</span>
          </div>
          <div className="settings-meta">
            <div>
              <div className="muted small">Ends at</div>
              <div>{endsAtLabel}</div>
            </div>
          </div>
          <label className="toggle-row">
            <span className="switch">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(event) => setForm((prev) => ({ ...prev, enabled: event.target.checked }))}
                disabled={feedbackEnded}
              />
              <span className="slider" aria-hidden="true" />
            </span>
            <span className="toggle-text">Enable feedback</span>
            <span className="toggle-hint muted">
              {feedbackEnded ? "Feedback ended. Clear the end date to reopen." : "Blocks submissions when disabled."}
            </span>
          </label>
          <label className="toggle-row">
            <span className="switch">
              <input
                type="checkbox"
                checked={form.freeTextEnabled}
                onChange={(event) => setForm((prev) => ({ ...prev, freeTextEnabled: event.target.checked }))}
              />
              <span className="slider" aria-hidden="true" />
            </span>
            <span className="toggle-text">Allow free-text comments</span>
            <span className="toggle-hint muted">Hide the comment field when disabled.</span>
          </label>
          <label className="field">
            <span className="muted">Feedback ends at (optional)</span>
            <input
              type="datetime-local"
              className="date-input"
              value={form.endsAt}
              onChange={(event) => setForm((prev) => ({ ...prev, endsAt: event.target.value }))}
            />
          </label>
          {feedbackEnded && (
            <button
              className="ghost"
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, endsAt: "" }))}
            >
              Clear end date
            </button>
          )}
          <div className="panel-actions">
            <button className="primary" type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save settings"}
            </button>
          </div>
        </div>
      )}

      <div className="panel subpanel settings-card stack" style={{ marginTop: 16 }}>
        <div className="settings-header">
          <div>
            <h3>Discord eligibility</h3>
            <p className="muted">Configure which Discord roles qualify users for prizes.</p>
          </div>
          {!eligibilityConnected && (
            <a className="ghost" href={`/auth/discord/admin?returnTo=${encodeURIComponent(window.location.href)}`}>
              Connect Discord
            </a>
          )}
        </div>

        {eligibilityLoading && <p>Loading eligibility…</p>}
        {eligibilityError && <p className="error">{eligibilityError}</p>}

        {eligibilityForm && (
          <>
            <div className="settings-meta">
              <div>
                <div className="muted small">Bot token</div>
                <div>{botTokenConfigured ? "Configured" : "Missing"}</div>
              </div>
              <div>
                <div className="muted small">Active server</div>
                <div>{eligibilityForm.discordServerId ?? "Not set"}</div>
              </div>
            </div>

            <div className="settings-meta">
              <div className="muted small">Servers</div>
            </div>
            <div className="guild-grid">
              {eligibilityGuilds.length === 0 && (
                <div className="muted">No accessible servers. Connect Discord to load guilds.</div>
              )}
              {eligibilityGuilds.map((guild) => (
                <div key={guild.id} className={`panel subpanel guild-card ${guild.active ? "is-active" : ""}`}>
                  <div className="guild-card-header">
                    <div className="guild-icon">
                      {getGuildIcon(guild) ? (
                        <img src={getGuildIcon(guild)!} alt={`${guild.name} icon`} />
                      ) : (
                        <span>{getGuildInitials(guild.name)}</span>
                      )}
                    </div>
                    <div className="guild-meta">
                      <div className="guild-title">{guild.name}</div>
                      <div className="muted small">{guild.id}</div>
                    </div>
                  </div>
                  <div className="guild-actions">
                    <div className="guild-status">
                      <span className={`status-dot ${guild.botInstalled ? "ok" : "warn"}`} />
                      <span className="muted small">
                        {guild.botInstalled ? "Bot installed" : "Bot missing"}
                        {guild.noAccess ? " · No access" : ""}
                      </span>
                    </div>
                    {!guild.active && guild.botInstalled && !guild.noAccess && (
                      <button
                        className="ghost guild-button"
                        type="button"
                        onClick={() => selectGuild(guild.id, guild.name)}
                      >
                        Set active
                      </button>
                    )}
                    {!guild.botInstalled && !guild.noAccess && (
                      <a
                        className="ghost guild-button"
                        href={`/auth/discord/bot?guildId=${guild.id}&returnTo=${encodeURIComponent(
                          window.location.href,
                        )}`}
                      >
                        Invite bot
                      </a>
                    )}
                    {guild.active && <span className="pill success guild-pill">Active</span>}
                  </div>
                </div>
              ))}
            </div>

            <label className="field">
              <span className="muted">Refresh interval (minutes)</span>
              <input
                type="number"
                min={0}
                value={eligibilityForm.userRolesRefreshIntervalMinutes}
                onChange={(event) =>
                  setEligibilityForm({
                    ...eligibilityForm,
                    userRolesRefreshIntervalMinutes: Math.max(0, Number(event.target.value) || 0),
                  })
                }
              />
              <div className="inline-pill-row">
                <span className="muted small">Set to 0 to disable automatic refresh.</span>
                {eligibilityForm.userRolesRefreshIntervalMinutes === 0 && (
                  <span className="pill warning">Auto refresh disabled</span>
                )}
              </div>
            </label>

            <div className="field">
              <span className="muted small">Eligible roles</span>
              {rolesLoading && <div className="muted">Loading roles…</div>}
              {rolesError && <div className="error">{rolesError}</div>}
              {!rolesLoading && eligibilityRoles.length === 0 && (
                <div className="muted">No roles loaded yet.</div>
              )}
              <div className="feedback-scale" style={{ gap: 8 }}>
                {eligibilityRoles.map((role) => {
                  const selected = eligibilityForm.eligibleRoleIds.includes(role.id);
                  return (
                    <button
                      key={role.id}
                      type="button"
                      className={`feedback-option ${selected ? "active" : ""}`}
                      onClick={() => toggleRole(role.id)}
                    >
                      <span className="feedback-label">{role.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="panel-actions">
              <button className="ghost" type="button" onClick={handleForceRefresh} disabled={refreshing}>
                {refreshing ? "Refreshing…" : "Force refresh roles"}
              </button>
              <button className="ghost" type="button" onClick={() => setEligibilityConfirm({ type: "reset" })}>
                Reset eligibility
              </button>
              <button
                className="primary"
                type="button"
                onClick={handleEligibilitySave}
                disabled={eligibilitySaving}
              >
                {eligibilitySaving ? "Saving…" : "Save eligibility"}
              </button>
            </div>
          </>
        )}
      </div>

      {eligibilityConfirm?.type === "set-active" && (
        <ConfirmDialog
          message={`Set ${eligibilityConfirm.guildName} as the active eligibility server? This clears any selected roles.`}
          confirmLabel="Set active"
          onCancel={() => setEligibilityConfirm(null)}
          onConfirm={async () => {
            const { guildId } = eligibilityConfirm;
            setEligibilityConfirm(null);
            await handleConfirmSetActive(guildId);
          }}
        />
      )}
      {eligibilityConfirm?.type === "reset" && (
        <ConfirmDialog
          message="Reset eligibility configuration? This clears the active server and eligible roles."
          confirmLabel="Reset"
          onCancel={() => setEligibilityConfirm(null)}
          onConfirm={async () => {
            setEligibilityConfirm(null);
            await handleResetEligibility();
          }}
        />
      )}
    </div>
  );
}
