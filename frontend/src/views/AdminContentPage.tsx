import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type {
  AdminContentDayDetail,
  ContentDiagnostics,
  ContentVariantDiagnostics,
  ContentVariantStatus,
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

export default function AdminContentPage() {
  const [diagnostics, setDiagnostics] = useState<ContentDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ day: number; locale: Locale; mode: Mode } | null>(null);
  const [detail, setDetail] = useState<AdminContentDayDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [issueFilterTokens, setIssueFilterTokens] = useState<string[]>([]);
  const [issueFilterDraft, setIssueFilterDraft] = useState<string>("");
  const [suggestActive, setSuggestActive] = useState<number>(-1);
  const [inputFocused, setInputFocused] = useState(false);
  const computeSuggestions = useCallback(
    (draftValue?: string) => {
      const draft = (draftValue ?? issueFilterDraft).trim();
      const hasColon = draft.includes(":");
      if (!hasColon) {
        return ["type", "day", "locale", "mode", "id", "file", "title", "issue"].filter((opt) =>
          opt.toLowerCase().startsWith(draft.toLowerCase()),
        );
      }
      const [rawKey, ...rest] = draft.split(":");
      const key = rawKey.trim().toLowerCase();
      const valuePrefix = rest.join(":").trim().toLowerCase();
      if (!key) return [];
      if (key === "type") {
        const opts = Array.from(
          new Set([
            "missing",
            "warning",
            "error",
            "duplicate-id",
            "duplicate-file",
            "filename",
            "metadata",
            "asset",
            "inventory",
            "general",
          ]),
        );
        return opts.filter((opt) => opt.toLowerCase().startsWith(valuePrefix));
      }
      if (key === "locale") {
        return ["en", "de"].filter((opt) => opt.startsWith(valuePrefix));
      }
      if (key === "mode") {
        return ["normal", "veteran"].filter((opt) => opt.startsWith(valuePrefix));
      }
      if (key === "day") {
        const opts = Array.from({ length: diagnostics?.stats.totalDays ?? 24 }, (_, i) => String(i + 1));
        return opts.filter((opt) => opt.startsWith(valuePrefix));
      }
      return [];
    },
    [diagnostics?.stats.totalDays, issueFilterDraft],
  );
  const applySuggestion = (suggestion: string) => {
    const draft = issueFilterDraft.trim();
    if (!draft.includes(":")) {
      setIssueFilterDraft(`${suggestion}: `);
    } else {
      const [key] = draft.split(":");
      setIssueFilterDraft(`${key.trim()}: ${suggestion}`);
    }
    setSuggestActive(-1);
  };

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

  const classifyIssue = useCallback((issue: string): string[] => {
    const lower = issue.toLowerCase();
    const kinds = new Set<string>();
    if (lower.includes("duplicate content id")) kinds.add("duplicate-id");
    if (lower.includes("duplicate content for day")) kinds.add("duplicate-file");
    if (lower.includes("filename mismatch")) kinds.add("filename");
    if (lower.includes("metadata mismatch")) kinds.add("metadata");
    if (lower.includes("missing asset") || lower.includes("asset")) kinds.add("asset");
    if (lower.includes("inventory")) kinds.add("inventory");
    if (lower.includes("not found") || lower.includes("missing content")) kinds.add("missing");
    if (lower.includes("error")) kinds.add("error");
    if (lower.includes("warning")) kinds.add("warning");
    if (kinds.size === 0) kinds.add("general");
    return Array.from(kinds);
  }, []);

  const variantsWithIssues = useMemo(() => {
    if (!diagnostics) return [];
    const normalizedTokens = issueFilterTokens.map((t) => t.trim()).filter(Boolean);
    return diagnostics.variants
      .map((v) => {
        const key = `${v.day}-${v.locale}-${v.mode}`;
        const diagIssues = v.issues.length ? v.issues : v.status === "missing" ? ["Missing content file"] : [];
        const kinds = new Set<string>();
        if (v.status === "missing") kinds.add("missing");
        if (v.status === "warning") kinds.add("warning");
        if (v.status === "error") kinds.add("error");
        diagIssues.forEach((issue) => classifyIssue(issue).forEach((k) => kinds.add(k)));
        return { key, variant: v, issues: diagIssues, kinds: Array.from(kinds) };
      })
      .filter((entry) => {
        if (entry.issues.length === 0) return false;
        const matchesTokens =
          normalizedTokens.length === 0 ||
          normalizedTokens.every((token) => {
            if (!token) return true;
            const [maybeKey, ...restRaw] = token.split(":");
            const rest = restRaw.join(":");
            const key = restRaw.length > 0 ? maybeKey.toLowerCase().trim() : null;
            const value = restRaw.length > 0 ? rest.trim() : token.trim();
            if (key && value) {
              if (key === "type") {
                const val = value.toLowerCase();
                return entry.kinds.map((k) => k.toLowerCase()).includes(val);
              }
              if (key === "day") {
                const dayVal = Number(value);
                return Number.isFinite(dayVal) ? entry.variant.day === dayVal : false;
              }
              if (key === "locale") {
                return entry.variant.locale.toLowerCase() === value.toLowerCase();
              }
              if (key === "mode") {
                return entry.variant.mode.toLowerCase() === value.toLowerCase();
              }
              if (key === "id") {
                return (entry.variant.contentId ?? "").toLowerCase().includes(value.toLowerCase());
              }
              if (key === "file") {
                return (entry.variant.filePath ?? "").toLowerCase().includes(value.toLowerCase());
              }
              if (key === "title") {
                return (entry.variant.title ?? "").toLowerCase().includes(value.toLowerCase());
              }
              if (key === "issue") {
                return entry.issues.some((i) => i.toLowerCase().includes(value.toLowerCase()));
              }
            }
            const lowered = value.toLowerCase();
            const haystack = [
              entry.variant.contentId ?? "",
              entry.issues.join(" "),
              entry.variant.title ?? "",
              entry.variant.filePath ?? "",
            ];
            return haystack.some((text) => text.toLowerCase().includes(lowered));
          });
        return matchesTokens;
      });
  }, [classifyIssue, diagnostics, issueFilterTokens]);

  const selectedVariantIssues = useMemo(() => {
    if (!selected) return [];
    const key = `${selected.day}-${selected.locale}-${selected.mode}`;
    const selectedDiag = dayLookup.get(key);
    if (!selectedDiag) return [];
    if (selectedDiag.issues.length) return selectedDiag.issues;
    if (selectedDiag.status === "missing") return ["Missing content file"];
    return [];
  }, [dayLookup, selected]);

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
              <header className="panel-header" style={{ marginBottom: 8 }}>
                <div>
                  <h3>Issues</h3>
                  <div className="muted">Filter and inspect content diagnostics.</div>
                </div>
                <button className="ghost nav-link" type="button" onClick={() => setIssuesOpen((v) => !v)}>
                  {issuesOpen ? "Hide" : "Show"}
                </button>
              </header>
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
              {issuesOpen && (
                <div className="issues-filter">
                  <div className="muted small">
                    Type to add tags; press comma/Enter to confirm. Use key:value (e.g., type:warning, day:12). No key searches all fields.
                  </div>
                  <div className="tag-input">
                    {issueFilterTokens.map((token, idx) => {
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
                          <button
                            type="button"
                            onClick={() =>
                              setIssueFilterTokens((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                    <input
                      type="text"
                      placeholder="Add filter… (comma/Enter to confirm)"
                      value={issueFilterDraft}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      onChange={(e) => {
                        const next = e.target.value;
                        setIssueFilterDraft(next);
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
                            setSuggestActive((prev) =>
                              prev <= 0 ? suggestList.length - 1 : prev - 1,
                            );
                            return;
                          }
                          if (e.key === "Tab" && suggestActive >= 0) {
                            e.preventDefault();
                            const chosen = suggestList[suggestActive];
                            applySuggestion(chosen);
                            // If a value was completed (has a colon already), commit the filter
                            const completed = chosen && issueFilterDraft.includes(":");
                            if (completed) {
                              const value = issueFilterDraft.includes(":") ? issueFilterDraft.split(":")[0].trim() : issueFilterDraft;
                              const full = issueFilterDraft.endsWith(" ") ? `${value}: ${chosen}` : `${value}: ${chosen}`;
                              const trimmed = full.trim();
                              if (trimmed) {
                                setIssueFilterTokens((prev) => [...prev, trimmed]);
                                setIssueFilterDraft("");
                                setSuggestActive(-1);
                              }
                            }
                            return;
                          }
                        }
                        if (e.key === "," || e.key === "Enter") {
                          e.preventDefault();
                          const value = issueFilterDraft.trim();
                          if (value) {
                            setIssueFilterTokens((prev) => [...prev, value]);
                            setIssueFilterDraft("");
                            setSuggestActive(-1);
                          }
                        } else if (e.key === "Backspace" && issueFilterDraft === "" && issueFilterTokens.length) {
                          e.preventDefault();
                          setIssueFilterTokens((prev) => prev.slice(0, -1));
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
                                applySuggestion(s);
                              }}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {variantsWithIssues.length === 0 && <div style={{ marginTop: 8 }}>No issues detected.</div>}
                  {variantsWithIssues.length > 0 && (
                    <ul style={{ margin: "6px 0 0 0", padding: 0, display: "grid", gap: 6 }}>
                      {variantsWithIssues.map(({ key, variant, issues }) => (
                        <li key={key} className="issue-row">
                          <div className="issue-row-header">
                            <strong>
                              Day {variant.day} · {variant.locale.toUpperCase()} · {variant.mode}
                            </strong>
                            {variant.contentId ? (
                              <span className="muted small" style={{ marginLeft: 6 }}>
                                ID: {variant.contentId}
                              </span>
                            ) : null}
                          </div>
                          <ul className="muted small issue-details">
                            {issues.map((issue) => (
                              <li key={issue}>{issue}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="panel" style={{ marginTop: 12 }}>
              <header className="panel-header">
                <div>
                  <h3>Inventory & assets</h3>
                  <p className="muted">Per-locale inventory state and asset checks.</p>
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
              {diagnostics.inventory.consistency.length > 0 && (
                <div className="muted small" style={{ marginTop: 8 }}>
                  {diagnostics.inventory.consistency.map((c) => (
                    <div key={c.locale}>
                      {c.locale.toUpperCase()}: missing {c.missingIds.length} · extra {c.extraIds.length}
                    </div>
                  ))}
                </div>
              )}
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
