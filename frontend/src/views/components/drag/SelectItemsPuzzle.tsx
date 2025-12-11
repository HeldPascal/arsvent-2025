import { useEffect, useMemo, useRef, useState } from "react";
import type { DayBlock, DragSocketItem } from "../../../types";
import { useI18n } from "../../../i18n";

type SelectItemsBlock = Extract<DayBlock, { kind: "puzzle" }> & {
  type: "select-items";
  items?: DragSocketItem[];
  backgroundImage?: string;
  shape?: "circle" | "square" | "hex";
};

interface Props {
  block: SelectItemsBlock;
  selections: string[];
  onChange: (next: string[]) => void;
  resolveAsset: (src?: string) => string;
  status?: "correct" | "incorrect" | "idle";
  disabled?: boolean;
  errorMessage?: string;
  onStartInteraction?: () => void;
}

export default function SelectItemsPuzzle({
  block,
  selections,
  onChange,
  resolveAsset,
  status = "idle",
  disabled = false,
  errorMessage,
  onStartInteraction,
}: Props) {
  const { t } = useI18n();
  const items: DragSocketItem[] = useMemo(() => block.items ?? [], [block.items]);
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 3);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const baseBoardWidthRef = useRef<number>(0);
  const resolvedBackground = resolveAsset(block.backgroundImage);

  useEffect(() => {
    if (!resolvedBackground) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = resolvedBackground;
  }, [resolvedBackground]);

  useEffect(() => {
    const updateItemSize = () => {
      if (!boardRef.current) return;
      const width = boardRef.current.clientWidth || 0;
      if (width <= 0) return;
      baseBoardWidthRef.current = Math.max(baseBoardWidthRef.current, width);
      const baseWidth = baseBoardWidthRef.current || width;
      const size = width >= baseWidth ? 96 : Math.max(48, Math.min(96, (width / baseWidth) * 96));
      boardRef.current.style.setProperty("--socket-size", `${size}px`);
    };
    updateItemSize();
    window.addEventListener("resize", updateItemSize);
    return () => window.removeEventListener("resize", updateItemSize);
  }, []);

  const shapeClass = (shape?: string) => `shape-${shape ?? block.shape ?? "circle"}`;
  const isSelected = (itemId: string) => selections.includes(itemId);
  const toggleSelection = (itemId: string) => {
    if (disabled) return;
    onStartInteraction?.();
    const next = isSelected(itemId) ? selections.filter((id) => id !== itemId) : [...selections, itemId];
    onChange(next);
  };

  return (
    <div className="select-items-wrapper">
      <div className="drag-hint">{t("selectItemsHint")}</div>
      {errorMessage && <div className="banner error">{errorMessage}</div>}
      <div
        className={`drag-sockets-board select-items-board ${shapeClass(block.shape)} status-${status}`}
        style={{
          backgroundImage: resolvedBackground ? `url(${resolvedBackground})` : undefined,
          aspectRatio,
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
        }}
        ref={boardRef}
      >
        {items.map((item) => {
          const posX = (item.position?.x ?? 0.5) * 100;
          const posY = (item.position?.y ?? 0.5) * 100;
          const selected = isSelected(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`select-item drag-socket ${shapeClass(item.shape)} ${selected ? "is-selected" : ""} status-${status}`}
              style={{ left: `${posX}%`, top: `${posY}%` }}
              onClick={() => toggleSelection(item.id)}
              disabled={disabled}
              aria-pressed={selected}
            >
              <div className={`drag-socket-item ${shapeClass(item.shape)} ${selected ? "selected" : ""}`}>
                {item.image && (
                  <img src={resolveAsset(item.image)} alt={item.label || item.id} draggable={false} className="drag-item-image" />
                )}
                {item.label && <span className="drag-socket-label">{item.label}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
