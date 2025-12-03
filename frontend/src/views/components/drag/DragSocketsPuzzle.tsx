import { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import type { DayBlock, DragSocketItem, DragSocketSlot } from "../../../types";
import { useI18n } from "../../../i18n";

type DragSocketsBlock = Extract<DayBlock, { kind: "puzzle" }> & {
  type: "drag-sockets";
  items?: DragSocketItem[];
  sockets?: DragSocketSlot[];
  backgroundImage?: string;
  shape?: "circle" | "square" | "hex";
};

interface Props {
  block: DragSocketsBlock;
  assignments: Record<string, string | undefined>;
  onChange: (next: Record<string, string | undefined>) => void;
  resolveAsset: (src?: string) => string;
  status?: "correct" | "incorrect" | "idle";
  disabled?: boolean;
}

export default function DragSocketsPuzzle({
  block,
  assignments,
  onChange,
  resolveAsset,
  status = "idle",
  disabled = false,
}: Props) {
  const { t } = useI18n();
  const sockets: DragSocketSlot[] = block.sockets ?? [];
  const items: DragSocketItem[] = block.items ?? [];
  const [hoverSocket, setHoverSocket] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 3);
  const [previewItem, setPreviewItem] = useState<string | null>(null);
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [draggingFromSocket, setDraggingFromSocket] = useState<string | null>(null);

  const assignedSocketByItem = useMemo(() => {
    const map: Record<string, string> = {};
    Object.entries(assignments).forEach(([socketId, itemId]) => {
      if (itemId) {
        map[itemId] = socketId;
      }
    });
    return map;
  }, [assignments]);

  const availableItems = items.filter((item: DragSocketItem) => !assignedSocketByItem[item.id]);
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

  const canDrop = (socketId: string, itemId: string) => {
    const socket = sockets.find((s) => s.id === socketId);
    const item = items.find((itm) => itm.id === itemId);
    if (!socket || !item) return false;
    if (socket.shape && item.shape && socket.shape !== item.shape) return false;
    if (!socket.accepts?.length) return true;
    return socket.accepts.includes(itemId);
  };

  const placeItem = (socketId: string, itemId: string) => {
    if (disabled) return;
    if (draggingFromSocket === socketId) return;
    const next = { ...assignments };
    const targetItem = next[socketId];

    if (draggingFromSocket) {
      next[draggingFromSocket] = targetItem && canDrop(draggingFromSocket, targetItem) ? targetItem : undefined;
    }

    Object.entries(next).forEach(([sid, currentItem]) => {
      if (currentItem === itemId) {
        next[sid] = undefined;
      }
    });

    next[socketId] = itemId;
    onChange(next);
  };

  const clearSocket = (socketId: string) => {
    if (disabled) return;
    const next = { ...assignments };
    next[socketId] = undefined;
    onChange(next);
  };

  const finalizePlacement = () => {
    setHoverSocket(null);
    setDraggingItem(null);
    setDraggingFromSocket(null);
    setPreviewItem(null);
  };

  const handleDrop = (socketId: string, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const itemId = draggingItem ?? event.dataTransfer.getData("text/plain");
    if (!itemId) return;
    if (!canDrop(socketId, itemId)) return;
    placeItem(socketId, itemId);
    finalizePlacement();
  };

  const handlePlaceClick = (socketId: string) => {
    if (!draggingItem) return;
    if (!canDrop(socketId, draggingItem)) return;
    placeItem(socketId, draggingItem);
    finalizePlacement();
  };

  const statusClass =
    status === "correct" ? "status-correct" : status === "incorrect" ? "status-incorrect" : "status-idle";
  const shapeClass = (shape?: string) => `shape-${shape ?? block.shape ?? "circle"}`;

  const renderSocket = (socket: DragSocketSlot) => {
    const assignedId = assignments[socket.id];
    const assignedItem = items.find((item) => item.id === assignedId);
    const isActive = hoverSocket === socket.id;
    const isDropCandidate = draggingItem ? canDrop(socket.id, draggingItem) : false;
    const isMuted = Boolean(draggingItem && !isDropCandidate);
    const socketLabel = socket.label && socket.label.trim().length > 0 ? socket.label : t("socketPlaceholder");

    return (
      <div
        key={socket.id}
        className={`drag-socket ${statusClass} ${shapeClass(socket.shape)} ${isActive ? "is-active" : ""} ${isDropCandidate ? "is-candidate" : ""} ${isMuted ? "is-muted" : ""}`}
        style={{ left: `${socket.position.x * 100}%`, top: `${socket.position.y * 100}%` }}
        onDragEnter={(evt) => {
          const itemId = draggingItem ?? evt.dataTransfer.getData("text/plain");
          if (disabled || !itemId || !canDrop(socket.id, itemId)) return;
          evt.preventDefault();
          setHoverSocket(socket.id);
        }}
        onDragOver={(evt) => {
          const itemId = draggingItem ?? evt.dataTransfer.getData("text/plain");
          if (disabled || !itemId || !canDrop(socket.id, itemId)) return;
          evt.preventDefault();
        }}
        onDragLeave={() => setHoverSocket((prev) => (prev === socket.id ? null : prev))}
        onDrop={(evt) => handleDrop(socket.id, evt)}
        onClick={() => handlePlaceClick(socket.id)}
      >
        <div className="drag-socket-target">
          <span className="drag-socket-index">{socketLabel}</span>
        </div>
        {assignedItem && (
          <div
            className={`drag-socket-item ${shapeClass(socket.shape)} ${draggingItem === assignedItem.id ? "dragging" : ""}`}
            draggable={!disabled}
            onDragStart={(evt) => {
              if (disabled) return;
              setPreviewItem(null);
              setDraggingItem(assignedItem.id);
              setDraggingFromSocket(socket.id);
              evt.dataTransfer.setData("text/plain", assignedItem.id);
              evt.dataTransfer.effectAllowed = "move";
              const dragVisual = evt.currentTarget as HTMLElement;
              evt.dataTransfer.setDragImage(dragVisual, dragVisual.clientWidth / 2, dragVisual.clientHeight / 2);
            }}
            onDragEnd={() => {
              setDraggingItem(null);
              setDraggingFromSocket(null);
            }}
            onClick={(evt) => {
              if (disabled) return;
              evt.stopPropagation();
              if (draggingItem && draggingItem !== assignedItem.id) {
                if (canDrop(socket.id, draggingItem)) {
                  placeItem(socket.id, draggingItem);
                  finalizePlacement();
                }
                return;
              }
              if (draggingItem === assignedItem.id) {
                finalizePlacement();
                return;
              }
              setPreviewItem(null);
              setDraggingItem(assignedItem.id);
              setDraggingFromSocket(socket.id);
            }}
            onMouseEnter={() => setPreviewItem(assignedItem.id)}
            onMouseLeave={() => setPreviewItem((prev) => (prev === assignedItem.id ? null : prev))}
          >
            {assignedItem.image && (
              <img src={resolveAsset(assignedItem.image)} alt={assignedItem.label || assignedItem.id} draggable={!disabled} />
            )}
            <div className="drag-socket-label">
              {assignedItem.label !== undefined ? assignedItem.label : assignedItem.id}
            </div>
            {!disabled && (
              <button
                type="button"
                className="ghost small reset"
                onClick={(evt) => {
                  evt.stopPropagation();
                  clearSocket(socket.id);
                  finalizePlacement();
                }}
              >
                ×
              </button>
            )}
            {previewItem === assignedItem.id && assignedItem.image && (
              <div className={`drag-item-tooltip ${shapeClass(socket.shape)}`}>
                <img src={resolveAsset(assignedItem.image)} alt="" aria-hidden className="drag-item-tooltip-image" />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderItemCard = (item: DragSocketItem) => (
    <div
      key={item.id}
      className={`drag-item-card ${shapeClass(item.shape)} ${draggingItem === item.id ? "dragging" : ""}`}
      draggable={!disabled}
      onDragStart={(evt) => {
        if (disabled) return;
        setPreviewItem(null);
        setDraggingItem(item.id);
        setDraggingFromSocket(null);
        evt.dataTransfer.setData("text/plain", item.id);
        evt.dataTransfer.effectAllowed = "move";
        const dragVisual = evt.currentTarget as HTMLElement;
        evt.dataTransfer.setDragImage(dragVisual, dragVisual.clientWidth / 2, dragVisual.clientHeight / 2);
      }}
      onDragEnd={() => {
        setDraggingItem(null);
        setDraggingFromSocket(null);
      }}
      onClick={() => {
        if (disabled) return;
        if (draggingItem === item.id) {
          finalizePlacement();
          return;
        }
        setPreviewItem(null);
        setDraggingItem(item.id);
        setDraggingFromSocket(null);
      }}
      onMouseEnter={() => setPreviewItem(item.id)}
      onMouseLeave={() => setPreviewItem((prev) => (prev === item.id ? null : prev))}
    >
      {item.image && (
        <img
          src={resolveAsset(item.image)}
          alt={item.label !== undefined ? item.label : item.id}
          className={`drag-item-image ${shapeClass(item.shape)}`}
          draggable={false}
        />
      )}
      <div className="drag-item-labels">
        <div className="drag-item-title">{item.label !== undefined ? item.label : item.id}</div>
      </div>
      {previewItem === item.id && draggingItem !== item.id && item.image && (
        <div className={`drag-item-tooltip ${shapeClass(item.shape)}`}>
          <img src={resolveAsset(item.image)} alt="" aria-hidden className="drag-item-tooltip-image" />
        </div>
      )}
    </div>
  );

  return (
    <div className="drag-sockets-wrapper">
      <div className="drag-hint">{t("dragHint")}</div>
      <div
        className={`drag-sockets-board ${shapeClass(block.shape)} ${draggingItem ? "is-dragging" : ""}`}
        style={{
          backgroundImage: `url(${resolvedBackground})`,
          aspectRatio,
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
        }}
      >
        {sockets.map((socket: DragSocketSlot) => renderSocket(socket))}
      </div>
      <div className="drag-items-grid">
        {availableItems.length === 0 && items.length > 0 && <div className="muted small">{t("allItemsPlaced")}</div>}
        {availableItems.map((item: DragSocketItem) => renderItemCard(item))}
      </div>
    </div>
  );
}
