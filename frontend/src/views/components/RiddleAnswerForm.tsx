import { useEffect, useMemo, useRef, useState } from "react";
import type { DayBlock, RiddleAnswerPayload } from "../../types";
import { useI18n } from "../../i18n";
import DragSocketsPuzzle from "./drag/DragSocketsPuzzle";
import SelectItemsPuzzle from "./drag/SelectItemsPuzzle";
import MemoryPuzzle from "./memory/MemoryPuzzle";
import GridPathPuzzle from "./grid-path/GridPathPuzzle";
import PairItemsPuzzle from "./pair-items/PairItemsPuzzle";

interface Props {
  block: Extract<DayBlock, { kind: "puzzle" }>;
  submitting: boolean;
  status?: "correct" | "incorrect" | "idle";
  onInteract?: (puzzleId: string) => void;
  onSubmit: (payload: RiddleAnswerPayload) => void;
  requestContext?: { day: number; override?: boolean; locale?: "en" | "de"; mode?: "NORMAL" | "VETERAN" };
  resetSignal?: number;
}

export default function RiddleAnswerForm({
  block,
  submitting,
  status = "idle",
  onInteract,
  onSubmit,
  requestContext,
  resetSignal = 0,
}: Props) {
  const { t } = useI18n();
  const backendBase =
    import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ||
    (window.location.origin.includes("localhost:5173") ? "http://localhost:4000" : window.location.origin);
  const resolveImage = (src?: string) =>
    src && backendBase
      ? src.startsWith("/assets/")
        ? `${backendBase}/content-${src.slice(1)}`
        : src.startsWith("/content-asset/")
          ? `${backendBase}${src}`
          : src
      : src ?? "";

  const [textAnswer, setTextAnswer] = useState("");
  const [singleChoice, setSingleChoice] = useState("");
  const [multiChoices, setMultiChoices] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [memoryPairs, setMemoryPairs] = useState<Array<{ a: string; b: string }>>([]);
  const [pairItemsPairs, setPairItemsPairs] = useState<Array<{ left: string; right: string }>>([]);
  const [dragAssignments, setDragAssignments] = useState<Record<string, string | undefined>>({});
  const [localError, setLocalError] = useState<string | null>(null);
  const [initializedDefaults, setInitializedDefaults] = useState(false);
  const prevBlockId = useRef<string | null>(null);
  const prevSolvedRef = useRef<boolean>(false);
  const memorySubmittedRef = useRef(false);
  const pairItemsSubmittedRef = useRef(false);
  const isPlaceholder = block.type === "placeholder";
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
    // Preserve selections while unsolved; only hydrate from solution when solved
    if (block.solved) {
      if (typeof block.solution === "string") {
        setTextAnswer(String(block.solution));
        setSingleChoice(String(block.solution));
        setMultiChoices([]);
        setDragAssignments(defaultAssignments);
        if (block.type === "memory") {
          setMemoryPairs([]);
        }
        if (block.type === "pair-items") {
          setPairItemsPairs([]);
        }
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
        } else if (block.type === "memory") {
          const solvedPairs = (block.solution as Array<unknown>).map((entry) => {
            if (entry && typeof entry === "object" && !Array.isArray(entry)) {
              const { a, b, first, second } = entry as { a?: unknown; b?: unknown; first?: unknown; second?: unknown };
              return { a: String(a ?? first ?? ""), b: String(b ?? second ?? "") };
            }
            if (Array.isArray(entry) && entry.length === 2) {
              return { a: String(entry[0]), b: String(entry[1]) };
            }
            return { a: "", b: "" };
          });
          setMemoryPairs(solvedPairs.filter((p) => p.a && p.b));
        } else if (block.type === "select-items") {
          setSelectedItems((block.solution as Array<unknown>).map((entry) => String(entry)));
        } else if (block.type === "pair-items") {
          const solvedPairs = (block.solution as Array<unknown>).map((entry) => {
            if (entry && typeof entry === "object" && !Array.isArray(entry)) {
              const { left, right } = entry as { left?: unknown; right?: unknown };
              return { left: String(left ?? ""), right: String(right ?? "") };
            }
            if (Array.isArray(entry) && entry.length === 2) {
              return { left: String(entry[0]), right: String(entry[1]) };
            }
            return { left: "", right: "" };
          });
          setPairItemsPairs(solvedPairs.filter((p) => p.left && p.right));
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
      } else if (block.type === "memory" && block.solution && typeof block.solution === "object") {
        const pairs = "pairs" in (block.solution as Record<string, unknown>) ? (block.solution as { pairs?: unknown }).pairs : [];
        if (Array.isArray(pairs)) {
          const mapped = pairs
            .map((entry) => {
              if (entry && typeof entry === "object" && !Array.isArray(entry)) {
                const { a, b, first, second } = entry as { a?: unknown; b?: unknown; first?: unknown; second?: unknown };
                return { a: String(a ?? first ?? ""), b: String(b ?? second ?? "") };
              }
              if (Array.isArray(entry) && entry.length === 2) {
                return { a: String(entry[0]), b: String(entry[1]) };
              }
              return null;
            })
            .filter(Boolean) as Array<{ a: string; b: string }>;
          setMemoryPairs(mapped);
        }
      } else if (block.type === "pair-items" && block.solution && typeof block.solution === "object") {
        const pairs = "pairs" in (block.solution as Record<string, unknown>) ? (block.solution as { pairs?: unknown }).pairs : [];
        if (Array.isArray(pairs)) {
          const mapped = pairs
            .map((entry) => {
              if (entry && typeof entry === "object" && !Array.isArray(entry)) {
                const { left, right } = entry as { left?: unknown; right?: unknown };
                return { left: String(left ?? ""), right: String(right ?? "") };
              }
              if (Array.isArray(entry) && entry.length === 2) {
                return { left: String(entry[0]), right: String(entry[1]) };
              }
              return null;
            })
            .filter(Boolean) as Array<{ left: string; right: string }>;
          setPairItemsPairs(mapped);
        }
      } else {
        setDragAssignments({});
      }
    } else if (block.id !== prevBlockId.current || (prevSolvedRef.current && !block.solved)) {
      // Reset on first load of a new puzzle or when a solved puzzle is reset
      setTextAnswer("");
      setSingleChoice("");
      setMultiChoices([]);
      setSelectedItems([]);
      setMemoryPairs([]);
      setPairItemsPairs([]);
      if (block.type !== "drag-sockets") {
        setDragAssignments(defaultAssignments);
      }
    }
    setLocalError(null);
    setInitializedDefaults(false);
    prevBlockId.current = block.id;
    prevSolvedRef.current = Boolean(block.solved);
    memorySubmittedRef.current = false;
    pairItemsSubmittedRef.current = false;
  }, [block.id, block.solution, block.solved, block.type, defaultAssignments]);

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
  useEffect(() => {
    if (block.type === "memory" && localError) {
      setLocalError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoryPairs]);
  useEffect(() => {
    if (block.type === "pair-items" && localError) {
      setLocalError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairItemsPairs]);

  // Clear local state on explicit reset signal (per puzzle); drag-sockets keep placements
  useEffect(() => {
    if (!resetSignal) return;
    if (block.type !== "drag-sockets") {
      setTextAnswer("");
      setSingleChoice("");
      setMultiChoices([]);
      setSelectedItems([]);
      setMemoryPairs([]);
      setPairItemsPairs([]);
      setDragAssignments(defaultAssignments);
    }
    setLocalError(null);
    setInitializedDefaults(false);
    memorySubmittedRef.current = false;
    pairItemsSubmittedRef.current = false;
  }, [resetSignal, block.type, defaultAssignments]);

  useEffect(() => {
    if (block.type !== "memory") return;
    const totalPairs = Math.floor((block.cards?.length ?? 0) / 2);
    if (totalPairs > 0 && memoryPairs.length >= totalPairs && !block.solved && !memorySubmittedRef.current && !submitting) {
      memorySubmittedRef.current = true;
      onInteract?.(block.id);
      onSubmit({ puzzleId: block.id, type: "memory", answer: memoryPairs });
    }
  }, [block, memoryPairs, onSubmit, onInteract, submitting]);
  useEffect(() => {
    if (block.type !== "pair-items") return;
    const totalPairs = Math.min(block.leftOptions?.length ?? 0, block.rightOptions?.length ?? 0);
    if (totalPairs > 0 && pairItemsPairs.length >= totalPairs && !block.solved && !pairItemsSubmittedRef.current && !submitting) {
      pairItemsSubmittedRef.current = true;
      onInteract?.(block.id);
      onSubmit({ puzzleId: block.id, type: "pair-items", answer: pairItemsPairs });
    }
  }, [block, pairItemsPairs, onSubmit, onInteract, submitting]);

  const handleSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    setLocalError(null);
    if (submitting || block.solved || isPlaceholder) return;

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

    if (block.type === "memory") {
      const totalPairs = (block.cards?.length ?? 0) / 2;
      if (!totalPairs || memoryPairs.length < totalPairs) {
        setLocalError(t("matchAllPairs"));
        return;
      }
      onInteract?.(block.id);
      onSubmit({ puzzleId: block.id, type: "memory", answer: memoryPairs });
      return;
    }

    if (block.type === "pair-items") {
      const totalPairs = Math.min(block.leftOptions?.length ?? 0, block.rightOptions?.length ?? 0);
      if (!totalPairs || pairItemsPairs.length < totalPairs) {
        setLocalError(t("matchAllPairs"));
        return;
      }
      onInteract?.(block.id);
      onSubmit({ puzzleId: block.id, type: "pair-items", answer: pairItemsPairs });
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

    if (block.type === "grid-path") {
      return;
    }

    setLocalError("Unsupported puzzle type");
  };

  const statusClass =
    status === "correct" ? "choice-correct" : status === "incorrect" ? "choice-error" : submitting ? "choice-pending" : "";
  const effectiveStatus =
    (block.type === "drag-sockets" ||
      block.type === "select-items" ||
      block.type === "memory" ||
      block.type === "pair-items" ||
      block.type === "grid-path") &&
    localError
      ? "incorrect"
      : status;
  const dragStatus: "correct" | "incorrect" | "idle" =
    effectiveStatus === "correct" ? "correct" : effectiveStatus === "incorrect" ? "incorrect" : "idle";
  const selectStatus: "correct" | "incorrect" | "idle" =
    effectiveStatus === "correct" ? "correct" : effectiveStatus === "incorrect" ? "incorrect" : "idle";
  const memoryStatus: "correct" | "incorrect" | "idle" =
    effectiveStatus === "correct" ? "correct" : effectiveStatus === "incorrect" ? "incorrect" : "idle";
  const pairItemsStatus: "correct" | "incorrect" | "idle" =
    effectiveStatus === "correct" ? "correct" : effectiveStatus === "incorrect" ? "incorrect" : "idle";
  const gridPathStatus: "correct" | "incorrect" | "idle" =
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
      const isOrdered = Boolean(block.ordered);
      return (
        <>
          <div className="puzzle-hint">
            {isOrdered ? t("chooseManyOrdered") : t("chooseMany")}
            {block.minSelections && block.minSelections > 1 ? ` (${block.minSelections}+)` : ""}
          </div>
          {localError && <div className="banner error">{localError}</div>}
          <div style={{ height: "8px" }} />
          <div className={`choice-list ${isOrdered ? "ordered" : ""}`}>
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
                    setMultiChoices((prev) =>
                      prev.includes(opt.id) ? prev.filter((item) => item !== opt.id) : [...prev, opt.id],
                    );
                    onInteract?.(block.id);
                  }}
                  disabled={submitting || block.solved}
                />
                <div className="choice-visual">
                  {isOrdered && multiChoices.includes(opt.id) && (
                    <span className="choice-order">{multiChoices.indexOf(opt.id) + 1}</span>
                  )}
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
      {block.type === "placeholder" && <div className="banner info">{t("placeholderOnlySolveNow")}</div>}

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

      {block.type === "memory" && (
        <MemoryPuzzle
          key={`${block.id}-${block.solved ? "solved" : "play"}-${resetSignal}`}
          block={block as Extract<typeof block, { type: "memory" }>}
          requestContext={requestContext}
          onChange={(pairs) => {
            setMemoryPairs(pairs);
            onInteract?.(block.id);
          }}
          resolveAsset={resolveImage}
          status={memoryStatus}
          disabled={submitting || block.solved}
          errorMessage={localError || undefined}
          onStartInteraction={() => {
            setLocalError(null);
            onInteract?.(block.id);
          }}
        />
      )}

      {block.type === "pair-items" && (
        <PairItemsPuzzle
          key={`${block.id}-${block.solved ? "solved" : "play"}-${resetSignal}`}
          block={block as Extract<typeof block, { type: "pair-items" }>}
          pairs={pairItemsPairs}
          onChange={(next) => {
            setPairItemsPairs(next);
            onInteract?.(block.id);
          }}
          resolveAsset={resolveImage}
          status={pairItemsStatus}
          disabled={submitting || block.solved}
          errorMessage={localError || undefined}
          onStartInteraction={() => {
            setLocalError(null);
            onInteract?.(block.id);
          }}
          onError={(message) => setLocalError(message)}
          requestContext={requestContext}
        />
      )}

      {block.type === "grid-path" && (
        <GridPathPuzzle
          key={`${block.id}-${block.solved ? "solved" : "play"}-${resetSignal}`}
          block={block as Extract<typeof block, { type: "grid-path" }>}
          status={gridPathStatus}
          disabled={submitting || block.solved}
          resolveAsset={resolveImage}
          onInteract={() => {
            setLocalError(null);
            onInteract?.(block.id);
          }}
          onSubmit={(answer) => {
            setLocalError(null);
            onInteract?.(block.id);
            onSubmit({ puzzleId: block.id, type: "grid-path", answer });
          }}
        />
      )}

      {!block.solved &&
        block.type !== "memory" &&
        block.type !== "pair-items" &&
        block.type !== "grid-path" &&
        block.type !== "placeholder" && (
        <div className="actions">
          <button type="submit" className="primary wide" disabled={submitting}>
            {submitting ? "…" : t("submit")}
          </button>
        </div>
      )}
    </form>
  );
}
