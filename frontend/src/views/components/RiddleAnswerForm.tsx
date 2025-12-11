import { useEffect, useMemo, useState } from "react";
import type { DayBlock, RiddleAnswerPayload } from "../../types";
import { useI18n } from "../../i18n";
import DragSocketsPuzzle from "./drag/DragSocketsPuzzle";
import SelectItemsPuzzle from "./drag/SelectItemsPuzzle";

interface Props {
  block: Extract<DayBlock, { kind: "puzzle" }>;
  submitting: boolean;
  status?: "correct" | "incorrect" | "idle";
  onInteract?: (puzzleId: string) => void;
  onSubmit: (payload: RiddleAnswerPayload) => void;
  canResetDefaults?: boolean;
}

export default function RiddleAnswerForm({ block, submitting, status = "idle", onInteract, onSubmit, canResetDefaults = false }: Props) {
  const { t } = useI18n();
  const backendBase =
    import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ||
    (window.location.origin.includes("localhost:5173") ? "http://localhost:4000" : window.location.origin);
  const resolveImage = (src?: string) =>
    src && src.startsWith("/assets/") && backendBase ? `${backendBase}/content-${src.slice(1)}` : src ?? "";

  const [textAnswer, setTextAnswer] = useState("");
  const [singleChoice, setSingleChoice] = useState("");
  const [multiChoices, setMultiChoices] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [dragAssignments, setDragAssignments] = useState<Record<string, string | undefined>>({});
  const [localError, setLocalError] = useState<string | null>(null);
  const [initializedDefaults, setInitializedDefaults] = useState(false);
  const defaultAssignments = useMemo(() => {
    if (block.type !== "drag-sockets") return {};
    const items = block.items ?? [];
    const defaults: Record<string, string> = {};
    items.forEach((itm) => {
      if (itm.defaultSocketId) {
        defaults[itm.defaultSocketId] = itm.id;
      }
    });
    return defaults;
  }, [block]);

  useEffect(() => {
    setSelectedItems([]);
    // Preserve selections while unsolved; only hydrate from solution when solved
    if (block.solved) {
      if (typeof block.solution === "string") {
        setTextAnswer(String(block.solution));
        setSingleChoice(String(block.solution));
        setMultiChoices([]);
        setDragAssignments(defaultAssignments);
        if (block.type === "select-items") {
          setSelectedItems([String(block.solution)]);
        }
      } else if (Array.isArray(block.solution)) {
        setTextAnswer("");
        setSingleChoice("");
        setMultiChoices(block.solution as string[]);
        if (block.type === "drag-sockets") {
          const solvedPlacements: Record<string, string> = {};
          (block.solution as Array<{ socketId?: string; itemId?: string }>).forEach((entry) => {
            if (entry?.socketId && entry?.itemId) {
              solvedPlacements[entry.socketId] = entry.itemId;
            }
          });
          setDragAssignments(Object.keys(solvedPlacements).length ? solvedPlacements : defaultAssignments);
        } else if (block.type === "select-items") {
          setSelectedItems((block.solution as Array<unknown>).map((entry) => String(entry)));
        }
      } else if (block.type === "drag-sockets" && block.solution && typeof block.solution === "object") {
        const solvedPlacements: Record<string, string> = {};
        const solutionSockets =
          "sockets" in (block.solution as Record<string, unknown>)
            ? ((block.solution as { sockets?: Array<{ socketId?: string; itemId?: string; listId?: string }> }).sockets ?? [])
            : [];
        const listMap: Map<string, string[]> =
          "lists" in (block.solution as Record<string, unknown>)
            ? new Map(
                ((block.solution as { lists?: Array<{ id?: string; items?: string[] }> }).lists ?? []).map((lst) => [
                  lst?.id ?? "",
                  lst?.items ?? [],
                ]),
              )
            : new Map();
        const listCursors = new Map<string, number>();
        solutionSockets.forEach((entry) => {
          if (!entry?.socketId) return;
          let itemId = entry.itemId;
          if (!itemId && entry.listId) {
            const listItems = listMap.get(entry.listId) ?? [];
            const cursor = listCursors.get(entry.listId) ?? 0;
            if (cursor < listItems.length) {
              itemId = listItems[cursor];
              listCursors.set(entry.listId, cursor + 1);
            }
          }
          if (itemId) {
            solvedPlacements[entry.socketId] = itemId;
          }
        });
        setDragAssignments(Object.keys(solvedPlacements).length ? solvedPlacements : defaultAssignments);
      } else if (block.type === "select-items" && block.solution && typeof block.solution === "object") {
        const items = "items" in (block.solution as Record<string, unknown>) ? (block.solution as { items?: unknown }).items : [];
        if (Array.isArray(items)) {
          setSelectedItems(items.map((entry) => String(entry)));
        }
      } else {
        setDragAssignments({});
      }
    }
    setLocalError(null);
    setInitializedDefaults(false);
  }, [block.id, block.solved, block.solution, block.type, defaultAssignments]);

  useEffect(() => {
    if (block.type !== "drag-sockets" || block.solved) return;
    if (initializedDefaults) return;
    if (Object.keys(defaultAssignments).length > 0) {
      setDragAssignments((prev) => ({ ...defaultAssignments, ...prev }));
    }
    setInitializedDefaults(true);
  }, [block, initializedDefaults, defaultAssignments]);

  // Clear local drag error when user interacts
  useEffect(() => {
    if (block.type === "drag-sockets" && localError) {
      setLocalError(null);
    }
    // Only run when assignments change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragAssignments]);
  useEffect(() => {
    if (block.type === "select-items" && localError) {
      setLocalError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItems]);

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
      onInteract?.(block.id);
      onSubmit({ puzzleId: block.id, type: "text", answer: trimmed });
      return;
    }

    if (block.type === "single-choice") {
      if (!singleChoice) {
        setLocalError(t("chooseOne"));
        return;
      }
      onInteract?.(block.id);
      onSubmit({ puzzleId: block.id, type: "single-choice", answer: singleChoice });
      return;
    }

    if (block.type === "multi-choice") {
      const minSelections = block.minSelections ?? 1;
      if (multiChoices.length < minSelections) {
        setLocalError(minSelections > 1 ? `${t("chooseMany")} (${minSelections}+)` : t("chooseMany"));
        return;
      }
      onInteract?.(block.id);
      onSubmit({ puzzleId: block.id, type: "multi-choice", answer: multiChoices });
      return;
    }

    if (block.type === "select-items") {
      if (selectedItems.length === 0) {
        setLocalError(t("selectItemsRequired"));
        return;
      }
      onInteract?.(block.id);
      onSubmit({ puzzleId: block.id, type: "select-items", answer: Array.from(new Set(selectedItems)) });
      return;
    }

    if (block.type === "drag-sockets") {
      const sockets = block.sockets ?? [];
      if (!sockets.length) {
        setLocalError(t("submissionFailed"));
        return;
      }
      const solutionEntries = Array.isArray(block.solution)
        ? (block.solution as Array<{ socketId?: string; itemId?: string }>)
        : block.solution && typeof block.solution === "object" && "sockets" in (block.solution as Record<string, unknown>)
          ? ((block.solution as { sockets?: Array<{ socketId?: string; itemId?: string; listId?: string }> }).sockets ?? [])
          : [];

      const presenceOnly = solutionEntries.length > 0 && solutionEntries.every((entry) => entry && !entry.socketId);
      if (presenceOnly) {
        const requiredCount = solutionEntries.filter((e) => e?.itemId).length;
        const placedCount = Object.values(dragAssignments).filter(Boolean).length;
        if (placedCount < requiredCount) {
          setLocalError(t("placeAllItems"));
          return;
        }
      } else {
        const requiredSockets = new Set(
          solutionEntries.map((entry) => entry?.socketId).filter((id): id is string => Boolean(id)),
        );
        if (requiredSockets.size === 0) {
          sockets.forEach((socket) => requiredSockets.add(socket.id));
        }
        const missing = Array.from(requiredSockets).filter((id) => !dragAssignments[id]);
        if (missing.length > 0) {
          setLocalError(t("placeAllItems"));
          return;
        }
      }
      const answer = sockets
        .map((socket) => ({
          socketId: socket.id,
          itemId: dragAssignments[socket.id],
        }))
        .filter((entry): entry is { socketId: string; itemId: string } => Boolean(entry.itemId));
      onInteract?.(block.id);
      onSubmit({ puzzleId: block.id, type: "drag-sockets", answer });
      return;
    }

    setLocalError("Unsupported puzzle type");
  };

  const statusClass =
    status === "correct" ? "choice-correct" : status === "incorrect" ? "choice-error" : submitting ? "choice-pending" : "";
  const effectiveStatus =
    (block.type === "drag-sockets" || block.type === "select-items") && localError ? "incorrect" : status;
  const dragStatus: "correct" | "incorrect" | "idle" =
    effectiveStatus === "correct" ? "correct" : effectiveStatus === "incorrect" ? "incorrect" : "idle";
  const selectStatus: "correct" | "incorrect" | "idle" =
    effectiveStatus === "correct" ? "correct" : effectiveStatus === "incorrect" ? "incorrect" : "idle";
  const optionSize = (block.kind === "puzzle" && "optionSize" in block && block.optionSize) || "small";
  const optionSizeClass = `option-size-${optionSize}`;
  const renderLabel = (label?: string) =>
    label ? <span className="choice-label" dangerouslySetInnerHTML={{ __html: label }} /> : null;
  const plainText = (label?: string) => label?.replace(/<[^>]+>/g, "") ?? undefined;

  const renderChoices = () => {
    if (!block.options) return null;
    if (block.type === "single-choice") {
      return (
        <>
          <div className="puzzle-hint">{t("chooseOne")}</div>
          {localError && <div className="banner error">{localError}</div>}
          <div style={{ height: "8px" }} />
          <div className="choice-list">
            {(block.options ?? []).map((opt) => (
              <label
                key={opt.id}
                className={`choice-item ${singleChoice === opt.id ? "selected" : ""} ${statusClass} ${optionSizeClass}`}
              >
                <input
                  type="radio"
                  name={`single-choice-${block.id}`}
                  value={opt.id}
                  checked={singleChoice === opt.id}
                  onChange={() => {
                    setSingleChoice(opt.id);
                    onInteract?.(block.id);
                  }}
                  disabled={submitting || block.solved}
                />
                <div className="choice-visual">
                  {opt.image && (
                    <img src={resolveImage(opt.image)} alt={plainText(opt.label) || opt.id} className={`choice-image ${optionSizeClass}`} />
                  )}
                  {renderLabel(opt.label)}
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
          <div className="puzzle-hint">
            {t("chooseMany")}
            {block.minSelections && block.minSelections > 1 ? ` (${block.minSelections}+)` : ""}
          </div>
          {localError && <div className="banner error">{localError}</div>}
          <div style={{ height: "8px" }} />
          <div className="choice-list">
            {(block.options ?? []).map((opt) => (
              <label
                key={opt.id}
                className={`choice-item ${multiChoices.includes(opt.id) ? "selected" : ""} ${statusClass} ${optionSizeClass}`}
              >
                <input
                  type="checkbox"
                  value={opt.id}
                  checked={multiChoices.includes(opt.id)}
                  onChange={() => {
                    setMultiChoices((prev) => (prev.includes(opt.id) ? prev.filter((item) => item !== opt.id) : [...prev, opt.id]));
                    onInteract?.(block.id);
                  }}
                  disabled={submitting || block.solved}
                />
                <div className="choice-visual">
                  {opt.image && (
                    <img src={resolveImage(opt.image)} alt={plainText(opt.label) || opt.id} className={`choice-image ${optionSizeClass}`} />
                  )}
                  {renderLabel(opt.label)}
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
      {block.type === "text" && (
        <>
          {localError && <div className="banner error">{localError}</div>}
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
        </>
      )}

      {(block.type === "single-choice" || block.type === "multi-choice") && renderChoices()}

      {block.type === "drag-sockets" && (
        <>
          <DragSocketsPuzzle
            block={block as Extract<typeof block, { type: "drag-sockets" }>}
            assignments={dragAssignments}
            onChange={(next) => {
              setDragAssignments(next);
              onInteract?.(block.id);
            }}
            resolveAsset={resolveImage}
            status={dragStatus}
            disabled={submitting || block.solved}
            errorMessage={localError || undefined}
            onStartInteraction={() => {
              setLocalError(null);
              onInteract?.(block.id);
            }}
          />
        </>
      )}

      {block.type === "select-items" && (
        <SelectItemsPuzzle
          block={block as Extract<typeof block, { type: "select-items" }>}
          selections={selectedItems}
          onChange={(next) => {
            setSelectedItems(Array.from(new Set(next)));
            onInteract?.(block.id);
          }}
          resolveAsset={resolveImage}
          status={selectStatus}
          disabled={submitting || block.solved}
          errorMessage={localError || undefined}
          onStartInteraction={() => {
            setLocalError(null);
            onInteract?.(block.id);
          }}
        />
      )}

      {!block.solved && (
        <div className="actions">
          <button type="submit" className="primary wide" disabled={submitting}>
            {submitting ? "…" : t("submit")}
          </button>
          {block.type === "drag-sockets" && canResetDefaults && (
            <button
              type="button"
              className="ghost wide"
              style={{ marginTop: 10 }}
              onClick={() => {
                setDragAssignments(defaultAssignments);
                setLocalError(null);
              }}
            >
              {t("reset")}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
