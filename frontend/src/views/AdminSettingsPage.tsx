import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAdminFeedbackSettings, updateAdminFeedbackSettings } from "../services/api";
import type { AdminFeedbackSettings } from "../types";

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
    </div>
  );
}
