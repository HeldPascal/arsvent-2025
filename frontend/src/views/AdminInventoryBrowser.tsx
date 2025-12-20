import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ContentDiagnostics, Locale } from "../types";
import { fetchAdminContentDiagnostics } from "../services/api";
import { appendWebpFormat } from "../utils/assets";

export default function AdminInventoryBrowser() {
  const [diag, setDiag] = useState<ContentDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<Locale>("en");
  const backendBase = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ?? "";

  const rarityColor = (rarity: string) => {
    const normalized = rarity.toLowerCase();
    if (normalized.includes("legendary") || normalized.includes("mythic")) return "#f97316";
    if (normalized.includes("epic")) return "#a855f7";
    if (normalized.includes("rare")) return "#22c55e";
    if (normalized.includes("uncommon")) return "#0ea5e9";
    return "#9ca3af"; // common/default
  };

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

  const localeData = useMemo(
    () => diag?.inventory.locales.find((l) => l.locale === locale),
    [diag, locale],
  );

  const resolveAssetUrl = (token?: string) => {
    if (!token) return "";
    return appendWebpFormat(`${backendBase}/content-asset/${token}`);
  };

  return (
    <div className="stack">
      <div className="panel">
        <header className="panel-header">
          <div>
            <div className="eyebrow">Admin</div>
            <h2>Inventory preview</h2>
            <p className="muted">Browse inventory items per locale.</p>
          </div>
          <div className="panel-actions">
            <div className="segmented">
              {(["en", "de"] as Locale[]).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className={locale === loc ? "active" : ""}
                  onClick={() => setLocale(loc)}
                >
                  {loc.toUpperCase()}
                </button>
              ))}
            </div>
            <Link className="ghost nav-link" to="/admin/content">
              Back to content
            </Link>
          </div>
        </header>
        {loading && <div className="muted">Loading…</div>}
        {error && <div className="error">{error}</div>}
        {localeData && (
          <div className="inventory-grid" style={{ marginTop: 8 }}>
            {localeData.itemList?.map((item) => (
              <div key={item.id} className="inventory-card">
                <div className="muted uppercase small">{item.id}</div>
                <div className="metric-value">{item.title}</div>
                <div className="muted small">{item.description}</div>
                <div style={{ marginTop: 6 }}>
                  <img
                    src={resolveAssetUrl(item.imageToken)}
                    alt={item.title}
                    style={{ width: "100%", borderRadius: 8, background: "var(--panel-contrast)" }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="muted small">Image token: {item.imageToken ?? "missing"}</div>
                </div>
                <div className="muted small">
                  Rarity:{" "}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: rarityColor(item.rarity),
                        border: "1px solid var(--line)",
                        display: "inline-block",
                      }}
                    />
                    {item.rarity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
