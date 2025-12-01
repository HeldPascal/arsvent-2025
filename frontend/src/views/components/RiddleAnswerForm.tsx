import { useEffect, useMemo, useState } from "react";
import type { DayDetail, RiddleAnswerPayload } from "../../types";
import { useI18n } from "../../i18n";

interface Props {
  detail: DayDetail;
  submitting: boolean;
  onSubmit: (payload: RiddleAnswerPayload) => void;
}

export default function RiddleAnswerForm({ detail, submitting, onSubmit }: Props) {
  const { t } = useI18n();
  const [textAnswer, setTextAnswer] = useState("");
  const [singleChoice, setSingleChoice] = useState("");
  const [multiChoices, setMultiChoices] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<string[]>([]);
  const [groupAssignments, setGroupAssignments] = useState<Record<string, string>>({});
  const [localError, setLocalError] = useState<string | null>(null);

  const optionLabel = useMemo(() => {
    const map = new Map<string, string>();
    (detail.options ?? []).forEach((opt) => map.set(opt.id, opt.label));
    return map;
  }, [detail.options]);

  useEffect(() => {
    const solved = detail.solvedAnswer;
    const assignments: Record<string, string> = {};

    if (typeof solved === "string") {
      setTextAnswer(solved);
      setSingleChoice(solved);
      setMultiChoices([]);
      setSortOrder(detail.options?.map((opt) => opt.id) ?? []);
    } else if (Array.isArray(solved)) {
      setTextAnswer("");
      setSingleChoice("");
      setMultiChoices(solved);
      setSortOrder(solved);
    } else if (solved && typeof solved === "object") {
      setTextAnswer("");
      setSingleChoice("");
      setMultiChoices([]);
      setSortOrder(detail.options?.map((opt) => opt.id) ?? []);
      Object.entries(solved).forEach(([groupId, ids]) => {
        ids.forEach((id) => {
          assignments[id] = groupId;
        });
      });
    } else {
      setTextAnswer("");
      setSingleChoice("");
      setMultiChoices([]);
      setSortOrder(detail.options?.map((opt) => opt.id) ?? []);
    }

    if (detail.type === "group") {
      const base: Record<string, string> = {};
      (detail.options ?? []).forEach((opt) => {
        base[opt.id] = assignments[opt.id] ?? "";
      });
      setGroupAssignments(base);
    } else {
      setGroupAssignments({});
    }

    setLocalError(null);
  }, [detail]);

  const toggleMultiChoice = (id: string) => {
    setMultiChoices((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const moveSort = (id: string, direction: -1 | 1) => {
    setSortOrder((prev) => {
      const index = prev.indexOf(id);
      if (index === -1) return prev;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleGroupChange = (optionId: string, groupId: string) => {
    setGroupAssignments((prev) => ({ ...prev, [optionId]: groupId }));
  };

  const handleSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    setLocalError(null);
    if (submitting || detail.isSolved) return;

    if (detail.type === "text") {
      const trimmed = textAnswer.trim();
      if (!trimmed) {
        setLocalError(t("enterAnswer"));
        return;
      }
      onSubmit({ type: "text", answer: trimmed });
      return;
    }

    if (detail.type === "single-choice") {
      if (!singleChoice) {
        setLocalError(t("chooseOne"));
        return;
      }
      onSubmit({ type: "single-choice", answer: singleChoice });
      return;
    }

    if (detail.type === "multi-choice") {
      const minSelections = detail.minSelections ?? 1;
      if (multiChoices.length < minSelections) {
        setLocalError(minSelections > 1 ? `${t("chooseMany")} (${minSelections}+)` : t("chooseMany"));
        return;
      }
      onSubmit({ type: "multi-choice", answer: multiChoices });
      return;
    }

    if (detail.type === "sort") {
      if (!sortOrder.length) {
        setLocalError(t("sortInstruction"));
        return;
      }
      onSubmit({ type: "sort", answer: sortOrder });
      return;
    }

    // group
    const missingGroup = (detail.options ?? []).find((opt) => !groupAssignments[opt.id]);
    if (missingGroup) {
      setLocalError(t("assignAllOptions"));
      return;
    }
    const groupedAnswer = (detail.options ?? []).reduce<Record<string, string[]>>((acc, opt) => {
      const groupId = groupAssignments[opt.id];
      acc[groupId] = acc[groupId] ?? [];
      acc[groupId].push(opt.id);
      return acc;
    }, {});
    onSubmit({ type: "group", answer: groupedAnswer });
  };

  const renderChoices = () => {
    if (!detail.options) return null;
    if (detail.type === "single-choice") {
      return (
        <>
          <p className="muted small">{t("chooseOne")}</p>
          <div className="choice-list">
            {detail.options.map((opt) => (
              <label key={opt.id} className="choice-item">
                <input
                  type="radio"
                  name="single-choice"
                  value={opt.id}
                  checked={singleChoice === opt.id}
                  onChange={() => setSingleChoice(opt.id)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </>
      );
    }

    if (detail.type === "multi-choice") {
      return (
        <>
          <p className="muted small">
            {t("chooseMany")}
            {detail.minSelections && detail.minSelections > 1 ? ` (${detail.minSelections}+)` : ""}
          </p>
          <div className="choice-list">
            {detail.options.map((opt) => (
              <label key={opt.id} className="choice-item">
                <input
                  type="checkbox"
                  value={opt.id}
                  checked={multiChoices.includes(opt.id)}
                  onChange={() => toggleMultiChoice(opt.id)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </>
      );
    }

    if (detail.type === "sort") {
      return (
        <>
          <p className="muted small">{t("sortInstruction")}</p>
          <div className="sort-list">
            {sortOrder.map((id, index) => (
              <div key={id} className="sort-item">
                <span className="sort-label">{optionLabel.get(id) ?? id}</span>
                <div className="sort-actions">
                <button
                  type="button"
                  className="ghost icon-btn small"
                  aria-label={t("moveUp")}
                  onClick={() => moveSort(id, -1)}
                  disabled={submitting || index === 0}
                >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="ghost icon-btn small"
                  aria-label={t("moveDown")}
                  onClick={() => moveSort(id, 1)}
                  disabled={submitting || index === sortOrder.length - 1}
                >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    return (
      <>
        <p className="muted small">{t("groupInstruction")}</p>
        <div className="group-grid">
          {(detail.options ?? []).map((opt) => (
            <div key={opt.id} className="group-row">
              <div className="group-option">{opt.label}</div>
              <select
                value={groupAssignments[opt.id] ?? ""}
                onChange={(e) => handleGroupChange(opt.id, e.target.value)}
              >
                <option value="">{t("selectGroup")}</option>
                {(detail.groups ?? []).map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </>
    );
  };

  if (detail.type === "text") {
    return (
      <>
        <form className={`answer-form ${detail.isSolved ? "locked-form" : ""}`} onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={t("yourAnswer")}
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            required
            readOnly={detail.isSolved}
          />
          {!detail.isSolved && (
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? t("checking") : t("submit")}
            </button>
          )}
        </form>
        {localError && <div className="feedback error">{localError}</div>}
      </>
    );
  }

  return (
    <>
      <form className={`answer-stack ${detail.isSolved ? "locked-form" : ""}`} onSubmit={handleSubmit}>
        {renderChoices()}
        {!detail.isSolved && (
          <button className="primary" type="submit" disabled={submitting}>
            {submitting ? t("checking") : t("submit")}
          </button>
        )}
      </form>
      {localError && <div className="feedback error">{localError}</div>}
    </>
  );
}
