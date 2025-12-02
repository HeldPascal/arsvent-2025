import { useEffect, useState } from "react";
import type { DayBlock, RiddleAnswerPayload } from "../../types";
import { useI18n } from "../../i18n";

interface Props {
  block: Extract<DayBlock, { kind: "puzzle" }>;
  submitting: boolean;
  status?: "correct" | "incorrect" | "idle";
  onInteract?: () => void;
  onSubmit: (payload: RiddleAnswerPayload) => void;
}

export default function RiddleAnswerForm({ block, submitting, status = "idle", onInteract, onSubmit }: Props) {
  const { t } = useI18n();
  const backendBase =
    import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ||
    (window.location.origin.includes("localhost:5173") ? "http://localhost:4000" : window.location.origin);
  const resolveImage = (src?: string) =>
    src && src.startsWith("/assets/") && backendBase ? `${backendBase}/content-${src.slice(1)}` : src ?? "";

  const [textAnswer, setTextAnswer] = useState("");
  const [singleChoice, setSingleChoice] = useState("");
  const [multiChoices, setMultiChoices] = useState<string[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    // Preserve selections while unsolved; only hydrate from solution when solved
    if (block.solved) {
      if (typeof block.solution === "string") {
        setTextAnswer(String(block.solution));
        setSingleChoice(String(block.solution));
        setMultiChoices([]);
      } else if (Array.isArray(block.solution)) {
        setTextAnswer("");
        setSingleChoice("");
        setMultiChoices(block.solution as string[]);
      }
    }
    setLocalError(null);
  }, [block.id, block.solved, block.solution]);

  const handleSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    setLocalError(null);
    if (submitting || block.solved) return;

    if (block.type === "text") {
      const trimmed = textAnswer.trim();
      if (!trimmed) {
        setLocalError(t("enterAnswer"));
        return;
      }
      onInteract?.();
      onSubmit({ puzzleId: block.id, type: "text", answer: trimmed });
      return;
    }

    if (block.type === "single-choice") {
      if (!singleChoice) {
        setLocalError(t("chooseOne"));
        return;
      }
      onInteract?.();
      onSubmit({ puzzleId: block.id, type: "single-choice", answer: singleChoice });
      return;
    }

    if (block.type === "multi-choice") {
      const minSelections = block.minSelections ?? 1;
      if (multiChoices.length < minSelections) {
        setLocalError(minSelections > 1 ? `${t("chooseMany")} (${minSelections}+)` : t("chooseMany"));
        return;
      }
      onInteract?.();
      onSubmit({ puzzleId: block.id, type: "multi-choice", answer: multiChoices });
      return;
    }

    setLocalError("Unsupported puzzle type");
  };

  const statusClass =
    status === "correct" ? "choice-correct" : status === "incorrect" ? "choice-error" : submitting ? "choice-pending" : "";

  const renderChoices = () => {
    if (!block.options) return null;
    if (block.type === "single-choice") {
      return (
        <>
          <p className="muted small">{t("chooseOne")}</p>
          <div className="choice-list">
            {(block.options ?? []).map((opt) => (
              <label key={opt.id} className={`choice-item ${singleChoice === opt.id ? "selected" : ""} ${statusClass}`}>
                <input
                  type="radio"
                  name={`single-choice-${block.id}`}
                  value={opt.id}
                  checked={singleChoice === opt.id}
                  onChange={() => {
                    setSingleChoice(opt.id);
                    onInteract?.();
                  }}
                  disabled={submitting || block.solved}
                />
                <div className="choice-visual">
                  {opt.image && <img src={resolveImage(opt.image)} alt={opt.label || opt.id} className="choice-image" />}
                  {opt.label && <span>{opt.label}</span>}
                </div>
              </label>
            ))}
          </div>
        </>
      );
    }

    if (block.type === "multi-choice") {
      return (
        <>
          <p className="muted small">
            {t("chooseMany")}
            {block.minSelections && block.minSelections > 1 ? ` (${block.minSelections}+)` : ""}
          </p>
          <div className="choice-list">
            {(block.options ?? []).map((opt) => (
              <label key={opt.id} className={`choice-item ${multiChoices.includes(opt.id) ? "selected" : ""} ${statusClass}`}>
                <input
                  type="checkbox"
                  value={opt.id}
                  checked={multiChoices.includes(opt.id)}
                  onChange={() => {
                    setMultiChoices((prev) => (prev.includes(opt.id) ? prev.filter((item) => item !== opt.id) : [...prev, opt.id]));
                    onInteract?.();
                  }}
                  disabled={submitting || block.solved}
                />
                <div className="choice-visual">
                  {opt.image && <img src={resolveImage(opt.image)} alt={opt.label || opt.id} className="choice-image" />}
                  {opt.label && <span>{opt.label}</span>}
                </div>
              </label>
            ))}
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <form className="riddle-answer" onSubmit={handleSubmit}>
      {localError && <div className="banner error">{localError}</div>}

      {block.type === "text" && (
        <div className="field">
          <label htmlFor={`answer-${block.id}`}>{t("yourAnswer")}</label>
          <input
            id={`answer-${block.id}`}
            type="text"
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            disabled={submitting || block.solved}
          />
        </div>
      )}

      {(block.type === "single-choice" || block.type === "multi-choice") && renderChoices()}

      {!block.solved && (
        <div className="actions">
          <button type="submit" className="primary" disabled={submitting}>
            {submitting ? "…" : t("submit")}
          </button>
        </div>
      )}
    </form>
  );
}
