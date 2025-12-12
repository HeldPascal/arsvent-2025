import { useEffect, useMemo, useRef, useState } from "react";
import type { DayBlock, MemoryCard } from "../../../types";
import { useI18n } from "../../../i18n";

type MemoryBlock = Extract<DayBlock, { kind: "puzzle" }> & {
  type: "memory";
  cards?: MemoryCard[];
  backImage?: string;
  hoverBackImage?: string;
  maxMisses?: number | null;
  missIndicator?: "deplete" | "fill";
};

interface Props {
  block: MemoryBlock;
  onChange: (pairs: Array<{ a: string; b: string }>) => void;
  resolveAsset: (src?: string) => string;
  status?: "correct" | "incorrect" | "idle";
  disabled?: boolean;
  errorMessage?: string;
  onStartInteraction?: () => void;
}

const shuffleCards = (cards: MemoryCard[]) => {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
};

const bestGrid = (count: number, cardRatio: number) => {
  let best = { cols: count, rows: 1, score: Number.POSITIVE_INFINITY };
  for (let cols = 1; cols <= count; cols += 1) {
    const rows = Math.ceil(count / cols);
    const boardRatio = (cols * cardRatio) / rows; // approximate board width/height ratio
    const score = Math.abs(boardRatio - 1) + rows * 0.001; // prefer square, slight bias to fewer rows
    if (score < best.score) {
      best = { cols, rows, score };
    }
  }
  return { cols: best.cols, rows: best.rows };
};

export default function MemoryPuzzle({
  block,
  onChange,
  resolveAsset,
  status = "idle",
  disabled = false,
  errorMessage,
  onStartInteraction,
}: Props) {
  const { t } = useI18n();
  const cards: MemoryCard[] = useMemo(() => block.cards ?? [], [block.cards]);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [shuffled, setShuffled] = useState<MemoryCard[]>(() => shuffleCards(cards));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [foundPairs, setFoundPairs] = useState<Array<{ a: string; b: string }>>([]);
  const [misses, setMisses] = useState(0);
  const [justReset, setJustReset] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [burstLost, setBurstLost] = useState<Map<number, string>>(new Map());
  const [burstGain, setBurstGain] = useState<Map<number, string>>(new Map());
  const prevMissesRef = useRef(0);

  const pairsFromSolution = useMemo(
    () =>
      Array.isArray(block.solution)
        ? (block.solution as Array<{ a?: string; b?: string }>).map((pair) => ({
            a: String(pair?.a ?? ""),
            b: String(pair?.b ?? ""),
          }))
        : [],
    [block.solution],
  );

  const pairKeyByCard = useMemo(() => {
    const map = new Map<string, string>();
    pairsFromSolution.forEach((pair, idx) => {
      const key = `pair-${idx}`;
      if (pair.a) map.set(pair.a, key);
      if (pair.b) map.set(pair.b, key);
    });
    return map;
  }, [pairsFromSolution]);

  const pairByKey = useMemo(() => {
    const map = new Map<string, { a: string; b: string }>();
    pairsFromSolution.forEach((pair, idx) => {
      map.set(`pair-${idx}`, { a: pair.a, b: pair.b });
    });
    return map;
  }, [pairsFromSolution]);

  const solvedMode = block.solved;
  const displayMatched = solvedMode ? new Set(cards.map((card) => card.id)) : matched;
  const displayPairs = solvedMode ? pairsFromSolution.map((p) => ({ a: p.a, b: p.b })) : foundPairs;
  const displayCards = solvedMode
    ? cards.map((card) => ({ ...card, _removed: true } as MemoryCard & { _removed?: boolean }))
    : (shuffled as Array<MemoryCard & { _removed?: boolean }>);
  const effectiveRatio = aspectRatio ?? 0.75;
  const grid = bestGrid(displayCards.length || 1, effectiveRatio);
  const flipBackMs = block.flipBackMs ?? 700;
  const missAnimation = block.missIndicatorAnimation ?? null;
  const compact = viewportWidth < 640;
  const minCard = compact ? 80 : 110;
  const maxCard = compact ? 130 : 150;
  const cardGap = compact ? 4 : 6;
  const availableWidth = Math.max(
    220,
    Math.min(
      containerWidth !== null ? containerWidth : viewportWidth,
      viewportWidth,
    ) - (compact ? 12 : 16),
  );
  const maxColsByWidth = Math.max(1, Math.floor((availableWidth + cardGap) / (minCard + cardGap)));
  const effectiveCols = Math.max(1, Math.min(grid.cols, maxColsByWidth, displayCards.length || 1));
  const gridMaxWidth = Math.min(
    effectiveCols * (maxCard + cardGap) + cardGap,
    Math.max(availableWidth, minCard + cardGap * 2),
    960,
  );

  useEffect(() => {
    const updateViewport = () => setViewportWidth(typeof window !== "undefined" ? window.innerWidth : 1024);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!wrapperRef.current || typeof ResizeObserver === "undefined") return;
    const node = wrapperRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect?.width) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sample = cards[0];
    const src = sample?.image || block.backImage;
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = resolveAsset(src);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, block.backImage]); // resolveAsset intentionally omitted to avoid unstable deps

  useEffect(() => {
    if (block.solved) {
      setShuffled(cards);
      setMatched(new Set(cards.map((c) => c.id)));
      setFoundPairs(pairsFromSolution.map((p) => ({ a: p.a, b: p.b })));
      setFlipped([]);
      setMisses(0);
      setJustReset(false);
      setBurstLost(new Map());
      setBurstGain(new Map());
      prevMissesRef.current = 0;
      return;
    }
    setShuffled(shuffleCards(cards));
    setFlipped([]);
    setMatched(new Set());
    setFoundPairs([]);
    setMisses(0);
    setJustReset(false);
    setBurstLost(new Map());
    setBurstGain(new Map());
    prevMissesRef.current = 0;
  }, [block.id, block.solved, cards, pairsFromSolution]);

  useEffect(() => {
    if (solvedMode) return;
    onChange(foundPairs);
    // onChange intentionally not in deps to avoid re-trigger loops from new handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foundPairs, solvedMode]);

  const maxMisses = block.maxMisses ?? null;
  useEffect(() => {
    if (maxMisses === null || solvedMode) return;
    const style = block.missIndicator ?? "deplete";
    const prev = prevMissesRef.current;
    if (misses > prev) {
      const idx = style === "deplete" ? prev : misses - 1;
      if (missAnimation) {
        const cls = missAnimation === "shatter" ? "shatter" : "burst";
        setBurstLost((map) => {
          const next = new Map(map);
          next.set(idx, cls);
          return next;
        });
        setTimeout(() => {
          setBurstLost((map) => {
            const next = new Map(map);
            next.delete(idx);
            return next;
          });
        }, 500);
      }
    } else if (misses < prev) {
      const idx = style === "deplete" ? misses : prev - 1;
      if (missAnimation) {
        setBurstGain((map) => {
          const next = new Map(map);
          next.set(idx, "gain");
          return next;
        });
        setTimeout(() => {
          setBurstGain((map) => {
            const next = new Map(map);
            next.delete(idx);
            return next;
          });
        }, 500);
      }
    }
    prevMissesRef.current = misses;
  }, [misses, block.missIndicator, maxMisses, missAnimation, solvedMode]);

  const handleReset = () => {
    setMatched(new Set());
    setFoundPairs([]);
    setFlipped([]);
    setMisses(0);
    setShuffled(shuffleCards(cards));
    setJustReset(true);
    onChange([]);
  };

  const tryMatch = (cardId: string) => {
    if (disabled || block.solved) return;
    if (matched.has(cardId) || flipped.includes(cardId)) return;
    if (flipped.length === 2) return;
    if (justReset) setJustReset(false);
    onStartInteraction?.();
    const nextFlipped = [...flipped, cardId];
    setFlipped(nextFlipped);
    if (nextFlipped.length === 2) {
      const [first, second] = nextFlipped;
      const firstKey = pairKeyByCard.get(first);
      const secondKey = pairKeyByCard.get(second);
      const isMatch = firstKey && secondKey && firstKey === secondKey;
      if (isMatch) {
        setTimeout(() => {
          setMatched((prev) => new Set([...prev, first, second]));
          const canonical = firstKey ? pairByKey.get(firstKey) : null;
          const pairForRecord = canonical ?? { a: first, b: second };
          const pairKey = [pairForRecord.a, pairForRecord.b].sort().join("|");
          setFoundPairs((prev) => {
            if (prev.some((p) => [p.a, p.b].sort().join("|") === pairKey)) return prev;
            return [...prev, { a: pairForRecord.a, b: pairForRecord.b }];
          });
          setFlipped([]);
        }, 250);
      } else {
        setTimeout(() => {
          setFlipped([]);
        }, flipBackMs);
        setMisses((prev) => {
          const next = prev + 1;
          if (maxMisses !== null && next >= maxMisses) {
            setTimeout(handleReset, 750);
          }
          return next;
        });
      }
    }
  };

  const renderMissIndicator = () => {
    if (maxMisses === null) return null;
    const tokens = Array.from({ length: maxMisses }, (_, idx) => idx);
    const style = block.missIndicator ?? "deplete";
    return (
      <div className="memory-miss-wrapper">
        <div className="memory-miss-label">
          {t("memoryMisses", { count: Math.max(maxMisses - misses, 0) })}
        </div>
        <div className={`memory-miss-track ${style}`}>
          {tokens.map((idx) => {
            const filled = style === "deplete" ? idx >= misses : idx < misses;
            const burstClass = burstLost.get(idx) ?? burstGain.get(idx) ?? "";
            return <div key={idx} className={`memory-miss-token ${filled ? "is-filled" : ""} ${burstClass}`} aria-hidden />;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="memory-wrapper" ref={wrapperRef}>
      <div className="puzzle-hint">{t("memoryHint")}</div>
      {errorMessage && <div className="banner error">{errorMessage}</div>}
      {renderMissIndicator()}
      <div
        className={`memory-grid status-${status}`}
        style={{
          gridTemplateColumns: `repeat(${effectiveCols}, minmax(${minCard}px, ${maxCard}px))`,
          maxWidth: `${gridMaxWidth}px`,
          gap: `${cardGap}px`,
          padding: compact ? "6px" : "8px",
        }}
      >
        {displayCards.map((card) => {
          const isRemoved = Boolean((card as { _removed?: boolean })._removed) || (!block.solved && matched.has(card.id));
          const ratioStyle = aspectRatio ? { ["--memory-card-ratio" as string]: `${aspectRatio}` } : undefined;
          if (isRemoved) {
            return <div key={card.id} className="memory-card is-removed" style={ratioStyle} aria-hidden />;
          }
          const faceUp = block.solved || displayMatched.has(card.id) || flipped.includes(card.id);
          const isMatched = displayMatched.has(card.id);
          const backUrl = resolveAsset(block.backImage);
          const hoverUrl = block.hoverBackImage ? resolveAsset(block.hoverBackImage) : null;
          return (
            <button
              key={card.id}
              type="button"
              className={`memory-card ${faceUp ? "is-flipped" : ""} ${isMatched ? "is-matched" : ""}`}
              onClick={() => tryMatch(card.id)}
              disabled={disabled || block.solved}
              aria-pressed={faceUp}
              style={{
                ["--memory-back" as string]: `url(${backUrl})`,
                ...(hoverUrl ? { ["--memory-back-hover" as string]: `url(${hoverUrl})` } : {}),
                ...(ratioStyle ?? {}),
              }}
            >
              <div className="memory-card-face memory-card-back" aria-hidden />
              <div
                className="memory-card-face memory-card-front"
                style={{
                  backgroundImage: `url(${resolveAsset(card.image)})`,
                }}
              >
                <span className="sr-only">{card.label ?? card.id}</span>
              </div>
            </button>
          );
        })}
      </div>
      {justReset && <div className="banner info">{t("memoryReset")}</div>}
      <div className="memory-matches">
        {displayPairs.map((pair) => {
          const left = cards.find((c) => c.id === pair.a);
          const right = cards.find((c) => c.id === pair.b);
          if (!left || !right) return null;
          return (
            <div key={[pair.a, pair.b].sort().join("|")} className="memory-match">
              <div className="memory-match-card">
                <img src={resolveAsset(left.image)} alt={left.label || left.id} />
              </div>
              <div className="memory-match-card">
                <img src={resolveAsset(right.image)} alt={right.label || right.id} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
