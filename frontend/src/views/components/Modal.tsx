import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  children: ReactNode;
  onDismiss?: () => void;
  ariaLabel?: string;
  ariaDescribedBy?: string;
};

export default function Modal({ children, onDismiss, ariaLabel, ariaDescribedBy }: Props) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (!onDismiss) return undefined;
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onDismiss]);

  return createPortal(
    <div className="modal-backdrop" onMouseDown={onDismiss}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
