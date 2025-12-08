import { useEffect, useMemo, useRef, useState } from "react";
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
  errorMessage?: string;
  onStartInteraction?: () => void;
}

export default function DragSocketsPuzzle({
  block,
  assignments,
  onChange,
  resolveAsset,
  status = "idle",
  disabled = false,
  errorMessage,
  onStartInteraction,
}: Props) {
  const { t } = useI18n();
  const sockets: DragSocketSlot[] = block.sockets ?? [];
  const items: DragSocketItem[] = block.items ?? [];
  const [hoverSocket, setHoverSocket] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 3);
  const [previewItem, setPreviewItem] = useState<string | null>(null);
  const [draggingItem, setDraggingItem] = useState<string | null>(null);
  const [draggingFromSocket, setDraggingFromSocket] = useState<string | null>(null);
  const dragGhostRef = useRef<HTMLElement | null>(null);

  const requiredSockets = useMemo(() => {
    const ids = new Set<string>();
    const solution = block.solution;
    if (Array.isArray(solution)) {
      solution.forEach((entry) => {
        if (entry && typeof entry === "object" && "socketId" in entry && entry.socketId) {
          ids.add(String(entry.socketId));
        }
      });
    } else if (solution && typeof solution === "object" && "sockets" in solution) {
      const socketsArr = (solution as { sockets?: Array<{ socketId?: string }> }).sockets ?? [];
      socketsArr.forEach((entry) => {
        if (entry?.socketId) ids.add(String(entry.socketId));
      });
    }
    return ids;
  }, [block.solution]);

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

  const defaultHomeBySocket = useMemo(() => {
    const map: Record<string, string> = {};
    items.forEach((itm) => {
      if (itm.defaultSocketId) {
        map[itm.defaultSocketId] = itm.id;
      }
    });
    return map;
  }, [items]);

  const canDrop = (socketId: string, itemId: string) => {
    const socket = sockets.find((s) => s.id === socketId);
    const item = items.find((itm) => itm.id === itemId);
    if (!socket || !item) return false;
    const reservedItem = defaultHomeBySocket[socketId];
    if (reservedItem && reservedItem !== itemId) return false;
    if (socket.shape && item.shape && socket.shape !== item.shape) return false;
    if (!socket.accepts?.length) return true;
    return socket.accepts.includes(itemId);
  };

  const createDragGhost = (item: DragSocketItem) => {
    if (typeof document === "undefined") return null;
    const ghost = document.createElement("div");
    const rootStyle = getComputedStyle(document.documentElement);
    const socketSize = rootStyle.getPropertyValue("--socket-size") || "104px";
    ghost.className = `drag-item-card ${shapeClass(item.shape)}`;
    ghost.style.width = socketSize.trim();
    ghost.style.height = socketSize.trim();
    ghost.style.position = "absolute";
    ghost.style.top = "-9999px";
    ghost.style.left = "-9999px";
    ghost.style.pointerEvents = "none";
    ghost.style.opacity = "0.95";

    if (item.image) {
      const img = document.createElement("img");
      img.src = resolveAsset(item.image);
      img.alt = item.label ?? item.id;
      img.className = `drag-item-image ${shapeClass(item.shape)}`;
      ghost.appendChild(img);
    }

    document.body.appendChild(ghost);
    dragGhostRef.current = ghost;
    return ghost;
  };

  const cleanupGhost = () => {
    if (dragGhostRef.current) {
      dragGhostRef.current.remove();
      dragGhostRef.current = null;
    }
  };

  const placeItem = (socketId: string, itemId: string) => {
    if (disabled) return;
    if (draggingFromSocket === socketId) return;
    const next = { ...assignments };
    const targetItem = next[socketId];
    const targetItemObj = items.find((itm) => itm.id === targetItem);

    if (draggingFromSocket) {
      next[draggingFromSocket] = targetItem && canDrop(draggingFromSocket, targetItem) ? targetItem : undefined;
    }

    Object.entries(next).forEach(([sid, currentItem]) => {
      if (currentItem === itemId) {
        next[sid] = undefined;
      }
    });

    next[socketId] = itemId;

    if (targetItem && targetItemObj?.defaultSocketId) {
      const home = targetItemObj.defaultSocketId;
      const alreadyPlaced = Object.values(next).includes(targetItem);
      if (!alreadyPlaced && (!next[home] || next[home] === targetItem)) {
        next[home] = targetItem;
      }
    }
    onChange(next);
  };

  const clearSocket = (socketId: string) => {
    if (disabled) return;
    const next = { ...assignments };
    const currentItemId = next[socketId];
    next[socketId] = undefined;
    if (currentItemId) {
      const item = items.find((itm) => itm.id === currentItemId);
      const home = item?.defaultSocketId;
      if (home) {
        // Home sockets are reserved for their default item only
        next[home] = currentItemId;
      }
    }
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
    const isDefaultHome = assignedItem?.defaultSocketId === socket.id;
    const socketStatusClass = requiredSockets.size === 0 || requiredSockets.has(socket.id) ? statusClass : "status-idle";
    const isSelected = draggingItem === assignedItem?.id;

    return (
      <div
        key={socket.id}
        className={`drag-socket ${socketStatusClass} ${shapeClass(socket.shape)} ${isActive ? "is-active" : ""} ${isDropCandidate ? "is-candidate" : ""} ${isMuted ? "is-muted" : ""}`}
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
            className={`drag-socket-item ${shapeClass(socket.shape)} ${draggingItem === assignedItem.id ? "dragging" : ""} ${isSelected ? "selected" : ""}`}
            draggable={!disabled}
            onDragStart={(evt) => {
              if (disabled) return;
              onStartInteraction?.();
              setPreviewItem(null);
              setDraggingItem(assignedItem.id);
              setDraggingFromSocket(socket.id);
              evt.dataTransfer.setData("text/plain", assignedItem.id);
              evt.dataTransfer.effectAllowed = "move";
              const ghost = createDragGhost(assignedItem);
              const dragVisual = ghost ?? (evt.currentTarget as HTMLElement);
              evt.dataTransfer.setDragImage(dragVisual, dragVisual.clientWidth / 2, dragVisual.clientHeight / 2);
            }}
            onDragEnd={() => {
              setDraggingItem(null);
              setDraggingFromSocket(null);
              cleanupGhost();
            }}
            onClick={(evt) => {
              if (disabled) return;
              evt.stopPropagation();
              onStartInteraction?.();
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
            {!disabled && !isDefaultHome && (
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
            {previewItem === assignedItem.id && (
              <div className={`drag-item-tooltip ${shapeClass(socket.shape)}`}>
                {assignedItem.image && (
                  <img src={resolveAsset(assignedItem.image)} alt="" aria-hidden className="drag-item-tooltip-image" />
                )}
                {assignedItem.label && <div className="drag-item-title tooltip-label">{assignedItem.label}</div>}
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
        onStartInteraction?.();
        setPreviewItem(null);
        setDraggingItem(item.id);
        setDraggingFromSocket(null);
        evt.dataTransfer.setData("text/plain", item.id);
        evt.dataTransfer.effectAllowed = "move";
        const ghost = createDragGhost(item);
        const dragVisual = ghost ?? (evt.currentTarget as HTMLElement);
        evt.dataTransfer.setDragImage(dragVisual, dragVisual.clientWidth / 2, dragVisual.clientHeight / 2);
      }}
      onDragEnd={() => {
        setDraggingItem(null);
        setDraggingFromSocket(null);
        cleanupGhost();
      }}
      onClick={() => {
        if (disabled) return;
        onStartInteraction?.();
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
      {previewItem === item.id && draggingItem !== item.id && (
        <div className={`drag-item-tooltip ${shapeClass(item.shape)}`}>
          {item.image && <img src={resolveAsset(item.image)} alt="" aria-hidden className="drag-item-tooltip-image" />}
          {item.label && <div className="drag-item-title tooltip-label">{item.label}</div>}
        </div>
      )}
    </div>
  );

  return (
    <div className="drag-sockets-wrapper">
      <div className="drag-hint">{t("dragHint")}</div>
      {errorMessage && <div className="banner error">{errorMessage}</div>}
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
