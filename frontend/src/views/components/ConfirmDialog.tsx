import Modal from "./Modal";

interface Props {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ message, confirmLabel = "Confirm", cancelLabel = "Cancel", onConfirm, onCancel }: Props) {
  const messageId = "confirm-dialog-message";
  return (
    <Modal onDismiss={onCancel} ariaLabel="Confirmation" ariaDescribedBy={messageId}>
      <p className="modal-message" id={messageId}>
        {message}
      </p>
      <div className="modal-actions">
        <button className="ghost" type="button" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button className="primary" type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
