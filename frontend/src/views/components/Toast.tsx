interface Props {
  type: "success" | "error" | "info";
  message: string;
  onClose?: () => void;
}

export default function Toast({ type, message, onClose }: Props) {
  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      {onClose && (
        <button className="toast-close" onClick={onClose} aria-label="Close notification">
          ×
        </button>
      )}
    </div>
  );
}
