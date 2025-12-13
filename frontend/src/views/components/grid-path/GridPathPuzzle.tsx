import { useMemo, useState } from "react";
import type { DayBlock, GridPathSolution } from "../../../types";
import { useI18n } from "../../../i18n";

type GridPathBlock = Extract<DayBlock, { kind: "puzzle" }> & { type: "grid-path" };

interface Props {
  block: GridPathBlock;
  status: "correct" | "incorrect" | "idle";
  disabled?: boolean;
  resolveAsset: (src?: string) => string;
  onSubmit: (answer: GridPathSolution) => void;
  onInteract?: () => void;
}

const extractSolution = (value: unknown): GridPathSolution | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const path = Array.isArray((value as { path?: unknown }).path) ? (value as { path?: Array<unknown> }).path ?? [] : [];
  if (!path.length) return null;
  const normalizedPath = path
    .map((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return null;
      const { x, y } = entry as { x?: unknown; y?: unknown };
      if (!Number.isInteger(Number(x)) || !Number.isInteger(Number(y))) return null;
      return { x: Number(x), y: Number(y) };
    })
    .filter(Boolean) as Array<{ x: number; y: number }>;
  if (!normalizedPath.length) return null;
  const startColumn =
    (value as { startColumn?: unknown }).startColumn !== undefined && Number.isInteger(Number((value as { startColumn?: unknown }).startColumn))
      ? Number((value as { startColumn?: unknown }).startColumn)
      : undefined;
  const goalColumn =
    (value as { goalColumn?: unknown }).goalColumn !== undefined && Number.isInteger(Number((value as { goalColumn?: unknown }).goalColumn))
      ? Number((value as { goalColumn?: unknown }).goalColumn)
      : undefined;
  return { path: normalizedPath, ...(startColumn !== undefined ? { startColumn } : {}), ...(goalColumn !== undefined ? { goalColumn } : {}) };
};

export default function GridPathPuzzle({ block, status, disabled = false, resolveAsset, onSubmit, onInteract }: Props) {
  const { t } = useI18n();
  const presetSolution = useMemo(() => (block.solved ? extractSolution(block.solution) : null), [block.solved, block.solution]);
  const presetStart = presetSolution?.startColumn ?? presetSolution?.path?.[0]?.x ?? null;
  const presetGoal =
    presetSolution?.goalColumn ??
    (presetSolution?.path && presetSolution.path.length > 0 ? presetSolution.path[presetSolution.path.length - 1]?.x ?? null : null);
  const hintStartColumn =
    block.solution && typeof block.solution === "object" && (block.solution as GridPathSolution).startColumn !== undefined
      ? (block.solution as GridPathSolution).startColumn!
      : null;
  const hintGoalColumn =
    block.solution && typeof block.solution === "object" && (block.solution as GridPathSolution).goalColumn !== undefined
      ? (block.solution as GridPathSolution).goalColumn!
      : null;
  const [startColumn, setStartColumn] = useState<number | null>(() => presetStart);
  const [goalColumn, setGoalColumn] = useState<number | null>(() => presetGoal);
  const [path, setPath] = useState<Array<{ x: number; y: number }>>(() => presetSolution?.path ?? []);
  const [locked, setLocked] = useState(() => block.solved);
  const [error, setError] = useState<string | null>(null);
  const grid = useMemo(() => block.grid ?? { width: 9, height: 9 }, [block.grid]);
  const pathMap = useMemo(() => new Map(path.map((coord, idx) => [`${coord.x}:${coord.y}`, idx])), [path]);
  const background = useMemo(() => resolveAsset(block.backgroundImage), [block.backgroundImage, resolveAsset]);
  const isSolved = status === "correct" || block.solved;
  const isIncorrect = status === "incorrect";
  const actionLocked = locked || isSolved || isIncorrect;

  const handleStartSelect = (col: number) => {
    if (disabled || actionLocked) return;
    if (path.length > 0) {
      setError(t("gridPathCannotSwitchStart"));
      return;
    }
    setStartColumn(col);
    setGoalColumn(null);
    setError(null);
    onInteract?.();
  };

  const handleCellClick = (x: number, y: number) => {
    if (disabled || actionLocked) return;
    if (startColumn === null) {
      setError(t("gridPathChooseStart"));
      return;
    }
    const key = `${x}:${y}`;
    if (pathMap.has(key)) {
      setError(t("gridPathNoRevisit"));
      return;
    }
    if (path.length === 0) {
      if (y !== 0) {
        setError(t("gridPathStartTop"));
        return;
      }
      if (x !== startColumn) {
        setError(t("gridPathStartMatchesColumn"));
        return;
      }
    } else {
      const prev = path[path.length - 1];
      const dx = Math.abs(prev.x - x);
      const dy = Math.abs(prev.y - y);
      if (dx + dy !== 1) {
        setError(t("gridPathAdjacency"));
        return;
      }
    }
    setPath((prev) => [...prev, { x, y }]);
    setError(null);
    onInteract?.();
  };

  const handleGoalClick = (col: number) => {
    if (disabled || actionLocked) return;
    if (!path.length) {
      setError(t("gridPathChooseCells"));
      return;
    }
    const last = path[path.length - 1];
    if (last.y !== grid.height - 1) {
      setError(t("gridPathNeedBottom"));
      return;
    }
    if (last.x !== col) {
      setError(t("gridPathGoalColumn"));
      return;
    }
    setGoalColumn(col);
    setLocked(true);
    setError(null);
    onInteract?.();
    onSubmit({ path, ...(startColumn !== null ? { startColumn } : {}), goalColumn: col });
  };

  const handleStepBack = () => {
    if (disabled || actionLocked) return;
    if (path.length === 0) {
      setStartColumn(null);
      setGoalColumn(null);
      setLocked(false);
      setError(null);
      onInteract?.();
      return;
    }
    setPath((prev) => {
      const next = prev.slice(0, -1);
      if (!next.length) {
        setStartColumn(null);
        setGoalColumn(null);
        setLocked(false);
      }
      return next;
    });
    setError(null);
    onInteract?.();
  };

  const handleReset = () => {
    if (disabled) return;
    setPath([]);
    setStartColumn(null);
    setGoalColumn(null);
    setLocked(false);
    setError(null);
    onInteract?.();
  };

  const isAtBottom = path[path.length - 1]?.y === grid.height - 1;
  const currentKey = path.length && !locked ? `${path[path.length - 1]?.x}:${path[path.length - 1]?.y}` : null;
  const boardStyle = {};

  const hasChanges = path.length > 0 || startColumn !== null || goalColumn !== null;
  const canStepBack = !disabled && !actionLocked && (path.length > 0 || startColumn !== null);
  const canReset = !disabled && !isSolved && (hasChanges || locked || isIncorrect);

  const stepBackTitle =
    !canStepBack && isIncorrect
      ? t("gridPathResetAfterIncorrect")
      : !canStepBack && (isSolved || locked)
        ? t("gridPathAlreadySolved")
      : !canStepBack && !hasChanges
        ? t("gridPathNothingToUndo")
        : undefined;

  const resetTitle =
    !canReset && isSolved
      ? t("gridPathResetDisabledSolved")
    : !canReset && !hasChanges
      ? t("gridPathNothingToReset")
      : undefined;

  const canSelectCell = (row: number, col: number) => {
    if (actionLocked || disabled) return false;
    if (pathMap.has(`${col}:${row}`)) return false;
    if (startColumn === null) return false;
    if (path.length === 0) {
      return row === 0 && col === startColumn;
    }
    const last = path[path.length - 1]!;
    const dx = Math.abs(last.x - col);
    const dy = Math.abs(last.y - row);
    return dx + dy === 1;
  };
  return (
    <div className="grid-path-wrapper">
      <div className="puzzle-hint">
        {t("gridPathHint")}
      </div>
      {error && <div className="banner error">{error}</div>}
      <div
        className={`grid-path-board status-${status} ${actionLocked ? "is-locked" : ""} ${startColumn !== null ? "has-start" : ""}`}
      >
        <div className="grid-path-surface" style={boardStyle}>
          <div className="grid-path-row-label">{t("gridPathStartLabel")}</div>
          <div
            className="grid-path-grid"
            style={{ gridTemplateColumns: `repeat(${grid.width}, 1fr)`, gridTemplateRows: `repeat(${grid.height + 2}, 1fr)` }}
          >
            {/* Start row */}
            {Array.from({ length: grid.width }, (_, col) => (
              <button
                key={`start-${col}`}
                type="button"
                className={`grid-path-start ${startColumn === col ? "is-selected" : ""} ${actionLocked ? "is-locked" : ""} ${
                  hintStartColumn === col && startColumn !== col ? "is-hint" : ""
                }`}
                onClick={() => handleStartSelect(col)}
                disabled={disabled || actionLocked}
              >
                {col + 1}
              </button>
            ))}

            {/* Main grid rows */}
            {Array.from({ length: grid.height }).flatMap((_, row) =>
              Array.from({ length: grid.width }).map((_, col) => {
                const key = `${col}:${row}`;
                const stepIndex = pathMap.get(key);
                const isCurrent = currentKey === key;
                const isInPath = stepIndex !== undefined;
                const allowed = canSelectCell(row, col);
                const marginFraction = 0.06; // inset each side of a cell by this fraction of its size
                const startX = (col + marginFraction) / grid.width;
                const startY = (row + marginFraction) / grid.height;
                const sizeX = background ? (grid.width * 100) / Math.max(0.1, 1 - 2 * marginFraction) : undefined;
                const sizeY = background ? (grid.height * 100) / Math.max(0.1, 1 - 2 * marginFraction) : undefined;
                const posX =
                  background && sizeX && sizeX !== 100
                    ? (-startX * sizeX) / (1 - sizeX / 100)
                    : grid.width > 1
                      ? (col / (grid.width - 1)) * 100
                      : 50;
                const posY =
                  background && sizeY && sizeY !== 100
                    ? (-startY * sizeY) / (1 - sizeY / 100)
                    : grid.height > 1
                      ? (row / (grid.height - 1)) * 100
                      : 50;
                const cellBackground =
                  background && sizeX && sizeY
                    ? {
                        backgroundImage: `url(${background})`,
                        backgroundSize: `${sizeX}% ${sizeY}%`,
                        backgroundPosition: `${posX}% ${posY}%`,
                        backgroundRepeat: "no-repeat" as const,
                      }
                    : undefined;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`grid-path-cell ${isInPath ? "is-in-path" : ""} ${isCurrent ? "is-current" : ""} ${!isInPath && !allowed ? "is-blocked" : ""}`}
                    data-step={isInPath ? stepIndex! + 1 : undefined}
                    onClick={() => handleCellClick(col, row)}
                    disabled={disabled || actionLocked || (!allowed && !isInPath)}
                    style={cellBackground}
                  >
                    <span className="sr-only">
                      {col},{row + 1}
                    </span>
                  </button>
                );
              }),
            )}

            {/* Goal row */}
            {Array.from({ length: grid.width }, (_, col) => {
              const isFinishColumn = isAtBottom && path[path.length - 1]?.x === col;
              const isGoalSelected = goalColumn === col;
              const isGoalInPath = path.length > 0 && isFinishColumn && locked;
              return (
                <button
                  key={`goal-${col}`}
                  type="button"
                  className={`grid-path-goal ${isGoalSelected ? "is-selected" : ""} ${isFinishColumn ? "is-available" : ""} ${
                    hintGoalColumn === col && goalColumn !== col ? "is-hint" : ""
                  } ${actionLocked ? "is-locked" : ""} ${isGoalInPath ? "is-in-path" : ""}`}
                  onClick={() => handleGoalClick(col)}
                  disabled={disabled || actionLocked || !isFinishColumn}
                >
                  {col + 1}
                </button>
              );
            })}
          </div>
          <div className="grid-path-row-label">{t("gridPathGoalLabel")}</div>
        </div>
      </div>

      <div className="grid-path-actions">
        <button
          type="button"
          className="ghost"
          onClick={handleStepBack}
          disabled={!canStepBack}
          title={stepBackTitle}
        >
          {t("gridPathStepBack")}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={handleReset}
          disabled={!canReset}
          title={resetTitle}
        >
          {t("reset")}
        </button>
      </div>
    </div>
  );
}
