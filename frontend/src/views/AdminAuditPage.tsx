import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { AdminAuditEntry, AdminUserSummary, User } from "../types";
import { deleteAuditEntry, fetchAdminUsers, fetchAudit } from "../services/api";

interface Props {
  user: User;
}

export default function AdminAuditPage({}: Props) {
  const [entries, setEntries] = useState<AdminAuditEntry[]>([]);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAudit(200), fetchAdminUsers()])
      .then(([logs, us]) => {
        setEntries(logs ?? []);
        setUsers(us);
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const userLookup = useMemo(
    () =>
      users.reduce<Record<string, AdminUserSummary>>((acc, u) => {
        acc[u.id] = u;
        return acc;
      }, {}),
    [users],
  );

  const actorLabel = (actorId?: string | null) => {
    if (!actorId) return "unknown";
    const u = userLookup[actorId];
    return u ? `${u.username} (${actorId})` : actorId;
  };

  const targetLabel = (targetId?: string | null) => {
    if (!targetId) return null;
    const u = userLookup[targetId];
    return u ? `${u.username} (${targetId})` : targetId;
  };

  const handleDelete = async (id: number) => {
    await deleteAuditEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="panel">
      <header className="panel-header">
        <div>
          <div className="eyebrow">Audit</div>
          <h2>Admin Audit Log</h2>
          <p className="muted">Full list of admin actions (latest 200). Entries can be removed in development.</p>
        </div>
        <Link className="ghost nav-link" to="/admin">
          Back to admin
        </Link>
      </header>

      {loading && <div className="muted">Loading…</div>}
      {error && <div className="error">{error}</div>}

      <ul className="plain-list audit-scroll">
        {entries.map((entry) => {
          const details = (() => {
            try {
              return entry.details ? JSON.parse(entry.details) : null;
            } catch {
              return entry.details;
            }
          })();
          const targetHint = details && typeof details === "object" && "targetId" in (details as any) ? targetLabel((details as any).targetId) : null;
          return (
            <li key={entry.id} className="list-row">
              <div className="list-title">
                {entry.action} <span className="muted">· {actorLabel(entry.actorId)} · {new Date(entry.createdAt).toLocaleString()}</span>
              </div>
              {entry.details ? (
                <div className="muted small">
                  <span title={entry.details}>{entry.details}</span>
                  {targetHint ? (
                    <span className="muted small" style={{ display: "block" }}>
                      Target: {targetHint}
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="panel-actions">
                <button className="ghost" onClick={() => handleDelete(entry.id)}>
                  Delete
                </button>
              </div>
            </li>
          );
        })}
        {!loading && entries.length === 0 && <li className="muted">No audit entries.</li>}
      </ul>
    </div>
  );
}
