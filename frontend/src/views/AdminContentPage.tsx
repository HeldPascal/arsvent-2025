import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type {
  AdminContentDayDetail,
  ContentDiagnostics,
  ContentVariantDiagnostics,
  ContentVariantStatus,
  IssueSeverity,
  Locale,
  Mode,
} from "../types";
import { fetchAdminContentDay, fetchAdminContentDiagnostics } from "../services/api";
import { appendWebpFormat } from "../utils/assets";

const variants: Array<{ locale: Locale; mode: Mode; label: string }> = [
  { locale: "en", mode: "NORMAL", label: "EN · NORMAL" },
  { locale: "en", mode: "VETERAN", label: "EN · VETERAN" },
  { locale: "de", mode: "NORMAL", label: "DE · NORMAL" },
  { locale: "de", mode: "VETERAN", label: "DE · VETERAN" },
];

type MatrixStatus = ContentVariantStatus | "info";

const statusColor = (status: MatrixStatus) => {
  switch (status) {
    case "ok":
      return "#475569"; // slate
    case "warning":
      return "#f59e0b"; // amber (matches subpanel)
    case "error":
      return "#f43f5e"; // red (matches subpanel)
    case "info":
    default:
      return "#0ea5e9"; // blue
  }
};

const severityTone = (severity: IssueSeverity) => {
  switch (severity) {
    case "error":
      return "#f43f5e";
    case "warning":
      return "#f59e0b";
    default:
      return "#0ea5e9";
  }
};

export default function AdminContentPage() {
  const [diagnostics, setDiagnostics] = useState<ContentDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ day: number; locale: Locale; mode: Mode } | null>(() => {
    try {
      const raw = localStorage.getItem("admin-content-selected");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { day?: number; locale?: Locale; mode?: Mode };
      if (!parsed || typeof parsed.day !== "number" || !parsed.locale || !parsed.mode) return null;
      return { day: parsed.day, locale: parsed.locale, mode: parsed.mode };
    } catch {
      return null;
    }
  });
  const [detail, setDetail] = useState<AdminContentDayDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedBlockKey, setSelectedBlockKey] = useState<string | null>(null);
  const backendBase =
    import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ||
    (window.location.origin.includes("localhost:5173") ? "http://localhost:4000" : window.location.origin);
  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const diag = await fetchAdminContentDiagnostics();
      setDiagnostics(diag);
      if (selected) {
        const exists = diag.variants.some(
          (v) => v.day === selected.day && v.locale === selected.locale && v.mode === selected.mode,
        );
        if (!exists) {
          const nextVariant = diag.variants.find((v) => v.status !== "missing") ?? diag.variants[0];
          if (nextVariant) {
            setSelected({ day: nextVariant.day, locale: nextVariant.locale, mode: nextVariant.mode });
          }
        }
      } else {
        const nextVariant = diag.variants.find((v) => v.status !== "missing") ?? diag.variants[0];
        if (nextVariant) {
          setSelected({ day: nextVariant.day, locale: nextVariant.locale, mode: nextVariant.mode });
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    loadDiagnostics();
  }, [loadDiagnostics]);

  const loadDetail = useCallback(
    async (day: number, locale: Locale, mode: Mode) => {
      setDetailError(null);
      setDetailLoading(true);
      try {
        const data = await fetchAdminContentDay(day, locale, mode);
        setDetail(data);
        if (data.blocks.length > 0) {
          const firstKey = data.blocks[0].id ?? `${data.blocks[0].kind}-0`;
          setSelectedBlockKey(firstKey);
        }
      } catch (err) {
        setDetail(null);
        setDetailError((err as Error).message);
      } finally {
        setDetailLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (selected) {
      loadDetail(selected.day, selected.locale, selected.mode);
    }
  }, [selected, loadDetail]);

  useEffect(() => {
    if (!selected) return;
    try {
      localStorage.setItem("admin-content-selected", JSON.stringify(selected));
    } catch {
      /* ignore */
    }
  }, [selected]);

  const dayLookup = useMemo(() => {
    const map = new Map<string, ContentVariantDiagnostics>();
    diagnostics?.variants.forEach((v) => {
      map.set(`${v.day}-${v.locale}-${v.mode}`, v);
    });
    return map;
  }, [diagnostics]);

  const variantIssueMap = useMemo(() => {
    const map = new Map<
      string,
      { errors: number; warnings: number; info: number; messages: string[] }
    >();
    diagnostics?.issues.forEach((issue) => {
      const { day, locale, mode } = issue.details ?? {};
      if (!day || !locale || !mode) return;
      const key = `${day}-${locale}-${mode}`;
      const entry = map.get(key) ?? { errors: 0, warnings: 0, info: 0, messages: [] };
      if (issue.severity === "error") entry.errors += 1;
      else if (issue.severity === "warning") entry.warnings += 1;
      else entry.info += 1;
      entry.messages.push(issue.message);
      map.set(key, entry);
    });
    diagnostics?.variants.forEach((variant) => {
      if (!variant.issues?.length) return;
      const key = `${variant.day}-${variant.locale}-${variant.mode}`;
      const entry = map.get(key) ?? { errors: 0, warnings: 0, info: 0, messages: [] };
      entry.messages.push(...variant.issues);
      if (variant.status === "error") entry.errors = Math.max(entry.errors, 1);
      if (variant.status === "warning") entry.warnings = Math.max(entry.warnings, 1);
      map.set(key, entry);
    });
    return map;
  }, [diagnostics]);

  const describeIssueContext = useCallback((issue: ContentDiagnostics["issues"][number]) => {
    const details = issue.details ?? {};
    const bits: string[] = [];
    if (details.day) bits.push(`Day ${details.day}`);
    if (details.locale) bits.push(String(details.locale).toUpperCase());
    if (details.mode) bits.push(String(details.mode));
    if (details.contentId) bits.push(`ID ${details.contentId}`);
    if (details.inventoryId || details.itemId) bits.push(`Item ${details.inventoryId ?? details.itemId}`);
    if (details.assetPath) bits.push(`Asset ${details.assetPath}`);
    if (details.filePath || details.inventoryFile) bits.push(`File ${(details.filePath ?? details.inventoryFile) as string}`);
    return bits.join(" · ");
  }, []);

  const rewriteAssets = useCallback(
    (html: string | undefined) => {
      if (!html) return "";
      if (!backendBase) return html;
      let out = html.replace(
        /src=(["'])(\/assets\/[^"']+)\1/gi,
        (_m, quote, path) => `src=${quote}${backendBase}/content-${path.slice(1)}${quote}`,
      );
      out = out.replace(
        /src=(["'])(\/content-asset\/[^"']+)\1/gi,
        (_m, quote, path) => `src=${quote}${appendWebpFormat(`${backendBase}${path}`)}${quote}`,
      );
      return out;
    },
    [backendBase],
  );

  const resolveAsset = useCallback(
    (src?: string) => {
      if (!src) return "";
      if (!backendBase) return src;
      if (src.startsWith("/assets/")) return `${backendBase}/content-${src.slice(1)}`;
      if (src.startsWith("/content-asset/")) return appendWebpFormat(`${backendBase}${src}`);
      return src;
    },
    [backendBase],
  );

  const assetDuplicates = useMemo(
    () => (diagnostics?.issues ?? []).filter((i) => i.code === "ASSET_DUPLICATE_HASH").length,
    [diagnostics?.issues],
  );

  return (
    <div className="stack">
      <div className="panel">
        <header className="panel-header">
          <div>
            <div className="eyebrow">Admin</div>
            <h2>Content coverage</h2>
            <p className="muted">Matrix of day variants, loader issues, and quick debug view.</p>
          </div>
          <div className="panel-actions">
            <button className="ghost nav-link" type="button" onClick={loadDiagnostics} disabled={loading}>
              Refresh
            </button>
            <Link className="ghost nav-link" to="/admin">
              Back
            </Link>
          </div>
        </header>
        {error && <p className="error">{error}</p>}
        {loading && <p className="muted">Loading diagnostics…</p>}

        {diagnostics && (
          <>
            <div className="panel">
              <header className="panel-header">
                <div>
                  <h3>Overview</h3>
                  <div className="muted">Filter and inspect content diagnostics.</div>
                </div>
              </header>
              <IssueListSubpanel
                title="Issues"
                issues={diagnostics.issues}
                defaultOpen={false}
                enableFilter
                totalDays={diagnostics.stats.totalDays}
                describeContext={describeIssueContext}
              >
                {diagnostics.indexWarnings.length > 0 && (
                  <div className="muted small" style={{ marginBottom: 8 }}>
                    <div className="muted uppercase small">Index warnings</div>
                    <ul style={{ margin: 6, paddingLeft: 18 }}>
                      {diagnostics.indexWarnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </IssueListSubpanel>
            </div>

            <div className="panel" style={{ marginTop: 12 }}>
              <header className="panel-header">
                <div>
                  <h3>Assets</h3>
                  <p className="muted">Asset paths referenced by content and inventory.</p>
                </div>
              </header>
              <div className="inventory-grid" style={{ marginBottom: 8 }}>
                <div className="inventory-card">
                  <div className="muted uppercase small">Totals</div>
                  <div className="metric-value">{diagnostics.assets.total}</div>
                  <div className="muted small">Total assets</div>
                </div>
                <div className="inventory-card">
                  <div className="muted uppercase small">Referenced</div>
                  <div className="metric-value">{diagnostics.assets.referenced}</div>
                  <div className="muted small">Used in content/inventory</div>
                </div>
                <div className="inventory-card">
                  <div className="muted uppercase small">Unused</div>
                  <div className="metric-value">{diagnostics.assets.unused}</div>
                  <div className="muted small">Not referenced</div>
                </div>
                <div className="inventory-card">
                  <div className="muted uppercase small">Duplicate hashes</div>
                  <div className="metric-value">{assetDuplicates}</div>
                  <div className="muted small">Same content across files</div>
                </div>
              </div>
              <IssueListSubpanel
                title="Asset issues"
                issues={diagnostics.issues}
                forcedTokens={["source:asset"]}
                defaultOpen={false}
                enableFilter
                describeContext={(issue) => (issue.details?.assetPath ? String(issue.details.assetPath) : "")}
              />
              <div style={{ marginTop: 8 }}>
                <Link className="ghost nav-link" to="/admin/content/assets">
                  Open asset browser
                </Link>
              </div>
            </div>

            <div className="panel" style={{ marginTop: 12 }}>
              <header className="panel-header">
                <div>
                  <h3>Inventory</h3>
                  <p className="muted">Per-locale inventory state and consistency checks.</p>
                </div>
              </header>
              <div className="inventory-grid">
                <div className="inventory-card" style={{ gridColumn: "1 / -1" }}>
                  <div className="muted uppercase small">Max items across locales</div>
                  <div className="metric-value">
                    {Math.max(...diagnostics.inventory.locales.map((loc) => loc.items))}
                  </div>
                  <div className="muted small">Ensures item counts stay aligned between locales</div>
                </div>
              </div>
              <IssueListSubpanel
                title="Inventory issues"
                issues={diagnostics.issues}
                forcedTokens={["source:inventory"]}
                defaultOpen={false}
                enableFilter
                describeContext={(issue) => (issue.details?.locale ? String(issue.details.locale).toUpperCase() : "")}
              />
              <IssueListSubpanel
                title="Consistency issues"
                issues={diagnostics.issues}
                forcedTokens={["source:consistency"]}
                defaultOpen={false}
                enableFilter
                describeContext={(issue) => (issue.details?.locale ? String(issue.details.locale).toUpperCase() : "")}
              />
              <div style={{ marginTop: 8 }}>
                <Link className="ghost nav-link" to="/admin/content/inventory">
                  Open inventory browser
                </Link>
              </div>
            </div>

            <div className="panel" style={{ marginTop: 12 }}>
              <header className="panel-header">
                <div>
                  <h3>Content matrix</h3>
                  <p className="muted">Variants by day with availability and issues.</p>
                </div>
                <div className="matrix-legend">
                  <LegendChip color={statusColor("ok")} label="OK" />
                  <LegendChip color={statusColor("warning")} label="Warnings" />
                  <LegendChip color={statusColor("error")} label="Errors" />
                  <LegendChip color={statusColor("info")} label="Info" />
                </div>
              </header>
              <div className="content-matrix">
                <div className="matrix-grid matrix-header">
                  <div className="matrix-cell header">Day</div>
                  {variants.map((v) => (
                    <div key={`${v.locale}-${v.mode}`} className="matrix-cell header">
                      {v.label}
                    </div>
                  ))}
                </div>
                <div className="matrix-grid">
                  {diagnostics.days.map((dayRow) => (
                    <MatrixRow
                      key={dayRow.day}
                      day={dayRow.day}
                      dayLookup={dayLookup}
                      variantIssueMap={variantIssueMap}
                      selected={selected}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="panel" style={{ marginTop: 12 }}>
              <header className="panel-header">
                <div>
                  <h3>Variant issues</h3>
                  <p className="muted">All diagnostics for the currently selected variant.</p>
                </div>
              </header>
              {selected && diagnostics ? (
                <IssueListSubpanel
                  title={`Day ${selected.day} · ${selected.locale.toUpperCase()} · ${selected.mode}`}
                  issues={diagnostics.issues}
                  forcedTokens={[
                    `day:${selected.day}`,
                    `locale:${selected.locale}`,
                    `mode:${selected.mode.toLowerCase()}`,
                  ]}
                  defaultOpen
                  enableFilter
                  describeContext={describeIssueContext}
                />
              ) : (
                <div className="muted small">Select a variant to view issues.</div>
              )}
            </div>

            <div className="panel" style={{ marginTop: 12 }}>
              <header className="panel-header">
                <div>
                  <h3>Variant debug</h3>
                  <p className="muted">Loads the selected variant with hidden blocks for quick inspection.</p>
                </div>
                {selected && (
                  <div className="pill">
                    Day {selected.day} · {selected.locale.toUpperCase()} · {selected.mode}
                  </div>
                )}
              </header>
              {detailLoading && <p className="muted">Loading variant…</p>}
              {detailError && <p className="error">{detailError}</p>}
              {!detail && !detailLoading && !detailError && (
                <p className="muted small">Select a variant to view details.</p>
              )}
              {detail && (
                <div className="debug-panel">
                  <div className="muted small">File: {detail.filePath ?? "unknown"}</div>
                  <h4 style={{ marginBottom: 6 }}>{detail.title}</h4>
                  <div className="debug-blocks">
                    {detail.blocks.map((block, idx) => {
                      const key = block.id ?? `${block.kind}-${idx}`;
                      const isSelected = selectedBlockKey === key;
                      const visibleTone = block.visible ? "rgba(125, 211, 252, 0.12)" : "rgba(239, 68, 68, 0.18)";
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`debug-block selectable${isSelected ? " selected" : ""}`}
                          onClick={() => setSelectedBlockKey(key)}
                          style={{ background: visibleTone }}
                        >
                          <div className="muted uppercase small" style={{ textAlign: "center" }}>
                            {block.kind === "puzzle" ? "PUZZLE" : block.kind.toUpperCase()}
                          </div>
                          <div
                            className="muted small"
                            style={{
                              display: "grid",
                              gridTemplateColumns: "96px 1fr",
                              columnGap: 8,
                              rowGap: 4,
                              marginTop: 8,
                              textAlign: "left",
                            }}
                          >
                            {block.title ? (
                              <>
                                <span className="muted" style={{ textAlign: "right" }}>
                                  Title
                                </span>
                                <span className="debug-title">{block.title}</span>
                              </>
                            ) : null}
                            {block.kind === "puzzle" ? (
                              <>
                                <span className="muted" style={{ textAlign: "right" }}>
                                  Type
                                </span>
                                <span>{block.type}</span>
                                <span className="muted" style={{ textAlign: "right" }}>
                                  Solved
                                </span>
                                <span>{block.solved ? "Yes" : "No"}</span>
                              </>
                            ) : null}
                            {block.kind === "reward" && block.item ? (
                              <>
                                <span className="muted" style={{ textAlign: "right" }}>
                                  Reward
                                </span>
                                <span>{block.item.title}</span>
                              </>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="panel subpanel" style={{ marginTop: 12 }}>
                    <header className="panel-header">
                      <div>
                        <h3>Block preview</h3>
                        <div className="muted">Renders the selected block as on the day page.</div>
                      </div>
                    </header>
                    {selectedBlockKey ? (
                      <BlockPreview
                        block={detail.blocks.find((b, idx) => (b.id ?? `${b.kind}-${idx}`) === selectedBlockKey)}
                        rewriteAssets={rewriteAssets}
                        resolveAsset={resolveAsset}
                      />
                    ) : (
                      <div className="muted small">Select a block to preview.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span className="legend-chip">
      <span className="legend-dot" style={{ background: color }} />
      {label}
    </span>
  );
}

const normalizeModeFilter = (value: string) => {
  const lower = value.toLowerCase().trim();
  if (lower.startsWith("vet")) return "veteran";
  if (lower.startsWith("norm")) return "normal";
  return lower;
};

type IssueListSubpanelProps = {
  title: string;
  description?: string;
  issues: ContentDiagnostics["issues"];
  defaultOpen?: boolean;
  enableFilter?: boolean;
  totalDays?: number;
  describeContext?: (issue: ContentDiagnostics["issues"][number]) => string;
  forcedTokens?: string[];
};

function filterIssues(issues: ContentDiagnostics["issues"], tokens: string[]) {
  const normalizedTokens = tokens.map((t) => t.trim()).filter(Boolean);
  if (normalizedTokens.length === 0) return issues;
  return issues.filter((issue) => {
    const details = issue.details ?? {};
    const relatedContexts = [
      details,
      (details as { first?: Record<string, unknown> }).first ?? {},
      (details as { second?: Record<string, unknown> }).second ?? {},
    ];
    return normalizedTokens.every((token) => {
      if (!token) return true;
      const [maybeKey, ...restRaw] = token.split(":");
      const key = restRaw.length > 0 ? maybeKey.toLowerCase().trim() : null;
      const value = restRaw.length > 0 ? restRaw.join(":").trim() : token.trim();
      if (key && value) {
        const lowerVal = value.toLowerCase();
        if (key === "type") {
          return (
            issue.code.toLowerCase().includes(lowerVal) ||
            issue.source.toLowerCase().includes(lowerVal) ||
            String(details.type ?? "").toLowerCase().includes(lowerVal)
          );
        }
        if (key === "severity") return issue.severity.toLowerCase() === lowerVal;
        if (key === "source") return issue.source.toLowerCase() === lowerVal;
        if (key === "day") {
          return relatedContexts.some((ctx) => Number((ctx as { day?: unknown }).day) === Number(value));
        }
        if (key === "locale") {
          return relatedContexts.some(
            (ctx) => String((ctx as { locale?: unknown }).locale ?? "").toLowerCase() === lowerVal,
          );
        }
        if (key === "mode") {
          const normalizedValue = normalizeModeFilter(lowerVal);
          return relatedContexts.some((ctx) => normalizeModeFilter(String((ctx as { mode?: unknown }).mode ?? "")) === normalizedValue);
        }
        if (key === "id" || key === "item") {
          return String(details.itemId ?? details.inventoryId ?? details.contentId ?? "").toLowerCase().includes(lowerVal);
        }
        if (key === "file" || key === "asset") {
          return [details.assetPath, details.filePath, details.inventoryFile]
            .filter((v): v is string => typeof v === "string")
            .some((v) => v.toLowerCase().includes(lowerVal));
        }
        if (key === "issue") {
          return issue.message.toLowerCase().includes(lowerVal);
        }
      }
      const haystack = `${issue.code} ${issue.message} ${JSON.stringify(details)}`.toLowerCase();
      return haystack.includes(value.toLowerCase());
    });
  });
}

function IssueListSubpanel({
  title,
  description,
  issues,
  defaultOpen = false,
  enableFilter = false,
  totalDays,
  describeContext,
  forcedTokens,
}: IssueListSubpanelProps & { children?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const [tokens, setTokens] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [suggestActive, setSuggestActive] = useState(-1);
  const [inputFocused, setInputFocused] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const allTokens = useMemo(() => [...(forcedTokens ?? []), ...tokens], [forcedTokens, tokens]);
  const filtered = useMemo(() => filterIssues(issues, allTokens), [issues, allTokens]);

  const summary = useMemo(() => {
    const errors = filtered.filter((i) => i.severity === "error").length;
    const warnings = filtered.filter((i) => i.severity === "warning").length;
    const info = filtered.filter((i) => i.severity === "info").length;
    const severity: IssueSeverity | null = errors > 0 ? "error" : warnings > 0 ? "warning" : info > 0 ? "info" : null;
    return { total: filtered.length, errors, warnings, info, severity };
  }, [filtered]);

  const computeSuggestions = useCallback(
    (draftValue?: string) => {
      const draftText = (draftValue ?? draft).trim();
      const hasColon = draftText.includes(":");
      if (!hasColon) {
        return ["type", "severity", "source", "day", "locale", "mode", "id", "file", "title", "issue"].filter((opt) =>
          opt.toLowerCase().startsWith(draftText.toLowerCase()),
        );
      }
      const [rawKey, ...rest] = draftText.split(":");
      const key = rawKey.trim().toLowerCase();
      const valuePrefix = rest.join(":").trim().toLowerCase();
      if (!key) return [];
      if (key === "type") {
        const opts = Array.from(new Set(issues.map((i) => i.code.toLowerCase())));
        return opts.filter((opt) => opt.startsWith(valuePrefix));
      }
      if (key === "severity") {
        return ["info", "warning", "error"].filter((opt) => opt.startsWith(valuePrefix));
      }
      if (key === "source") {
        return ["inventory", "asset", "content", "consistency", "link"].filter((opt) => opt.startsWith(valuePrefix));
      }
      if (key === "locale") {
        return ["en", "de"].filter((opt) => opt.startsWith(valuePrefix));
      }
      if (key === "mode") {
        return ["normal", "veteran"].filter((opt) => opt.startsWith(valuePrefix));
      }
      if (key === "day") {
        const opts = Array.from({ length: totalDays ?? 24 }, (_, i) => String(i + 1));
        return opts.filter((opt) => opt.startsWith(valuePrefix));
      }
      return [];
    },
    [draft, issues, totalDays],
  );

  const addToken = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setTokens((prev) => [...prev, trimmed]);
    setDraft("");
    setSuggestActive(-1);
  };

  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <header className="panel-header" style={{ marginBottom: 8 }}>
        <div>
          <h3>{title}</h3>
          {description ? <div className="muted">{description}</div> : null}
        </div>
        <button className="ghost nav-link" type="button" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Show"}
        </button>
      </header>
      <div
        className={`muted small assets-summary${summary.severity ? ` severity-${summary.severity}` : ""}`}
        style={{
          marginBottom: 8,
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          borderColor: summary.severity ? severityTone(summary.severity) : undefined,
          boxShadow: summary.severity ? `0 0 0 1px ${severityTone(summary.severity)}33` : "none",
        }}
      >
        <span style={{ fontWeight: 700 }}>Total: {summary.total}</span>
        <span>Errors: {summary.errors}</span>
        <span>Warnings: {summary.warnings}</span>
        <span>Info: {summary.info}</span>
        {summary.severity && (
          <span className="pill" style={{ background: severityTone(summary.severity), color: "#0b1224" }}>
            {summary.severity.toUpperCase()} present
          </span>
        )}
      </div>
      {open && (
        <>
          {enableFilter && (
            <div className="issues-filter">
              <div className="muted small">
                Type to add tags; press comma/Enter to confirm. Use key:value (e.g., type:warning, day:12). No key searches all fields.
              </div>
              <div className="tag-input">
                {(forcedTokens ?? []).map((token, idx) => {
                  const [rawKey, ...rest] = token.split(":");
                  const keyPart = rawKey.trim();
                  const valuePart = rest.join(":").trim();
                  const hasKey = rest.length > 0 && keyPart;
                  return (
                    <span key={`forced-${token}-${idx}`} className="tag-chip locked">
                      {hasKey ? (
                        <>
                          <span className="tag-key">{keyPart}</span>
                          <span className="tag-sep">·</span>
                          <span className="tag-value">{valuePart}</span>
                        </>
                      ) : (
                        <span className="tag-value">{token}</span>
                      )}
                      <span className="tag-lock">🔒</span>
                    </span>
                  );
                })}
                {tokens.map((token, idx) => {
                  const [rawKey, ...rest] = token.split(":");
                  const keyPart = rawKey.trim();
                  const valuePart = rest.join(":").trim();
                  const hasKey = rest.length > 0 && keyPart;
                  return (
                    <span key={`${token}-${idx}`} className="tag-chip">
                      {hasKey ? (
                        <>
                          <span className="tag-key">{keyPart}</span>
                          <span className="tag-sep">·</span>
                          <span className="tag-value">{valuePart}</span>
                        </>
                      ) : (
                        <span className="tag-value">{token}</span>
                      )}
                      <button type="button" onClick={() => setTokens((prev) => prev.filter((_, i) => i !== idx))}>
                        ×
                      </button>
                    </span>
                  );
                })}
                <input
                  type="text"
                  placeholder="Add filter… (comma/Enter to confirm)"
                  value={draft}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  onChange={(e) => {
                    const next = e.target.value;
                    setDraft(next);
                    const nextSuggestions = computeSuggestions(next);
                    setSuggestActive(nextSuggestions.length ? 0 : -1);
                  }}
                  onKeyDown={(e) => {
                    const suggestList = inputFocused ? computeSuggestions() : [];
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setInputFocused(false);
                      (e.target as HTMLInputElement).blur();
                      return;
                    }
                    if (inputFocused && suggestList.length > 0) {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setSuggestActive((prev) => (prev + 1) % suggestList.length);
                        return;
                      }
                      if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setSuggestActive((prev) => (prev <= 0 ? suggestList.length - 1 : prev - 1));
                        return;
                      }
                      if (e.key === "Tab" && suggestActive >= 0) {
                        e.preventDefault();
                        const chosen = suggestList[suggestActive];
                        const draftHasColon = draft.includes(":");
                        if (draftHasColon) {
                          const [key] = draft.split(":");
                          addToken(`${key.trim()}: ${chosen}`);
                        } else {
                          setDraft(`${chosen}: `);
                        }
                        return;
                      }
                    }
                    if (e.key === "," || e.key === "Enter") {
                      e.preventDefault();
                      addToken(draft);
                    } else if (e.key === "Backspace" && draft === "" && tokens.length) {
                      e.preventDefault();
                      setTokens((prev) => prev.slice(0, -1));
                    }
                  }}
                  style={{ minWidth: "120px" }}
                />
                {(() => {
                  const suggestList = inputFocused ? computeSuggestions() : [];
                  if (!suggestList.length) return null;
                  return (
                    <div className="suggestions">
                      {suggestList.map((s, idx) => (
                        <button
                          key={`${s}-${idx}`}
                          type="button"
                          className={`suggestion${idx === suggestActive ? " active" : ""}`}
                          onMouseEnter={() => setSuggestActive(idx)}
                          onClick={(e) => {
                            e.preventDefault();
                            setSuggestActive(idx);
                            const draftHasColon = draft.includes(":");
                            if (draftHasColon) {
                              const [key] = draft.split(":");
                              addToken(`${key.trim()}: ${s}`);
                            } else {
                              setDraft(`${s}: `);
                            }
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {filtered.length === 0 && <div style={{ marginTop: 8 }}>No issues detected.</div>}
          {filtered.length > 0 && (
            <ul className="unstyled-list" style={{ display: "grid", gap: 6, marginTop: enableFilter ? 8 : 0 }}>
              {filtered.map((issue, idx) => {
                const key = `${title}-${issue.code}-${idx}-${issue.message}`;
                const isExpanded = expandedKey === key;
                const context = describeContext ? describeContext(issue) : "";
                return (
                  <li key={key} className="issue-row">
                    <div className="issue-row-header" style={{ justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span className="pill" style={{ background: severityTone(issue.severity), color: "#0b1224" }}>
                          {issue.severity.toUpperCase()}
                        </span>
                        <strong>{issue.code}</strong>
                        <span className="muted small">Source: {issue.source}</span>
                        {context ? <span className="muted small">{context}</span> : null}
                      </div>
                      <button className="ghost nav-link" type="button" onClick={() => setExpandedKey(isExpanded ? null : key)}>
                        {isExpanded ? "Hide" : "Show"} details
                      </button>
                    </div>
                    <ul className="muted small issue-details">
                      <li>{issue.message}</li>
                    </ul>
                    {isExpanded && (
                      <pre
                        className="code-block"
                        style={{
                          marginTop: 8,
                          maxHeight: "none",
                          whiteSpace: "pre-wrap",
                          overflowY: "visible",
                          overflowX: "auto",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        {JSON.stringify(issue, null, 2)}
                      </pre>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function MatrixRow({
  day,
  dayLookup,
  variantIssueMap,
  onSelect,
  selected,
}: {
  day: number;
  dayLookup: Map<string, ContentVariantDiagnostics>;
  variantIssueMap: Map<string, { errors: number; warnings: number; info: number; messages: string[] }>;
  onSelect: (sel: { day: number; locale: Locale; mode: Mode }) => void;
  selected: { day: number; locale: Locale; mode: Mode } | null;
}) {
  return (
    <>
      <div className="matrix-cell header">Day {day}</div>
      {variants.map((variant) => {
        const key = `${day}-${variant.locale}-${variant.mode}`;
        const diag = dayLookup.get(key);
        const issueSummary = variantIssueMap.get(key);
        const severityStatus: MatrixStatus | null =
          issueSummary && issueSummary.errors > 0
            ? "error"
            : issueSummary && issueSummary.warnings > 0
              ? "warning"
              : issueSummary && issueSummary.info > 0
                ? "info"
                : null;
        const baseStatus: MatrixStatus =
          diag?.status === "error"
            ? "error"
            : diag?.status === "warning"
              ? "warning"
              : diag?.status === "ok"
                ? "ok"
                : "warning"; // treat missing as warning
        const displayStatus: MatrixStatus = severityStatus ?? baseStatus;
        const color = statusColor(displayStatus);
        const isSelected =
          selected?.day === day && selected.locale === variant.locale && selected.mode === variant.mode;
        const labelParts: string[] = [];
        if (issueSummary) {
          labelParts.push(
            `Errors: ${issueSummary.errors}, Warnings: ${issueSummary.warnings}, Info: ${issueSummary.info}`,
          );
          if (issueSummary.messages.length) {
            labelParts.push(...issueSummary.messages.slice(0, 3));
          }
        } else if (diag?.issues?.length) {
          labelParts.push(...diag.issues);
        } else {
          labelParts.push("No issues");
        }
        const label = labelParts.join(" · ");
        const statusLabel =
          displayStatus === "error"
            ? `error${issueSummary?.errors ? ` (${issueSummary.errors})` : ""}`
            : displayStatus === "warning"
              ? `warning${issueSummary?.warnings ? ` (${issueSummary.warnings})` : diag?.status === "missing" ? " (missing)" : ""}`
              : displayStatus === "info"
                ? "info"
                : "ok";
        return (
          <button
            key={key}
            type="button"
            className={`matrix-cell status-${displayStatus}${isSelected ? " selected" : ""}`}
            title={label}
            onClick={() => onSelect({ day, locale: variant.locale, mode: variant.mode })}
            style={{ background: color }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
              <span>{statusLabel}</span>
            </div>
          </button>
        );
      })}
    </>
  );
}

function BlockPreview({
  block,
  rewriteAssets,
  resolveAsset,
}: {
  block?: AdminContentDayDetail["blocks"][number];
  rewriteAssets: (html?: string) => string;
  resolveAsset: (src?: string) => string;
}) {
  const rarityColor = (rarity: string) => {
    const normalized = rarity.toLowerCase();
    if (normalized.includes("legendary") || normalized.includes("mythic")) return "#f97316";
    if (normalized.includes("epic")) return "#a855f7";
    if (normalized.includes("rare")) return "#22c55e";
    if (normalized.includes("uncommon")) return "#0ea5e9";
    return "#9ca3af";
  };

  if (!block) return <div className="muted small">Select a block to preview.</div>;
  const hiddenBadge = !block.visible ? (
    <span
      className="pill"
      style={{
        background: "rgba(244,63,94,0.15)",
        color: "#f43f5e",
        display: "inline-flex",
        marginBottom: 8,
      }}
    >
      Hidden block
    </span>
  ) : null;
  if (block.kind === "story") {
    return (
      <div>
        {hiddenBadge}
        <article
          className="riddle-body"
          dangerouslySetInnerHTML={{ __html: rewriteAssets(block.html) }}
          style={{ padding: "8px 0" }}
        />
      </div>
    );
  }
  if (block.kind === "reward" && block.item) {
    return (
      <div>
        {hiddenBadge}
        <div className="reward-card" data-rarity={block.item.rarity}>
          <div className="reward-header">
            <div className="reward-title">{block.item.title}</div>
            <div className="reward-rarity" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: rarityColor(block.item.rarity),
                  border: "1px solid var(--line)",
                  display: "inline-block",
                }}
              />
              {block.item.rarity}
            </div>
          </div>
          <div className="reward-body">
            {block.item.image ? (
              <img src={resolveAsset(block.item.image)} alt={block.item.title} style={{ maxWidth: 160 }} />
            ) : null}
            {block.item.description ? <p className="muted small">{block.item.description}</p> : null}
          </div>
        </div>
      </div>
    );
  }
  if (block.kind === "puzzle") {
    return (
      <div className="debug-block" style={{ border: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="muted uppercase small">{block.type}</div>
          {hiddenBadge}
        </div>
        {block.title ? <div className="debug-title">{block.title}</div> : null}
        {block.backgroundVideo ? (
          <video
            style={{ maxWidth: "100%", borderRadius: 8, margin: "6px 0" }}
            muted
            playsInline
            controls={false}
          >
            {(block.backgroundVideo.sources?.length
              ? block.backgroundVideo.sources
              : block.backgroundVideo.src
                ? [{ src: block.backgroundVideo.src, type: block.backgroundVideo.type }]
                : []
            ).map((source) => (
              <source key={source.src} src={resolveAsset(source.src)} type={source.type} />
            ))}
          </video>
        ) : block.backgroundImage ? (
          <img
            src={resolveAsset(block.backgroundImage)}
            alt=""
            style={{ maxWidth: "100%", borderRadius: 8, margin: "6px 0" }}
          />
        ) : null}
        {block.options?.length ? (
          <div className="muted small" style={{ marginTop: 6 }}>
            Options:
            <ul style={{ margin: "4px 0", paddingLeft: 16 }}>
              {block.options.map((opt) => (
                <li key={opt.id}>
                  {opt.image ? (
                    <img src={resolveAsset(opt.image)} alt={opt.label} style={{ maxHeight: 40, marginRight: 6 }} />
                  ) : null}
                  <strong>{opt.label}</strong> ({opt.id})
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <SolutionPreview block={block} />
        {block.items?.length ? (
          <div className="muted small" style={{ marginTop: 6 }}>
            Items:
            <ul style={{ margin: "4px 0", paddingLeft: 16 }}>
              {block.items.map((itm) => (
                <li key={itm.id}>
                  {itm.image ? (
                    <img src={resolveAsset(itm.image)} alt={itm.label ?? itm.id} style={{ maxHeight: 32, marginRight: 6 }} />
                  ) : null}
                  {itm.label ?? itm.id}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {block.sockets?.length ? (
          <div className="muted small" style={{ marginTop: 6 }}>
            Sockets:
            <ul style={{ margin: "4px 0", paddingLeft: 16 }}>
              {block.sockets.map((sock) => (
                <li key={sock.id}>{sock.label ?? sock.id}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    );
  }
  return <div className="muted small">Preview not available for this block type.</div>;
}

function SolutionPreview({ block }: { block: Extract<AdminContentDayDetail["blocks"][number], { kind: "puzzle" }> }) {
  const { type, solution } = block;
  const renderSolutionValue = () => {
    if (solution === null || solution === undefined) return <span className="muted small">No solution provided.</span>;
    if (type === "single-choice") {
      const sol = String(solution);
      const opt = block.options?.find((o) => o.id === sol);
      return (
        <span className="muted small">
          {opt ? `${opt.label} (${opt.id})` : sol}
        </span>
      );
    }
    if (type === "multi-choice") {
      const list = Array.isArray(solution) ? solution : [];
      return (
        <span className="muted small">
          {list
            .map((id) => {
              const opt = block.options?.find((o) => o.id === id);
              return opt ? `${opt.label} (${opt.id})` : String(id);
            })
            .join(", ") || "No solution entries"}
        </span>
      );
    }
    if (type === "select-items") {
      const items =
        Array.isArray(solution) ? solution : typeof solution === "object" && solution && "items" in solution
          ? ((solution as { items?: unknown[] }).items ?? [])
          : [];
      return <span className="muted small">{items.length ? items.join(", ") : "No items listed"}</span>;
    }
    if (type === "drag-sockets") {
      const list = Array.isArray(solution) ? solution : [];
      return (
        <ul className="muted small" style={{ margin: "4px 0", paddingLeft: 16 }}>
          {list.length === 0 ? <li>No solution entries</li> : null}
          {list.map((entry, idx) => {
            const e = entry as { socketId?: string; itemId?: string; listId?: string };
            return (
              <li key={`${e.socketId ?? idx}-${idx}`}>
                {e.socketId ?? "?"} ← {e.itemId ?? e.listId ?? "?"}
              </li>
            );
          })}
        </ul>
      );
    }
    return (
      <pre className="code-block" style={{ maxHeight: 180, overflow: "auto" }}>
        {JSON.stringify(solution, null, 2)}
      </pre>
    );
  };
  return (
    <div className="muted small" style={{ marginTop: 8 }}>
      <div className="muted uppercase small" style={{ marginBottom: 4 }}>
        Solution
      </div>
      {renderSolutionValue()}
    </div>
  );
}
