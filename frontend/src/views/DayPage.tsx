import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchDay, submitAnswer } from "../services/api";
import type { DayDetail, DayBlock, RiddleAnswerPayload, User } from "../types";
import { useI18n } from "../i18n";
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
  const [warned, setWarned] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<{ block: Extract<DayBlock, { kind: "puzzle" }>; payload: RiddleAnswerPayload } | null>(null);
  const [lastResult, setLastResult] = useState<{ puzzleId: string; correct: boolean } | null>(null);
  const isOverrideParam = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("override") === "1";
  }, [location.search]);
  const useOverride = isOverrideParam;
  const [previewLocale, setPreviewLocale] = useState<"en" | "de">(user.locale);
  const [previewMode, setPreviewMode] = useState<"NORMAL" | "VET">(user.mode);
  const backendBase =
    import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ||
    (window.location.origin.includes("localhost:5173") ? "http://localhost:4000" : window.location.origin);

  const rewriteAssets = (html: string) =>
    backendBase
      ? html.replace(
          /src=(["'])(\/assets\/[^"']+)\1/g,
          (_m, quote, path) => `src=${quote}${backendBase}/content-${path.slice(1)}${quote}`,
        )
      : html;
  const resolveAsset = (src?: string) =>
    src && src.startsWith("/assets/") && backendBase ? `${backendBase}/content-${src.slice(1)}` : src ?? "";

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
    setLastResult(null);

    fetchDay(dayNumber, { override: useOverride, locale: previewLocale, mode: previewMode })
      .then((data) => setDetail(data))
      .catch(() => setError(t("dayLoadFailed")))
      .finally(() => setLoading(false));
  }, [dayNumber, useOverride, previewLocale, previewMode, navigate, t, version]);

  const performSubmit = async (block: Extract<DayBlock, { kind: "puzzle" }>, payload: RiddleAnswerPayload) => {
    if (!detail) return;
    setSubmitting(true);
    setPendingPayload(null);
    try {
      const resp = await submitAnswer(detail.day, payload, { override: useOverride, locale: previewLocale, mode: previewMode });
      setLastResult({ puzzleId: block.id, correct: resp.correct });
      setDetail((current) =>
        current
          ? {
              ...current,
              isSolved: resp.isSolved,
              blocks: resp.blocks,
            }
          : current,
      );
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
          </div>
        </div>
      );
    }
    if (block.kind !== "puzzle") return null;
    const status =
      block.solved || (lastResult && lastResult.puzzleId === block.id && lastResult.correct)
        ? "correct"
        : lastResult && lastResult.puzzleId === block.id && !lastResult.correct
          ? "incorrect"
          : "idle";
    return (
      <div className="puzzle-card" key={`puzzle-${block.id}`}>
        {block.title && <h3 className="puzzle-title">{block.title}</h3>}
        <article className="riddle-body" dangerouslySetInnerHTML={{ __html: rewriteAssets(block.html) }} />
        <RiddleAnswerForm
          block={block}
          submitting={submitting}
          status={status}
          onInteract={() => setLastResult(null)}
          onSubmit={(payload) => onSubmit(block, payload)}
        />
      </div>
    );
  };

  return (
    <div className="panel">
      <header className="panel-header">
        <div>
          <div className="eyebrow">
            {t("day")} {detail.day} · {displayLocale} · {displayMode}
          </div>
          <h2>{detail.title}</h2>
        </div>
        <div className="panel-actions" style={{ flexWrap: "wrap", gap: 8 }}>
          {useOverride && (user.isAdmin || user.isSuperAdmin) ? (
            <div className="preview-toggles">
              <div className="muted small">Preview</div>
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
              <div className="preview-toggle-group">
                {(["NORMAL", "VET"] as const).map((mode) => (
                  <button
                    key={mode}
                    className={`small-btn ${previewMode === mode ? "primary" : "ghost"}`}
                    onClick={() => setPreviewMode(mode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <button className="ghost nav-link" onClick={() => navigate("/calendar")}>
            {t("backToCalendar")}
          </button>
        </div>
      </header>

      {detail.canPlay ? (
        <>
          {detail.blocks.map((block, idx) => renderBlock(block, idx))}
          {detail.isSolved && (
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
  );
}
