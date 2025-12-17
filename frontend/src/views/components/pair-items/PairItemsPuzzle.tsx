import { useMemo, useState } from "react";
import type { DayBlock, RiddleOption } from "../../../types";
import { useI18n } from "../../../i18n";
import { checkPairItems } from "../../../services/api";

type PairItemsBlock = Extract<DayBlock, { kind: "puzzle" }> & {
  type: "pair-items";
  leftOptions?: RiddleOption[];
  rightOptions?: RiddleOption[];
  optionSize?: "small" | "medium" | "large";
};

interface Props {
  block: PairItemsBlock;
  pairs: Array<{ left: string; right: string }>;
  onChange: (next: Array<{ left: string; right: string }>) => void;
  resolveAsset: (src?: string) => string;
  status?: "correct" | "incorrect" | "idle";
  disabled?: boolean;
  errorMessage?: string;
  onStartInteraction?: () => void;
  onError?: (message: string) => void;
  requestContext?: { day: number; override?: boolean; locale?: "en" | "de"; mode?: "NORMAL" | "VETERAN" };
}

const stripHtml = (value?: string) => value?.replace(/<[^>]+>/g, "") ?? "";

export default function PairItemsPuzzle({
  block,
  pairs,
  onChange,
  resolveAsset,
  status = "idle",
  disabled = false,
  errorMessage,
  onStartInteraction,
  onError,
  requestContext,
}: Props) {
  const { t } = useI18n();
  const leftOptions = useMemo(() => block.leftOptions ?? [], [block.leftOptions]);
  const rightOptions = useMemo(() => block.rightOptions ?? [], [block.rightOptions]);
  const leftMap = useMemo(() => new Map(leftOptions.map((opt) => [opt.id, opt])), [leftOptions]);
  const rightMap = useMemo(() => new Map(rightOptions.map((opt) => [opt.id, opt])), [rightOptions]);
  const solutionPairs = useMemo(
    () =>
      Array.isArray(block.solution)
        ? (block.solution as Array<{ left?: string; right?: string }>).map((pair) => ({
            left: String(pair?.left ?? ""),
            right: String(pair?.right ?? ""),
          }))
        : [],
    [block.solution],
  );
  const displayPairs = block.solved ? solutionPairs : pairs;
  const matchedLeft = useMemo(() => new Set(displayPairs.map((pair) => pair.left)), [displayPairs]);
  const matchedRight = useMemo(() => new Set(displayPairs.map((pair) => pair.right)), [displayPairs]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [checkingPair, setCheckingPair] = useState(false);
  const optionSizeClass = `option-size-${block.optionSize ?? "small"}`;
  const statusClass =
    status === "correct" ? "choice-correct" : status === "incorrect" ? "choice-error" : "";

  const addPair = (leftId: string, rightId: string) => {
    if (disabled || block.solved) return;
    if (matchedLeft.has(leftId) || matchedRight.has(rightId)) return;
    onChange([...pairs, { left: leftId, right: rightId }]);
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  const verifyPair = async (leftId: string, rightId: string) => {
    if (disabled || block.solved) return;
    if (!requestContext?.day) {
      onError?.(t("submissionFailed"));
      setSelectedLeft(null);
      setSelectedRight(null);
      return;
    }
    setCheckingPair(true);
    try {
      const resp = await checkPairItems(
        requestContext.day,
        { puzzleId: block.id, left: leftId, right: rightId },
        requestContext,
      );
      if (resp.match) {
        addPair(leftId, rightId);
      } else {
        onError?.(t("pairItemsMismatch"));
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("submissionFailed");
      onError?.(message);
      setSelectedLeft(null);
      setSelectedRight(null);
    } finally {
      setCheckingPair(false);
    }
  };

  const handleLeftClick = (id: string) => {
    if (disabled || block.solved || checkingPair) return;
    if (matchedLeft.has(id)) return;
    onStartInteraction?.();
    if (selectedLeft === id) {
      setSelectedLeft(null);
      return;
    }
    if (selectedRight) {
      void verifyPair(id, selectedRight);
    } else {
      setSelectedLeft(id);
    }
  };

  const handleRightClick = (id: string) => {
    if (disabled || block.solved || checkingPair) return;
    if (matchedRight.has(id)) return;
    onStartInteraction?.();
    if (selectedRight === id) {
      setSelectedRight(null);
      return;
    }
    if (selectedLeft) {
      void verifyPair(selectedLeft, id);
    } else {
      setSelectedRight(id);
    }
  };

  const removePair = (leftId: string, rightId: string) => {
    if (disabled || block.solved) return;
    onStartInteraction?.();
    onChange(pairs.filter((pair) => !(pair.left === leftId && pair.right === rightId)));
  };

  return (
    <div className="pair-items-wrapper">
      <div className="puzzle-hint">{t("pairItemsHint")}</div>
      {errorMessage && <div className="banner error">{errorMessage}</div>}
      <div className="pair-items-columns">
        <div className="pair-items-column">
          {leftOptions.map((opt) => {
            const selected = selectedLeft === opt.id;
            const matched = matchedLeft.has(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                className={`pair-item choice-item ${optionSizeClass} ${statusClass} ${selected ? "selected" : ""} ${
                  matched ? "matched" : ""
                }`}
                onClick={() => handleLeftClick(opt.id)}
                disabled={disabled || block.solved || matched || checkingPair}
                aria-pressed={selected}
              >
                <div className="choice-visual">
                  {opt.image && (
                    <img
                      src={resolveAsset(opt.image)}
                      alt={stripHtml(opt.label) || opt.id}
                      className={`choice-image ${optionSizeClass}`}
                    />
                  )}
                  {opt.label && <span className="choice-label" dangerouslySetInnerHTML={{ __html: opt.label }} />}
                </div>
              </button>
            );
          })}
        </div>
        <div className="pair-items-column">
          {rightOptions.map((opt) => {
            const selected = selectedRight === opt.id;
            const matched = matchedRight.has(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                className={`pair-item choice-item ${optionSizeClass} ${statusClass} ${selected ? "selected" : ""} ${
                  matched ? "matched" : ""
                }`}
                onClick={() => handleRightClick(opt.id)}
                disabled={disabled || block.solved || matched || checkingPair}
                aria-pressed={selected}
              >
                <div className="choice-visual">
                  {opt.image && (
                    <img
                      src={resolveAsset(opt.image)}
                      alt={stripHtml(opt.label) || opt.id}
                      className={`choice-image ${optionSizeClass}`}
                    />
                  )}
                  {opt.label && <span className="choice-label" dangerouslySetInnerHTML={{ __html: opt.label }} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {displayPairs.length > 0 && (
        <div className="pair-items-matches">
          {displayPairs.map((pair, idx) => {
            const left = leftMap.get(pair.left);
            const right = rightMap.get(pair.right);
            return (
              <button
                key={`${pair.left}-${pair.right}-${idx}`}
                type="button"
                className="pair-items-match"
                onClick={() => removePair(pair.left, pair.right)}
                disabled={disabled || block.solved}
              >
                <div className="pair-items-match-card">
                  {left?.image && (
                    <img src={resolveAsset(left.image)} alt={stripHtml(left.label) || left.id} />
                  )}
                  <span
                    className="pair-items-match-label"
                    dangerouslySetInnerHTML={{ __html: left?.label ?? left?.id ?? "" }}
                  />
                </div>
                <div className="pair-items-match-card">
                  {right?.image && (
                    <img src={resolveAsset(right.image)} alt={stripHtml(right.label) || right.id} />
                  )}
                  <span
                    className="pair-items-match-label"
                    dangerouslySetInnerHTML={{ __html: right?.label ?? right?.id ?? "" }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
