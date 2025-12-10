import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AdminAuditEntry, AdminOverview, AdminUserSummary, Mode, User } from "../types";
import {
  adminDeleteUser,
  adminRevokeSessions,
  adminSetAdmin,
  adminUnlockNext,
  adminUnlockSet,
  adminUpdateMode,
  adminUpdateProgress,
  deleteAuditEntry,
  fetchAdminOverview,
  fetchAdminUsers,
  fetchAudit,
} from "../services/api";
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
  const navigate = useNavigate();
  const contentLimit = overview?.diagnostics.contentDayCount ?? 24;

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

  useEffect(() => {
    loadData(true);
    loadAudit(auditLimit);
  }, [loadData, loadAudit]);

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
  }, [auditLimit, loadAudit, loadData]);

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
    setUnlocking(true);
    try {
      const safeDay = Math.min(Math.max(unlockedInput, 0), contentLimit);
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
                {overview.diagnostics.maxDay}
              </div>
              <div className="progress-actions">
                <button
                  className="primary"
                  type="button"
                  onClick={handleUnlockNext}
                  disabled={unlocking || overview.diagnostics.availableDay >= overview.diagnostics.contentDayCount}
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
                <button className="ghost" type="button" onClick={handleUnlockSet} disabled={unlocking}>
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
              <StatBar
                label="Content coverage"
                total={overview.diagnostics.maxDay}
                segments={[
                  { label: "Has content", value: overview.diagnostics.contentDayCount, color: "#4ade80" },
                  {
                    label: "No content",
                    value: Math.max(overview.diagnostics.maxDay - overview.diagnostics.contentDayCount, 0),
                    color: "#475569",
                  },
                ]}
              />
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
