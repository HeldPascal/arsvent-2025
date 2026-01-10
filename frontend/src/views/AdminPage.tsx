import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  AdminAuditEntry,
  AdminFeedbackSummary,
  AdminOverview,
  AdminUserSummary,
  AdminVersionResponse,
  ContentDiagnostics,
  Mode,
  User,
} from "../types";
import {
  adminDeleteUser,
  adminRevokeSessions,
  adminSetAdmin,
  adminUnlockNext,
  adminUnlockSet,
  adminUpdateMode,
  adminUpdateProgress,
  deleteAuditEntry,
  fetchAdminFeedback,
  fetchAdminOverview,
  fetchAdminPrizes,
  fetchAdminVersion,
  fetchAdminUsers,
  fetchAudit,
  fetchAdminContentDiagnostics,
} from "../services/api";
import { useI18n } from "../i18n";
import StatBar from "./components/StatBar";
import CollapsibleHistogram from "./components/CollapsibleHistogram";

interface Props {
  user: User;
}

export default function AdminPage({ user }: Props) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [userLookup, setUserLookup] = useState<Record<string, AdminUserSummary>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [progressDay, setProgressDay] = useState<Record<string, number>>({});
  const [unlockedInput, setUnlockedInput] = useState<number>(0);
  const [unlocking, setUnlocking] = useState(false);
  const [audit, setAudit] = useState<AdminAuditEntry[]>([]);
  const auditLimit = 3;
  const [auditLoading, setAuditLoading] = useState(false);
  const [contentDiagnostics, setContentDiagnostics] = useState<ContentDiagnostics | null>(null);
  const [contentDiagLoading, setContentDiagLoading] = useState(false);
  const [versionInfo, setVersionInfo] = useState<AdminVersionResponse | null>(null);
  const [versionLoading, setVersionLoading] = useState(false);
  const [feedbackSummary, setFeedbackSummary] = useState<AdminFeedbackSummary | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [prizeSummary, setPrizeSummary] = useState<{
    total: number;
    active: number;
    main: number;
    veteran: number;
  } | null>(null);
  const [prizeLoading, setPrizeLoading] = useState(false);
  const { t } = useI18n();
  const navigate = useNavigate();
  const contentLimit =
    overview?.diagnostics.maxContiguousContentDay ?? overview?.diagnostics.contentDayCount ?? 24;
  const nextDayHasContent = overview?.diagnostics.nextDayHasContent ?? false;
  const feedbackEmojiByRating: Record<string, string> = {
    "1": "😡",
    "2": "😕",
    "3": "😐",
    "4": "🙂",
    "5": "😍",
  };
  const feedbackLabelByRating = {
    "1": "feedbackVeryDissatisfied",
    "2": "feedbackDissatisfied",
    "3": "feedbackNeutral",
    "4": "feedbackSatisfied",
    "5": "feedbackVerySatisfied",
  } as const;

  const loadData = useCallback(
    async (showLoader = false) => {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);
      try {
        const [ov, us] = await Promise.all([fetchAdminOverview(), fetchAdminUsers()]);
        setOverview(ov);
        setUsers(us);
        const map = us.reduce<Record<string, AdminUserSummary>>((acc, u) => {
          acc[u.id] = u;
          return acc;
        }, {});
        setUserLookup(map);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const loadAudit = useCallback(
    async (limit: number) => {
      setAuditLoading(true);
      try {
        const entries = await fetchAudit(limit);
        setAudit(entries ?? []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setAuditLoading(false);
      }
    },
    [],
  );

  const loadContentDiagnostics = useCallback(
    async (showLoader = false) => {
      if (showLoader) setContentDiagLoading(true);
      try {
        const diag = await fetchAdminContentDiagnostics();
        setContentDiagnostics(diag);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        if (showLoader) setContentDiagLoading(false);
      }
    },
    [],
  );

  const loadVersion = useCallback(
    async (showLoader = false) => {
      if (showLoader) setVersionLoading(true);
      try {
        const version = await fetchAdminVersion();
        setVersionInfo(version);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        if (showLoader) setVersionLoading(false);
      }
    },
    [],
  );

  const loadFeedback = useCallback(
    async (showLoader = false) => {
      if (showLoader) setFeedbackLoading(true);
      try {
        const feedback = await fetchAdminFeedback();
        setFeedbackSummary(feedback);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        if (showLoader) setFeedbackLoading(false);
      }
    },
    [],
  );

  const loadPrizeSummary = useCallback(
    async (showLoader = false) => {
      if (showLoader) setPrizeLoading(true);
      try {
        const store = await fetchAdminPrizes();
        const active = store.prizes.filter((prize) => prize.isActive);
        setPrizeSummary({
          total: store.prizes.length,
          active: active.length,
          main: active.filter((prize) => prize.pool === "MAIN").length,
          veteran: active.filter((prize) => prize.pool === "VETERAN").length,
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        if (showLoader) setPrizeLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadData(true);
    loadAudit(auditLimit);
    loadContentDiagnostics(true);
    loadVersion(true);
    loadFeedback(true);
    loadPrizeSummary(true);
  }, [loadData, loadAudit, loadContentDiagnostics, loadVersion, loadFeedback, loadPrizeSummary, auditLimit]);

  useEffect(() => {
    if (overview) {
      setUnlockedInput(overview.diagnostics.availableDay);
    }
  }, [overview]);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (!cancelled) {
        loadData(false);
        loadAudit(auditLimit);
        loadContentDiagnostics(false);
        loadVersion(false);
        loadFeedback(false);
        loadPrizeSummary(false);
      }
    };
    const interval = window.setInterval(refresh, 10000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [auditLimit, loadAudit, loadContentDiagnostics, loadData, loadVersion, loadFeedback, loadPrizeSummary]);

  const isSuperAdmin = user.isSuperAdmin;

  const handleModeChange = async (targetId: string, mode: Mode) => {
    setBusyUserId(targetId);
    try {
      await adminUpdateMode(targetId, mode);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyUserId(null);
    }
  };

  const handleRevoke = async (targetId: string) => {
    setBusyUserId(targetId);
    try {
      await adminRevokeSessions(targetId);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDelete = async (targetId: string) => {
    const target = users.find((u) => u.id === targetId);
    if (!target) return;
    if (!window.confirm(`Delete ${target.username} and all their data?`)) {
      return;
    }
    setBusyUserId(targetId);
    try {
      await adminDeleteUser(targetId);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyUserId(null);
    }
  };

  const handleToggleAdmin = async (targetId: string, isAdmin: boolean) => {
    setBusyUserId(targetId);
    try {
      await adminSetAdmin(targetId, isAdmin);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyUserId(null);
    }
  };

  const handleProgressUpdate = async (targetId: string) => {
    const dayValue = progressDay[targetId] ?? 0;
    setBusyUserId(targetId);
    try {
      await adminUpdateProgress(targetId, dayValue);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyUserId(null);
    }
  };

  const setDay = (userId: string, value: number) => {
    const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), 24) : 0;
    setProgressDay((prev) => ({ ...prev, [userId]: safeValue }));
  };

  const handleUnlockNext = async () => {
    if (!overview?.diagnostics.nextDayHasContent) {
      setError("Cannot unlock the next day: missing content.");
      return;
    }
    setUnlocking(true);
    try {
      await adminUnlockNext();
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUnlocking(false);
    }
  };

  const handleUnlockSet = async () => {
    if (!overview) return;
    const safeDay = Math.min(Math.max(unlockedInput, 0), contentLimit);
    const increasing = safeDay > overview.diagnostics.availableDay;
    if (increasing && !overview.diagnostics.nextDayHasContent) {
      setUnlockedInput(safeDay);
      setError("Cannot unlock the next day: missing content.");
      return;
    }
    setUnlocking(true);
    try {
      setUnlockedInput(safeDay);
      await adminUnlockSet(safeDay);
      await loadData();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUnlocking(false);
    }
  };

  const handleDeleteAudit = async (id: number) => {
    try {
      await deleteAuditEntry(id);
      await loadAudit(auditLimit);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const userLabel = (id?: string | null) => {
    if (!id) return null;
    const user = userLookup[id];
    if (user) return `${user.username} (${id})`;
    return id;
  };

  const actorLabel = (actorId?: string | null) => {
    if (!actorId) return "unknown";
    return userLabel(actorId) ?? actorId;
  };

  const formatValue = (value?: string | null) => value ?? "Unknown";
  const formatDirty = (dirty?: boolean | null) => (dirty === null || dirty === undefined ? "Unknown" : dirty ? "Dirty" : "Clean");
  const formatBuiltAt = (builtAt?: string | null) => (builtAt ? new Date(builtAt).toLocaleString() : "Unknown");

  return (
    <div className="stack">
      <div className="panel">
        <header className="panel-header">
          <div>
            <div className="eyebrow">Admin</div>
            <h2>Control center</h2>
            <p className="muted">Diagnostics, stats, and user administration.</p>
          </div>
          <div className="pill success">{user.isSuperAdmin ? "Super admin" : "Admin"}</div>
        </header>

        {loading && <p>Loading admin data…</p>}
        {error && <p className="error">{error}</p>}

      {overview && (
        <>
          <div className="panel" style={{ marginBottom: 12 }}>
            <h3>Progress</h3>
            <div className="progress-controls">
              <div className="muted">
                Current unlocked day: {overview.diagnostics.availableDay} · Content days: {overview.diagnostics.contentDayCount} /
                {overview.diagnostics.maxDay} · Contiguous: day {overview.diagnostics.maxContiguousContentDay}
              </div>
              <div className="progress-actions">
                <button
                  className="primary"
                  type="button"
                  onClick={handleUnlockNext}
                  disabled={unlocking || !nextDayHasContent}
                >
                  Unlock next
                </button>
                <label className="progress-set">
                  Set day
                  <input
                    type="number"
                    min={0}
                    max={contentLimit}
                    value={unlockedInput}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (!Number.isFinite(next)) return;
                      setUnlockedInput(Math.min(Math.max(next, 0), contentLimit));
                    }}
                  />
                </label>
                <button
                  className="ghost"
                  type="button"
                  onClick={handleUnlockSet}
                  disabled={unlocking || (!nextDayHasContent && unlockedInput > overview.diagnostics.availableDay)}
                >
                  Apply
                </button>
              </div>
            </div>
            <StatBar
              label="Available days"
              total={overview.diagnostics.maxDay}
              segments={[
                { label: "Unlocked", value: overview.diagnostics.availableDay, color: "#8b5cf6" },
                { label: "Locked", value: Math.max(overview.diagnostics.maxDay - overview.diagnostics.availableDay, 0), color: "#334155" },
              ]}
            />
            <div style={{ marginTop: 12 }}>
              <div className="panel subpanel content-coverage">
                <div className="compact-row" style={{ justifyContent: "space-between", width: "100%" }}>
                  <span className="muted">Content coverage</span>
                  <button className="ghost nav-link" type="button" onClick={() => navigate("/admin/content")}>
                    Open matrix
                  </button>
                </div>
                {contentDiagnostics && (
                  <>
                    <CoverageBar stats={contentDiagnostics.stats} />
                    <div className="coverage-legend">
                      <Legend label="Issues" value={contentDiagnostics.stats.issueDays} color="#d946ef" />
                      <Legend label="Partial" value={contentDiagnostics.stats.partialDays} color="#f59e0b" />
                      <Legend label="Complete" value={contentDiagnostics.stats.completeDays} color="#0ea5e9" />
                      <Legend label="Empty" value={contentDiagnostics.stats.emptyDays} color="#475569" />
                    </div>
                    {contentDiagLoading && <div className="muted small">Refreshing coverage…</div>}
                  </>
                )}
                {!contentDiagnostics && !contentDiagLoading && (
                  <div className="muted small">Coverage data unavailable.</div>
                )}
              </div>
            </div>
            <CollapsibleHistogram
              title="Players per last solved day"
              values={overview.stats.solveHistogram}
              labelPrefix="Day"
            />
            <CollapsibleHistogram
              title="Downgrades by last solved day"
              values={overview.stats.downgradeHistogram}
              labelPrefix="Day"
            />
          </div>

          <div className="panel">
            <h3>At a glance</h3>
            <div className="grid">
              <StatBar
                label="Users started"
                total={overview.stats.totalUsers}
                segments={[
                  { label: "Started", value: overview.stats.progressedUsers, color: "#4aa96c" },
                  { label: "Not started", value: Math.max(overview.stats.totalUsers - overview.stats.progressedUsers, 0), color: "#d44d3f" },
                ]}
              />
              <StatBar
                label="Downgrades"
                total={overview.stats.totalUsers}
                segments={[
                  { label: "Downgraded", value: overview.stats.downgradedUsers, color: "#f97316" },
                  { label: "Others", value: Math.max(overview.stats.totalUsers - overview.stats.downgradedUsers, 0), color: "#475569" },
                ]}
              />
              <StatBar
                label="Difficulty split"
                total={overview.stats.totalUsers}
                segments={[
                  { label: "VETERAN", value: overview.stats.veteranUsers, color: "#f59e0b" },
                  { label: "NORMAL", value: overview.stats.normalUsers, color: "#60a5fa" },
                ]}
              />
              <StatBar
                label="Solve depth"
                total={24}
                segments={[
                  { label: "Avg last day", value: Math.round((overview.recentSolves.reduce((acc, s) => acc + s.lastSolvedDay, 0) || 0) / Math.max(overview.recentSolves.length || overview.stats.progressedUsers || 1, 1)), color: "#22c55e" },
                  { label: "Max day", value: Math.max(...overview.recentSolves.map((s) => s.lastSolvedDay), 0), color: "#6366f1" },
                ]}
              />
            </div>
          </div>

          <div className="panel">
            <h3>Versions</h3>
            {versionLoading && <div className="muted">Loading version info…</div>}
            {!versionLoading && !versionInfo && <div className="muted">Version info unavailable.</div>}
            {versionInfo && (
              <>
                <div className="muted small" style={{ marginBottom: 8 }}>
                  Updated {new Date(versionInfo.updatedAt).toLocaleString()}
                </div>
                <div className="version-grid">
                  <div className="panel subpanel version-card">
                    <div className="muted uppercase">Backend</div>
                    <div className="version-row">
                      <span className="version-label">Image tag</span>
                      <span className="version-value">{formatValue(versionInfo.backend.imageTag)}</span>
                    </div>
                    <div className="version-row">
                      <span className="version-label">Commit</span>
                      <span className="version-value">{formatValue(versionInfo.backend.commitSha)}</span>
                    </div>
                    <div className="version-row">
                      <span className="version-label">Dirty</span>
                      <span className="version-value">{formatDirty(versionInfo.backend.dirty)}</span>
                    </div>
                    <div className="version-row">
                      <span className="version-label">Built at</span>
                      <span className="version-value">{formatBuiltAt(versionInfo.backend.builtAt)}</span>
                    </div>
                  </div>
                  <div className="panel subpanel version-card">
                    <div className="muted uppercase">Frontend</div>
                    <div className="version-row">
                      <span className="version-label">Image tag</span>
                      <span className="version-value">{formatValue(versionInfo.frontend.imageTag)}</span>
                    </div>
                    <div className="version-row">
                      <span className="version-label">Commit</span>
                      <span className="version-value">{formatValue(versionInfo.frontend.commitSha)}</span>
                    </div>
                    <div className="version-row">
                      <span className="version-label">Dirty</span>
                      <span className="version-value">{formatDirty(versionInfo.frontend.dirty)}</span>
                    </div>
                    <div className="version-row">
                      <span className="version-label">Built at</span>
                      <span className="version-value">{formatBuiltAt(versionInfo.frontend.builtAt)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="panel">
            <h3>Feedback</h3>
            {feedbackLoading && <div className="muted">Loading feedback…</div>}
            {!feedbackLoading && !feedbackSummary && <div className="muted">Feedback data unavailable.</div>}
            {feedbackSummary && (
              <>
                <div className="muted small" style={{ marginBottom: 8 }}>
                  Total submissions: {feedbackSummary.count}
                </div>
                <div className="feedback-chart">
                  {(["5", "4", "3", "2", "1"] as const).map((rating) => {
                    const value = feedbackSummary.totals[rating] ?? 0;
                    const total = Math.max(feedbackSummary.count, 1);
                    const percent = Math.round((value / total) * 100);
                    return (
                      <div key={rating} className="feedback-bar">
                        <div className="feedback-bar-meta">
                          <span>
                            <span className="feedback-emoji" aria-hidden="true">
                              {feedbackEmojiByRating[rating]}
                            </span>{" "}
                            {t(feedbackLabelByRating[rating as keyof typeof feedbackLabelByRating])} ({rating})
                          </span>
                          <span className="muted">
                            {value} · {percent}%
                          </span>
                        </div>
                        <div className="feedback-bar-track">
                          <div className="feedback-bar-fill" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {feedbackSummary.comments && feedbackSummary.comments.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div className="muted small" style={{ marginBottom: 6 }}>
                      Latest comments
                    </div>
                    <ul className="plain-list">
                      {feedbackSummary.comments.map((comment, index) => (
                        <li key={`${comment.createdAt}-${index}`} className="list-row">
                          <div className="list-title">
                            {comment.text}
                            <span className="muted"> · {new Date(comment.createdAt).toLocaleString()}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="panel">
            <h3>Prizes</h3>
            {prizeLoading && <div className="muted">Loading prize pools…</div>}
            {!prizeLoading && !prizeSummary && <div className="muted">Prize data unavailable.</div>}
            {prizeSummary && (
              <>
                <div className="muted small" style={{ marginBottom: 8 }}>
                  Active prizes: {prizeSummary.active} · MAIN {prizeSummary.main} · VETERAN {prizeSummary.veteran}
                </div>
                <div className="muted small">Total prizes: {prizeSummary.total}</div>
              </>
            )}
            <div className="panel-actions" style={{ marginTop: 10 }}>
              <button className="ghost" type="button" onClick={() => navigate("/admin/prizes")}>
                Manage prizes
              </button>
            </div>
          </div>

          <div className="panel">
            <h3>Audit log</h3>
            <div className="panel-actions" style={{ justifyContent: "space-between" }}>
              <span className="muted">Most recent {auditLimit} events</span>
              <button className="ghost" type="button" onClick={() => navigate("/admin/audit")}>
                Show more
              </button>
            </div>
            {auditLoading && <div className="muted">Loading audit…</div>}
            <ul className="plain-list">
              {audit.map((entry) => (
                <li key={entry.id} className="list-row">
                  <div className="list-title">
                    {entry.action}{" "}
                    <span className="muted">
                      · {actorLabel(entry.actorId)} · {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {entry.details && (
                    <div className="muted small">
                      {(() => {
                        try {
                          const parsed = JSON.parse(entry.details);
                          const targetHint = parsed.targetId ? userLabel(parsed.targetId) : null;
                          return (
                            <>
                              <span title={entry.details}>{entry.details}</span>
                              {targetHint ? (
                                <span className="muted small" style={{ display: "block" }}>
                                  Target: {targetHint}
                                </span>
                              ) : null}
                            </>
                          );
                        } catch {
                          return <span title={entry.details}>{entry.details}</span>;
                        }
                      })()}
                    </div>
                  )}
                  <div className="panel-actions">
                    <button className="ghost" type="button" onClick={() => handleDeleteAudit(entry.id)}>
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {!auditLoading && audit.length === 0 && <li className="muted">No audit entries yet.</li>}
            </ul>
          </div>

          <div className="metrics-grid">
            <MetricCard label="Users" value={overview.stats.totalUsers} hint={`${overview.stats.adminUsers} admins`} />
            <MetricCard
              label="Difficulty split"
              value={`${overview.stats.veteranUsers} VETERAN / ${overview.stats.normalUsers} NORMAL`}
                hint="Current user modes"
              />
              <MetricCard
                label="Players started"
                value={overview.stats.progressedUsers}
                hint="Users with at least one solve"
              />
              <MetricCard
                label="Availability"
                value={`Day ${overview.diagnostics.availableDay} / ${overview.diagnostics.maxDay}`}
                hint="Server-side day unlock"
              />
              <MetricCard
                label="Uptime"
                value={`${overview.diagnostics.uptimeSeconds}s`}
                hint={`Server ${new Date(overview.diagnostics.serverTime).toLocaleTimeString()}`}
              />
              <MetricCard
                label="Runtime"
                value={overview.diagnostics.nodeVersion}
                hint={overview.diagnostics.superAdminId ? `Super admin: ${overview.diagnostics.superAdminId}` : "No super admin id configured"}
              />
            </div>

            <div className="recent-grid">
              <div>
                <h3>Recent users</h3>
                <ul className="plain-list">
                  {overview.recentUsers.map((u) => (
                    <li key={u.id} className="list-row">
                      <div className="list-title">
                        {u.username}{" "}
                        {u.isSuperAdmin ? <span className="badge">Super</span> : u.isAdmin ? <span className="badge">Admin</span> : null}
                      </div>
                      <div className="muted">
                        {u.locale.toUpperCase()} · {u.mode} · {new Date(u.createdAt).toLocaleDateString()} · Last solved: Day{" "}
                        {u.lastSolvedDay ?? 0}
                      </div>
                    </li>
                  ))}
                  {overview.recentUsers.length === 0 && <li className="muted">No users yet.</li>}
                </ul>
              </div>
              <div>
                <h3>Recent solves</h3>
                <ul className="plain-list">
                  {overview.recentSolves.map((s) => (
                    <li key={`${s.id}-${s.lastSolvedDay}`} className="list-row">
                      <div className="list-title">
                        {s.username} · Day {s.lastSolvedDay}
                      </div>
                      <div className="muted">
                        {s.mode} · {s.lastSolvedAt ? new Date(s.lastSolvedAt).toLocaleString() : "time unknown"}
                      </div>
                    </li>
                  ))}
                  {overview.recentSolves.length === 0 && <li className="muted">No solves yet.</li>}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="panel">
        <header className="panel-header">
          <div>
            <div className="eyebrow">Users</div>
            <h2>User management</h2>
            <p className="muted">Promote admins, reset progress, or revoke sessions.</p>
          </div>
        </header>

        {loading && <p>Loading users…</p>}
        {!loading && users.length === 0 && <p className="muted">No users yet.</p>}

        <div className="user-grid">
          {users.map((u) => (
            <div className="user-card" key={u.id}>
              <div className="user-card-header">
                <div>
                  <div className="user-name">
                    {u.username} {u.globalName ? <span className="muted">({u.globalName})</span> : null}
                  </div>
                  <div className="muted small">ID: {u.id}</div>
                </div>
                <div className="badge-row">
                  {u.isSuperAdmin ? <span className="badge">Super</span> : u.isAdmin ? <span className="badge">Admin</span> : null}
                  <span className="badge">{u.mode}</span>
                  <span className="badge">{u.locale.toUpperCase()}</span>
                </div>
              </div>

              <div className="user-meta">
                <span>Created {new Date(u.createdAt).toLocaleDateString()}</span>
                <span>Last login {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "n/a"}</span>
                <span>Session v{u.sessionVersion}</span>
                <span>State v{u.stateVersion}</span>
              </div>

              <div className="user-stats">
                <span>Last solved day: {u.lastSolvedDay}</span>
                <span>Last solved at: {u.lastSolvedAt ? new Date(u.lastSolvedAt).toLocaleString() : "n/a"}</span>
              </div>

              <div className="admin-actions">
                <button disabled={busyUserId === u.id} onClick={() => handleModeChange(u.id, "NORMAL")}>
                  Set NORMAL
                </button>
                <button disabled={busyUserId === u.id} onClick={() => handleModeChange(u.id, "VETERAN")}>
                  Set VETERAN
                </button>
                <button disabled={busyUserId === u.id} onClick={() => handleRevoke(u.id)}>
                  End sessions
                </button>
                {isSuperAdmin && !u.isSuperAdmin && (
                  <button disabled={busyUserId === u.id} onClick={() => handleToggleAdmin(u.id, !u.isAdmin)}>
                    {u.isAdmin ? "Demote admin" : "Promote to admin"}
                  </button>
                )}
                <button className="danger" disabled={busyUserId === u.id || u.isSuperAdmin} onClick={() => handleDelete(u.id)}>
                  Delete user
                </button>
              </div>

              <div className="progress-editor">
                <label>
                  Last solved day
                  <input
                    type="number"
                    min={0}
                    max={24}
                    value={progressDay[u.id] ?? u.lastSolvedDay ?? 0}
                    onChange={(e) => setDay(u.id, Number(e.target.value))}
                  />
                </label>
                <button disabled={busyUserId === u.id} onClick={() => handleProgressUpdate(u.id)}>
                  Save progress
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="metric-card">
      <div className="muted uppercase">{label}</div>
      <div className="metric-value">{value}</div>
      {hint ? <div className="muted small">{hint}</div> : null}
    </div>
  );
}

function CoverageBar({
  stats,
}: {
  stats: { totalDays: number; completeDays: number; partialDays: number; issueDays: number; emptyDays: number };
}) {
  const total = stats.totalDays || 24;
  const coveragePct = Math.min(100, Math.max(0, ((total - stats.emptyDays) / total) * 100));
  const partialPct = Math.min(100, Math.max(0, ((stats.partialDays + stats.completeDays) / total) * 100));
  const completePct = Math.min(100, Math.max(0, (stats.completeDays / total) * 100));
  return (
    <div className="coverage-bar">
      <div className="coverage-track" />
      <div className="coverage-head head-coverage" style={{ width: `${coveragePct}%` }} />
      <div className="coverage-head head-partial" style={{ width: `${partialPct}%` }} />
      <div className="coverage-head head-complete" style={{ width: `${completePct}%` }} />
    </div>
  );
}

function Legend({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="legend-chip">
      <span className="legend-dot" style={{ background: color }} />
      {label}: {value}
    </span>
  );
}
