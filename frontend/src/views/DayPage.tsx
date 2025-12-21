import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchDay, submitAnswer, resetPuzzle, solvePuzzle } from "../services/api";
import type { DayDetail, DayBlock, RiddleAnswerPayload, User } from "../types";
import { useI18n } from "../i18n";
import { appendWebpFormat } from "../utils/assets";
import ConfirmDialog from "./components/ConfirmDialog";
import RiddleAnswerForm from "./components/RiddleAnswerForm";

interface Props {
  user: User;
  version: number;
}

export default function DayPage({ user, version }: Props) {
  const { day } = useParams<{ day: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dayNumber = Number(day);
  const { t, setLocale: setAppLocale } = useI18n();
  const [detail, setDetail] = useState<DayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [puzzleBusy, setPuzzleBusy] = useState<Record<string, boolean>>({});
  const [resetSignals, setResetSignals] = useState<Record<string, number>>({});
  const [resetPreviewRequested, setResetPreviewRequested] = useState(false);
  const [warned, setWarned] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<{ block: Extract<DayBlock, { kind: "puzzle" }>; payload: RiddleAnswerPayload } | null>(null);
  const [lastResults, setLastResults] = useState<Record<string, { correct: boolean }>>({});
  const isOverrideParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("override") === "1";
  }, [location.search]);
  const useOverride = isOverrideParam;
  const showPreviewControls = useOverride && (user.isAdmin || user.isSuperAdmin);
  const [previewLocale, setPreviewLocale] = useState<"en" | "de">(user.locale);
  const [previewMode, setPreviewMode] = useState<"NORMAL" | "VETERAN">(user.mode);
  const backendBase =
    import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ||
    (window.location.origin.includes("localhost:5173") ? "http://localhost:4000" : window.location.origin);

  const rewriteAssets = (html: string) => {
    if (!backendBase) return html;
    let out = html.replace(
      /src=(["'])(\/assets\/[^"']+)\1/g,
      (_m, quote, path) => `src=${quote}${backendBase}/content-${path.slice(1)}${quote}`,
    );
    out = out.replace(
      /src=(["'])(\/content-asset\/[^"']+)\1/g,
      (_m, quote, path) => `src=${quote}${appendWebpFormat(`${backendBase}${path}`)}${quote}`,
    );
    return out;
  };
  const resolveAsset = (src?: string) =>
    src && backendBase
      ? src.startsWith("/assets/")
        ? `${backendBase}/content-${src.slice(1)}`
        : src.startsWith("/content-asset/")
          ? appendWebpFormat(`${backendBase}${src}`)
          : src
      : src ?? "";

  // keep preview selection in sync when navigating to a new day or when user prefs change
  useEffect(() => {
    if (!useOverride) {
      setPreviewLocale(user.locale);
      setPreviewMode(user.mode);
    }
  }, [dayNumber, user.locale, user.mode, useOverride]);

  // Sync UI locale with preview selection in override mode so banners/buttons/toasts localize
  useEffect(() => {
    if (useOverride) {
      setAppLocale(previewLocale);
    } else {
      setAppLocale(user.locale);
    }
  }, [useOverride, previewLocale, user.locale, setAppLocale]);

  useEffect(() => {
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 24) {
      navigate("/calendar");
      return;
    }

    setLoading(true);
    setError(null);
    setPendingPayload(null);
    setWarned(false);
    setShowConfirm(false);
    setLastResults({});

    fetchDay(dayNumber, {
      override: useOverride,
      locale: previewLocale,
      mode: previewMode,
      resetPreview: resetPreviewRequested,
    })
      .then((data) => setDetail(data))
      .catch(() => setError(t("dayLoadFailed")))
      .finally(() => {
        setLoading(false);
        setResetPreviewRequested(false);
      });
  }, [dayNumber, useOverride, previewLocale, previewMode, navigate, t, version, resetPreviewRequested]);

  const performSubmit = async (block: Extract<DayBlock, { kind: "puzzle" }>, payload: RiddleAnswerPayload) => {
    if (!detail) return;
    setSubmitting(true);
    setPendingPayload(null);
    try {
      const resp = await submitAnswer(detail.day, payload, { override: useOverride, locale: previewLocale, mode: previewMode });
      setLastResults((prev) => ({ ...prev, [block.id]: { correct: resp.correct } }));
      setDetail((current) =>
        current
          ? {
              ...current,
              isSolved: resp.isSolved,
              blocks: resp.blocks ?? current.blocks,
            }
          : current,
      );
      if (resp.correct && resetSignals[block.id]) {
        const refreshed = await fetchDay(detail.day, {
          override: useOverride,
          locale: previewLocale,
          mode: previewMode,
        });
        setDetail(refreshed);
        setResetSignals((prev) => {
          const next = { ...prev };
          delete next[block.id];
          return next;
        });
      }
      if (!resp.correct) {
        window.dispatchEvent(
          new CustomEvent("app:toast", {
            detail: { type: "error", message: t("answerIncorrect"), durationMs: 3000 },
          }),
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("submissionFailed");
      window.dispatchEvent(
        new CustomEvent("app:toast", {
          detail: { type: "error", message, durationMs: 3000 },
        }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePuzzleReset = async (puzzleId: string) => {
    if (!detail) return;
    setPuzzleBusy((prev) => ({ ...prev, [puzzleId]: true }));
    try {
      const resp = await resetPuzzle(detail.day, puzzleId, {
        override: useOverride,
        locale: previewLocale,
        mode: previewMode,
      });
      setLastResults((prev) => {
        const next = { ...prev };
        delete next[puzzleId];
        return next;
      });
      setDetail((current) =>
        current
          ? {
              ...current,
              isSolved: resp.isSolved ?? current.isSolved,
              blocks: resp.blocks ?? current.blocks,
            }
          : current,
      );
      setResetSignals((prev) => ({ ...prev, [puzzleId]: (prev[puzzleId] ?? 0) + 1 }));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("submissionFailed");
      window.dispatchEvent(
        new CustomEvent("app:toast", {
          detail: { type: "error", message, durationMs: 3000 },
        }),
      );
    } finally {
      setPuzzleBusy((prev) => ({ ...prev, [puzzleId]: false }));
    }
  };

  const handlePuzzleSolveNow = async (puzzleId: string) => {
    if (!detail || !showPreviewControls) return;
    setPuzzleBusy((prev) => ({ ...prev, [puzzleId]: true }));
    try {
      const resp = await solvePuzzle(detail.day, puzzleId, {
        override: useOverride,
        locale: previewLocale,
        mode: previewMode,
      });
      setLastResults((prev) => ({ ...prev, [puzzleId]: { correct: true } }));
      setDetail((current) =>
        current
          ? {
              ...current,
              isSolved: resp.isSolved ?? current.isSolved,
              blocks: resp.blocks ?? current.blocks,
            }
          : current,
      );
      if (resetSignals[puzzleId]) {
        const refreshed = await fetchDay(detail.day, {
          override: useOverride,
          locale: previewLocale,
          mode: previewMode,
        });
        setDetail(refreshed);
        setResetSignals((prev) => {
          const next = { ...prev };
          delete next[puzzleId];
          return next;
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("submissionFailed");
      window.dispatchEvent(
        new CustomEvent("app:toast", {
          detail: { type: "error", message, durationMs: 3000 },
        }),
      );
    } finally {
      setPuzzleBusy((prev) => ({ ...prev, [puzzleId]: false }));
    }
  };

  const onSubmit = (block: Extract<DayBlock, { kind: "puzzle" }>, payload: RiddleAnswerPayload) => {
    if (!detail) return;
    if (user.mode === "NORMAL" && detail.day === 1 && !warned) {
      setPendingPayload({ block, payload });
      setShowConfirm(true);
      return;
    }
    void performSubmit(block, payload);
  };

  if (loading) return <div className="panel">{t("loading")}</div>;
  if (error) return <div className="panel error">{error}</div>;
  if (!detail) return null;
  const displayMode = useOverride ? previewMode : user.mode;
  const displayLocale = useOverride ? previewLocale.toUpperCase() : user.locale.toUpperCase();
  const renderBlock = (block: DayBlock, idx: number) => {
    if (!block.visible) return null;
    if (block.kind === "story") {
      return (
        <article key={`story-${idx}`} className="riddle-body" dangerouslySetInnerHTML={{ __html: rewriteAssets(block.html) }} />
      );
    }
    if (block.kind === "reward" && block.item && block.visible) {
      return (
        <div className="reward-card" key={`reward-${block.id ?? idx}`} data-rarity={block.item.rarity}>
          {block.item.image && (
            <img
              src={resolveAsset(block.item.image)}
              alt={block.item.title}
              className="reward-image"
              data-rarity={block.item.rarity}
            />
          )}
          <div>
            <div className="reward-title">{block.item.title}</div>
            {block.item.description && <div className="reward-desc">{block.item.description}</div>}
            <Link className="ghost nav-link" to="/inventory">
              {t("inventoryLink")}
            </Link>
          </div>
        </div>
      );
    }
    if (block.kind !== "puzzle") return null;
    const effectiveSolved = block.solved;
    const lastResult = lastResults[block.id];
    const status =
      effectiveSolved || (lastResult && lastResult.correct)
        ? "correct"
        : lastResult && !lastResult.correct
          ? "incorrect"
          : "idle";
    return (
      <div className="puzzle-card" key={`puzzle-${block.id}`}>
        {block.title && <h3 className="puzzle-title">{block.title}</h3>}
        <article className="riddle-body" dangerouslySetInnerHTML={{ __html: rewriteAssets(block.html) }} />
        <RiddleAnswerForm
          key={`${block.id}-${resetSignals[block.id] ?? 0}`}
          block={block as Extract<DayBlock, { kind: "puzzle" }>}
          submitting={submitting}
          status={status}
          requestContext={{
            day: dayNumber,
            override: useOverride,
            locale: previewLocale,
            mode: previewMode,
          }}
          resetSignal={resetSignals[block.id] ?? 0}
          onInteract={(puzzleId) =>
            setLastResults((prev) => {
              const next = { ...prev };
              delete next[puzzleId];
              return next;
            })
          }
          onSubmit={(payload) => onSubmit(block, payload)}
        />
        <div className="puzzle-quick-actions">
          {!block.solved || showPreviewControls ? (
            <button
              className="ghost wide"
              type="button"
              onClick={() => handlePuzzleReset(block.id)}
              disabled={puzzleBusy[block.id] || submitting}
            >
              {puzzleBusy[block.id] ? t("loading") : t("reset")}
            </button>
          ) : null}
          {showPreviewControls ? (
            <button
              className="primary wide"
              type="button"
              onClick={() => handlePuzzleSolveNow(block.id)}
              disabled={puzzleBusy[block.id] || submitting || block.solved}
            >
              {puzzleBusy[block.id] ? t("loading") : t("solveNow")}
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className={`day-layout ${showPreviewControls ? "has-preview-panel" : ""}`}>
      {showPreviewControls ? (
        <div className="preview-anchor">
          <aside className="panel preview-panel">
            <div className="muted uppercase small">Preview</div>
            <div className="preview-toggles">
              <div className="muted small">Language</div>
              <div className="preview-toggle-group">
                {(["en", "de"] as const).map((loc) => (
                  <button
                    key={loc}
                    className={`small-btn ${previewLocale === loc ? "primary" : "ghost"}`}
                    onClick={() => setPreviewLocale(loc)}
                  >
                    {loc.toUpperCase()}
                  </button>
                ))}
              </div>
              <div className="muted small">Difficulty</div>
              <div className="preview-toggle-group">
                {(["NORMAL", "VETERAN"] as const).map((mode) => (
                  <button
                    key={mode}
                    className={`small-btn ${previewMode === mode ? "primary" : "ghost"}`}
                    onClick={() => setPreviewMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <button
                className="small-btn ghost"
                onClick={() => {
                  setResetPreviewRequested(true);
                }}
                disabled={loading}
              >
                {t("reset")}
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="panel day-panel">
        <header className="panel-header">
          <div>
            <div className="eyebrow">
              {t("day")} {detail.day} · {displayLocale} · {displayMode}
            </div>
            <h2>{detail.title}</h2>
          </div>
          <div className="panel-actions" style={{ flexWrap: "wrap", gap: 8 }}>
            <button className="ghost nav-link" onClick={() => navigate("/calendar")}>
              {t("backToCalendar")}
            </button>
          </div>
        </header>

        {detail.canPlay ? (
          <>
            {detail.blocks.map((block, idx) => renderBlock(block, idx))}
            {detail.isSolved && !useOverride && (
              <div className="banner success">
                <div className="banner-title">{t("solved")}</div>
                <div className="banner-body">{t("answerCorrect")}</div>
              </div>
            )}
          </>
        ) : (
          <div className="muted">{detail.message ?? t("notAvailable")}</div>
        )}

        {showConfirm && (
          <ConfirmDialog
            message={t("warnNormalLock")}
            confirmLabel={t("confirm")}
            cancelLabel={t("cancel")}
            onConfirm={() => {
              setWarned(true);
              setShowConfirm(false);
              if (pendingPayload) {
                void performSubmit(pendingPayload.block, pendingPayload.payload);
              }
            }}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </div>
    </div>
  );
}
