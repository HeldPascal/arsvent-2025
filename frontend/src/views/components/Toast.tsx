import { useEffect, useRef } from "react";

interface Props {
  type: "success" | "error" | "info";
  message: string;
  onClose?: () => void;
  durationMs?: number;
}

export default function Toast({ type, message, onClose, durationMs }: Props) {
  const closeRef = useRef(onClose);

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!durationMs || !closeRef.current) return;
    const timeout = setTimeout(() => closeRef.current?.(), durationMs);
    return () => clearTimeout(timeout);
  }, [durationMs]);

  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      {onClose && (
        <button className="toast-close" onClick={onClose} aria-label="Close notification">
          ×
        </button>
      )}
      {durationMs ? <div className="toast-progress" style={{ animationDuration: `${durationMs}ms` }} /> : null}
    </div>
  );
}
