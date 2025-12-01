import { useEffect, useRef, useState } from "react";

interface Props {
  type: "success" | "error" | "info";
  message: string;
  onClose?: () => void;
  durationMs?: number;
}

export default function Toast({ type, message, onClose, durationMs }: Props) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!durationMs || !onClose) return;
    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const pct = Math.min(elapsed / durationMs, 1);
      setProgress(pct);
      if (pct >= 1) {
        onClose();
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [durationMs, onClose]);

  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      {onClose && (
        <button className="toast-close" onClick={onClose} aria-label="Close notification">
          ×
        </button>
      )}
      {durationMs ? <div className="toast-progress" style={{ width: `${(1 - progress) * 100}%` }} /> : null}
    </div>
  );
}
