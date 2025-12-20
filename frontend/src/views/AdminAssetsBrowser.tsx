import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ContentDiagnostics } from "../types";
import { fetchAdminContentDiagnostics } from "../services/api";
import { appendWebpFormat } from "../utils/assets";

export default function AdminAssetsBrowser() {
  const [diag, setDiag] = useState<ContentDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backendBase = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ?? "";
  const resolveAssetUrl = (token: string) => appendWebpFormat(`${backendBase}/content-asset/${token}`);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        setDiag(await fetchAdminContentDiagnostics());
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const assets = diag?.assets.list ?? [];

  return (
    <div className="stack">
      <div className="panel">
        <header className="panel-header">
          <div>
            <div className="eyebrow">Admin</div>
            <h2>Asset browser</h2>
            <p className="muted">All content assets with size and reference state.</p>
          </div>
          <div className="panel-actions">
            <Link className="ghost nav-link" to="/admin/content">
              Back to content
            </Link>
          </div>
        </header>
        {loading && <div className="muted">Loading…</div>}
        {error && <div className="error">{error}</div>}
        {diag && (
          <div
            className="inventory-grid"
            style={{ marginTop: 8, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
          >
            {assets.map((asset) => (
              <div key={asset.path} className="inventory-card">
                <div className="muted uppercase small">{asset.referenced ? "Referenced" : "Unused"}</div>
                <div className="metric-value" style={{ wordBreak: "break-all" }}>
                  {asset.path}
                </div>
                <div className="muted small">
                  {(asset.size / 1024).toFixed(1)} KB
                  {asset.hash ? ` · hash: ${asset.hash.slice(0, 12)}…` : ""}
                </div>
                <div className="muted small">Token: {asset.token}</div>
                <div style={{ marginTop: 8 }}>
                  <img
                    src={resolveAssetUrl(asset.token)}
                    alt={asset.path}
                    style={{ width: "100%", borderRadius: 8, background: "var(--panel-contrast)" }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
