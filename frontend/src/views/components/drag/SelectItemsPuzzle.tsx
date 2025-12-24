import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BackgroundVideo, DayBlock, DragSocketItem } from "../../../types";
import { useI18n } from "../../../i18n";

type SelectItemsBlock = Extract<DayBlock, { kind: "puzzle" }> & {
  type: "select-items";
  items?: DragSocketItem[];
  backgroundImage?: string;
  backgroundVideo?: BackgroundVideo;
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
  hint?: string;
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
  hint,
}: Props) {
  const { t } = useI18n();
  const items: DragSocketItem[] = useMemo(() => block.items ?? [], [block.items]);
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 3);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const baseBoardWidthRef = useRef<number>(0);
  const resolvedBackground = resolveAsset(block.backgroundImage);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const autoplayedRef = useRef(false);
  const freezeRef = useRef(false);
  const isFullyVisibleRef = useRef(false);
  const pendingPlayRef = useRef(false);
  const pausedByVisibilityRef = useRef(false);
  const videoConfig = useMemo(() => {
    if (!block.backgroundVideo) return null;
    const sources =
      block.backgroundVideo.sources?.length
        ? block.backgroundVideo.sources
        : block.backgroundVideo.src
          ? [{ src: block.backgroundVideo.src, type: block.backgroundVideo.type }]
          : [];
    return {
      sources,
      segment: block.backgroundVideo.segment,
      freezeFrame: block.backgroundVideo.freezeFrame,
      preload: block.backgroundVideo.preload ?? "metadata",
    };
  }, [block.backgroundVideo]);
  const resolvedVideoSources = useMemo(
    () =>
      videoConfig?.sources?.map((source) => ({
        ...source,
        src: resolveAsset(source.src),
      })) ?? [],
    [videoConfig, resolveAsset],
  );
  const hasVideo = Boolean(videoConfig && resolvedVideoSources.length > 0);
  const videoSignature = useMemo(() => {
    if (!videoConfig) return "";
    const sourcesKey = resolvedVideoSources.map((source) => source.src).join("|");
    const segmentKey = videoConfig.segment ? `${videoConfig.segment.start}-${videoConfig.segment.end}` : "";
    return `${sourcesKey}|${segmentKey}|${String(videoConfig.freezeFrame ?? "")}|${String(videoConfig.preload ?? "")}`;
  }, [videoConfig, resolvedVideoSources]);

  useEffect(() => {
    if (!resolvedBackground || hasVideo) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        setAspectRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = resolvedBackground;
  }, [resolvedBackground, hasVideo]);

  const getSegmentBounds = useCallback(
    (video: HTMLVideoElement) => {
      const duration = Number.isFinite(video.duration) ? video.duration : undefined;
      const start = Math.max(0, videoConfig?.segment?.start ?? 0);
      let end = videoConfig?.segment?.end ?? duration;
      if (end !== undefined) {
        end = Math.max(start, end);
        if (duration !== undefined) end = Math.min(end, duration);
      }
      let freezeTime: number;
      if (typeof videoConfig?.freezeFrame === "number") {
        freezeTime = videoConfig.freezeFrame;
      } else if (videoConfig?.freezeFrame === "start") {
        freezeTime = start;
      } else {
        freezeTime = end ?? duration ?? start;
      }
      if (duration !== undefined) {
        freezeTime = Math.min(Math.max(0, freezeTime), duration);
      } else {
        freezeTime = Math.max(0, freezeTime);
      }
      return { start, end, freezeTime };
    },
    [videoConfig],
  );

  const pauseAndFreeze = useCallback(() => {
    const video = videoRef.current;
    if (!video || freezeRef.current) return;
    freezeRef.current = true;
    const { freezeTime } = getSegmentBounds(video);
    video.pause();
    if (Number.isFinite(freezeTime)) {
      video.currentTime = freezeTime;
    }
  }, [getSegmentBounds]);

  const playSegment = useCallback(() => {
    const video = videoRef.current;
    if (!video || !videoConfig) return;
    if (!isFullyVisibleRef.current) {
      pendingPlayRef.current = true;
      return;
    }
    freezeRef.current = false;
    const { start } = getSegmentBounds(video);
    try {
      video.pause();
      video.currentTime = start;
    } catch {
      // Ignore seek errors; video might not be ready yet.
    }
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        pauseAndFreeze();
      });
    }
  }, [getSegmentBounds, pauseAndFreeze, videoConfig]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideo) return;
    const handleTimeUpdate = () => {
      const { end } = getSegmentBounds(video);
      if (end !== undefined && video.currentTime >= end - 0.04) {
        pauseAndFreeze();
      }
    };
    const handleEnded = () => {
      pauseAndFreeze();
    };
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [getSegmentBounds, hasVideo, pauseAndFreeze, videoSignature]);

  useEffect(() => {
    const target = boardRef.current;
    if (!hasVideo || !target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const fullyVisible = Boolean(entry?.isIntersecting && entry.intersectionRatio >= 1);
        isFullyVisibleRef.current = fullyVisible;
        const video = videoRef.current;
        if (!fullyVisible) {
          if (video && !video.paused) {
            pausedByVisibilityRef.current = true;
            video.pause();
          }
          return;
        }
        if (!disabled && pausedByVisibilityRef.current && video) {
          pausedByVisibilityRef.current = false;
          const playPromise = video.play();
          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
              pauseAndFreeze();
            });
          }
        }
        if (pendingPlayRef.current && !disabled) {
          pendingPlayRef.current = false;
          playSegment();
        }
      },
      { threshold: 1 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [disabled, hasVideo, pauseAndFreeze, playSegment]);

  useEffect(() => {
    autoplayedRef.current = false;
    pendingPlayRef.current = false;
    pausedByVisibilityRef.current = false;
  }, [block.id, videoSignature]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasVideo || disabled) return;
    if (autoplayedRef.current) return;
    const startPlayback = () => {
      if (autoplayedRef.current) return;
      if (!isFullyVisibleRef.current) {
        pendingPlayRef.current = true;
        return;
      }
      autoplayedRef.current = true;
      playSegment();
    };
    if (video.readyState >= 1) {
      startPlayback();
      return;
    }
    const handleLoaded = () => startPlayback();
    video.addEventListener("loadedmetadata", handleLoaded, { once: true });
    return () => video.removeEventListener("loadedmetadata", handleLoaded);
  }, [disabled, hasVideo, playSegment, videoSignature]);

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
      <div className="select-items-controls">
        <div className="drag-hint">{hint ?? t("selectItemsHint")}</div>
        {hasVideo && (
          <button type="button" className="small-btn ghost select-items-replay" onClick={playSegment}>
            {t("replay")}
          </button>
        )}
      </div>
      {errorMessage && <div className="banner error">{errorMessage}</div>}
      <div
        className={`drag-sockets-board select-items-board ${shapeClass(block.shape)} status-${status}${hasVideo ? " has-video" : ""}`}
        style={{
          backgroundImage: !hasVideo && resolvedBackground ? `url(${resolvedBackground})` : undefined,
          aspectRatio,
          backgroundRepeat: "no-repeat",
          backgroundSize: "contain",
        }}
        ref={boardRef}
      >
        {hasVideo && (
          <video
            ref={videoRef}
            className="select-items-video"
            muted
            playsInline
            preload={videoConfig?.preload ?? "metadata"}
            controls={false}
            disablePictureInPicture
            aria-hidden="true"
            onLoadedMetadata={(event) => {
              const target = event.currentTarget;
              if (target.videoWidth > 0 && target.videoHeight > 0) {
                setAspectRatio(target.videoWidth / target.videoHeight);
              }
            }}
          >
            {resolvedVideoSources.map((source) => (
              <source key={source.src} src={source.src} type={source.type} />
            ))}
          </video>
        )}
        {items.map((item) => {
          const posX = (item.position?.x ?? 0.5) * 100;
          const posY = (item.position?.y ?? 0.5) * 100;
          const selected = isSelected(item.id);
          const isEmpty = !item.image && !item.label;
          return (
            <button
              key={item.id}
              type="button"
              className={`select-item drag-socket ${shapeClass(item.shape)} ${selected ? "is-selected" : ""} status-${status}${isEmpty ? " empty" : ""}`}
              style={{ left: `${posX}%`, top: `${posY}%` }}
              onClick={() => toggleSelection(item.id)}
              disabled={disabled}
              aria-pressed={selected}
              aria-label={item.label || item.id}
            >
              <div className={`drag-socket-item ${shapeClass(item.shape)} ${selected ? "selected" : ""}${isEmpty ? " empty" : ""}`}>
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
