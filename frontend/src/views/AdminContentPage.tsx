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

const variants: Array<{ locale: Locale; mode: Mode; label: string }> = [
  { locale: "en", mode: "NORMAL", label: "EN · NORMAL" },
  { locale: "en", mode: "VETERAN", label: "EN · VETERAN" },
  { locale: "de", mode: "NORMAL", label: "DE · NORMAL" },
  { locale: "de", mode: "VETERAN", label: "DE · VETERAN" },
];

const statusColor = (status: ContentVariantStatus) => {
  switch (status) {
    case "ok":
      return "#0ea5e9"; // teal-blue
    case "warning":
      return "#f59e0b"; // amber
    case "error":
      return "#d946ef"; // magenta
    case "missing":
    default:
      return "#475569"; // slate
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
  const [selected, setSelected] = useState<{ day: number; locale: Locale; mode: Mode } | null>(null);
  const [detail, setDetail] = useState<AdminContentDayDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const diag = await fetchAdminContentDiagnostics();
      setDiagnostics(diag);
      if (!selected) {
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

  const dayLookup = useMemo(() => {
    const map = new Map<string, ContentVariantDiagnostics>();
    diagnostics?.variants.forEach((v) => {
      map.set(`${v.day}-${v.locale}-${v.mode}`, v);
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

  const selectedVariantIssues = useMemo(() => {
    if (!selected) return [];
    const key = `${selected.day}-${selected.locale}-${selected.mode}`;
    const selectedDiag = dayLookup.get(key);
    if (!selectedDiag) return [];
    if (selectedDiag.issues.length) return selectedDiag.issues;
    if (selectedDiag.status === "missing") return ["Missing content file"];
    return [];
  }, [dayLookup, selected]);

  const inventoryIssues = useMemo(
    () => (diagnostics?.issues ?? []).filter((issue) => issue.source === "inventory" || issue.source === "consistency"),
    [diagnostics?.issues],
  );
  const inventorySummary = useMemo(() => {
    const errors = inventoryIssues.filter((i) => i.severity === "error").length;
    const warnings = inventoryIssues.filter((i) => i.severity === "warning").length;
    const info = inventoryIssues.filter((i) => i.severity === "info").length;
    const severity: IssueSeverity | null = errors > 0 ? "error" : warnings > 0 ? "warning" : info > 0 ? "info" : null;
    return { total: inventoryIssues.length, errors, warnings, info, severity };
  }, [inventoryIssues]);

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
              <IssueListSubpanel
                title="Asset issues"
                issues={(diagnostics.issues ?? []).filter((i) => i.source === "asset")}
                defaultOpen={false}
                enableFilter={false}
                describeContext={(issue) => (issue.details?.assetPath ? String(issue.details.assetPath) : "")}
                extraSummaryItems={(issues) => {
                  const unused = issues.filter((i) => i.code === "ASSET_UNUSED").length;
                  const duplicates = issues.filter((i) => i.code === "ASSET_DUPLICATE_HASH").length;
                  return (
                    <>
                      <span>Unused: {unused}</span>
                      <span>Duplicate hashes: {duplicates}</span>
                    </>
                  );
                }}
              />
            </div>

            <div className="panel" style={{ marginTop: 12 }}>
              <header className="panel-header">
                <div>
                  <h3>Inventory</h3>
                  <p className="muted">Per-locale inventory state and consistency checks.</p>
                </div>
              </header>
              <div className="inventory-grid">
                {diagnostics.inventory.locales.map((loc) => (
                  <div key={loc.locale} className="inventory-card">
                    <div className="muted uppercase small">{loc.locale.toUpperCase()}</div>
                    <div className="metric-value">{loc.items} items</div>
                    {!loc.hasFile && <div className="error">Missing inventory file</div>}
                    {loc.issues.length > 0 && (
                      <ul className="muted small">
                        {loc.issues.map((i) => (
                          <li key={i}>{i}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              <IssueListSubpanel
                title="Inventory issues"
                issues={inventoryIssues}
                defaultOpen={false}
                enableFilter={false}
                describeContext={(issue) => (issue.details?.locale ? String(issue.details.locale).toUpperCase() : "")}
              />
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
                  <LegendChip color={statusColor("missing")} label="Missing" />
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
                {selected && (
                  <div className="pill">
                    Day {selected.day} · {selected.locale.toUpperCase()} · {selected.mode}
                  </div>
                )}
              </header>
              {selectedVariantIssues.length > 0 && (
                <div className="muted small">
                  <ul style={{ margin: "4px 0 0 12px", paddingLeft: 8 }}>
                    {selectedVariantIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedVariantIssues.length === 0 && (
                <div className="muted small">No issues recorded for this variant.</div>
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
                    {detail.blocks.map((block, idx) => (
                      <div key={block.id ?? `${block.kind}-${idx}`} className="debug-block">
                        <div className="muted uppercase small">{block.kind}</div>
                        {block.title ? <div className="debug-title">{block.title}</div> : null}
                        {block.kind === "puzzle" ? (
                          <div className="muted small">
                            Type: {block.type} · Visible: {String(block.visible)} · Options: {block.options?.length ?? 0}
                          </div>
                        ) : null}
                        {block.kind === "reward" && block.item ? (
                          <div className="muted small">Reward: {block.item.title}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <details>
                    <summary className="ghost">Show raw JSON</summary>
                    <pre className="code-block">{JSON.stringify(detail, null, 2)}</pre>
                  </details>
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

type IssueListSubpanelProps = {
  title: string;
  description?: string;
  issues: ContentDiagnostics["issues"];
  defaultOpen?: boolean;
  enableFilter?: boolean;
  totalDays?: number;
  describeContext?: (issue: ContentDiagnostics["issues"][number]) => string;
  extraSummaryItems?: (issues: ContentDiagnostics["issues"]) => React.ReactNode;
};

function filterIssues(issues: ContentDiagnostics["issues"], tokens: string[]) {
  const normalizedTokens = tokens.map((t) => t.trim()).filter(Boolean);
  if (normalizedTokens.length === 0) return issues;
  return issues.filter((issue) => {
    const details = issue.details ?? {};
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
        if (key === "day") return Number(details.day) === Number(value);
        if (key === "locale") return String(details.locale ?? "").toLowerCase() === lowerVal;
        if (key === "mode") return String(details.mode ?? "").toLowerCase() === lowerVal;
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
  extraSummaryItems,
}: IssueListSubpanelProps & { children?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  const [tokens, setTokens] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [suggestActive, setSuggestActive] = useState(-1);
  const [inputFocused, setInputFocused] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const filtered = useMemo(() => filterIssues(issues, tokens), [issues, tokens]);

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
        {extraSummaryItems ? extraSummaryItems(filtered) : null}
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
  onSelect,
  selected,
}: {
  day: number;
  dayLookup: Map<string, ContentVariantDiagnostics>;
  onSelect: (sel: { day: number; locale: Locale; mode: Mode }) => void;
  selected: { day: number; locale: Locale; mode: Mode } | null;
}) {
  return (
    <>
      <div className="matrix-cell header">Day {day}</div>
      {variants.map((variant) => {
        const key = `${day}-${variant.locale}-${variant.mode}`;
        const diag = dayLookup.get(key);
        const color = statusColor(diag?.status ?? "missing");
        const isSelected =
          selected?.day === day && selected.locale === variant.locale && selected.mode === variant.mode;
        const label = diag?.issues?.length ? diag.issues.join("; ") : "No issues";
        return (
          <button
            key={key}
            type="button"
            className={`matrix-cell status-${diag?.status ?? "missing"}${isSelected ? " selected" : ""}`}
            title={label}
            onClick={() => onSelect({ day, locale: variant.locale, mode: variant.mode })}
            style={{ background: color }}
          >
            {diag?.status ?? "missing"}
          </button>
        );
      })}
    </>
  );
}
