import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { AdminDraw, PrizePool } from "../types";
import { createAdminDraw, fetchAdminDraws, fetchAdminPrizes } from "../services/api";

const poolOptions: PrizePool[] = ["MAIN", "VETERAN"];

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState<AdminDraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ prizeId: string | null; message: string }>>([]);
  const [pool, setPool] = useState<PrizePool>("MAIN");
  const [seed, setSeed] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [drawData, prizeStore] = await Promise.all([fetchAdminDraws(), fetchAdminPrizes()]);
      setDraws(drawData.draws);
      setValidationErrors(prizeStore.validationErrors ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      await createAdminDraw({ pool, seed: seed.trim() || null });
      setSeed("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="panel stack">
      <header className="panel-header">
        <div>
          <div className="eyebrow">Admin</div>
          <h2>Prize draws</h2>
          <p className="muted">Create, review, and publish prize draws.</p>
        </div>
        <Link className="ghost nav-link" to="/admin">
          Back to admin
        </Link>
      </header>

      {error && <p className="error">{error}</p>}
      {validationErrors.length > 0 && (
        <div className="panel warning-panel">
          <div className="warning-title">Prize configuration issues</div>
          <div className="muted small">Resolve these before creating a draw.</div>
          <div className="warning-stack">
            {validationErrors.map((entry) => (
              <div key={`${entry.prizeId ?? "global"}:${entry.message}`} className="warning-card">
                {entry.message}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="draws-toolbar">
        <label className="field">
          <span className="muted small">Pool</span>
          <select value={pool} onChange={(event) => setPool(event.target.value as PrizePool)}>
            {poolOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="muted small">Seed (optional)</span>
          <input
            type="text"
            value={seed}
            onChange={(event) => setSeed(event.target.value)}
            placeholder="Leave empty for random seed"
          />
        </label>
        <button
          className="primary"
          type="button"
          onClick={handleCreate}
          disabled={creating || validationErrors.length > 0}
        >
          {creating ? "Creating…" : "Create draft draw"}
        </button>
      </div>

      {loading ? (
        <p className="muted">Loading draws…</p>
      ) : draws.length === 0 ? (
        <p className="muted">No draws yet.</p>
      ) : (
        <div className="draws-list">
          {draws.map((draw) => (
            <div key={draw.id} className="panel subpanel draw-row">
              <div className="draw-row-main">
                <div className={`pill ${draw.status === "PUBLISHED" ? "success" : "muted"}`}>
                  {draw.status.toLowerCase()}
                </div>
                <div className="draw-row-meta">
                  <strong>{draw.pool}</strong>
                  <span className="muted small">
                    {draw.status === "DRAFT"
                      ? `Drafted ${new Date(draw.updatedAt).toLocaleString()}`
                      : `Created ${new Date(draw.createdAt).toLocaleString()}`}
                  </span>
                </div>
                <div className="draw-row-stats muted small">
                  {draw.assignedCount}/{draw.eligibleCount} assigned
                </div>
              </div>
              <Link className="ghost" to={`/admin/draws/${draw.id}`}>
                Review
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
