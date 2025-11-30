import { useCallback, useEffect, useState } from "react";
import type { AdminOverview, AdminUserSummary, Mode, User } from "../types";
import {
  adminDeleteUser,
  adminRevokeSessions,
  adminSetAdmin,
  adminUpdateMode,
  adminUpdateProgress,
  fetchAdminOverview,
  fetchAdminUsers,
} from "../services/api";
import StatBar from "./components/StatBar";
import CollapsibleHistogram from "./components/CollapsibleHistogram";

interface Props {
  user: User;
}

export default function AdminPage({ user }: Props) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [progressDay, setProgressDay] = useState<Record<string, number>>({});

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

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (!cancelled) loadData(false);
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
  }, [loadData]);

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
            <StatBar
              label="Available days"
              total={overview.diagnostics.maxDay}
              segments={[
                { label: "Unlocked", value: overview.diagnostics.availableDay, color: "#8b5cf6" },
                { label: "Locked", value: Math.max(overview.diagnostics.maxDay - overview.diagnostics.availableDay, 0), color: "#334155" },
              ]}
            />
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
                  { label: "VET", value: overview.stats.vetUsers, color: "#f59e0b" },
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

          <div className="metrics-grid">
            <MetricCard label="Users" value={overview.stats.totalUsers} hint={`${overview.stats.adminUsers} admins`} />
            <MetricCard
              label="Difficulty split"
              value={`${overview.stats.vetUsers} VET / ${overview.stats.normalUsers} NORMAL`}
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
                <button disabled={busyUserId === u.id} onClick={() => handleModeChange(u.id, "VET")}>
                  Set VET
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
