import type { AdminPrize, PrizePool } from "../../types";
import AssetPicker from "./AssetPicker";

type AssetOption = {
  id: string;
  label: string;
  name: string;
  variants: Array<{ ext: string; mime: string; size: number }>;
  variantUrls: string[];
  baseVariantIndex?: number;
};

type PrizeFormProps = {
  mode: "create" | "edit";
  prize: AdminPrize;
  assetOptions: AssetOption[];
  backupOptions: AdminPrize[];
  saving?: boolean;
  onFieldChange: (field: keyof AdminPrize, value: unknown) => void;
  onSave?: () => void;
  onDelete?: () => void;
  submitLabel?: string;
};

export default function PrizeForm({
  mode,
  prize,
  assetOptions,
  backupOptions,
  saving = false,
  onFieldChange,
  onSave,
  onDelete,
  submitLabel,
}: PrizeFormProps) {
  const isCreate = mode === "create";
  const selectedBackupIds = prize.backupPrizes ?? [];
  const selectedBackups = selectedBackupIds
    .map((id) => backupOptions.find((option) => option.id === id))
    .filter((option): option is AdminPrize => Boolean(option));
  const availableBackups = backupOptions.filter(
    (option) => !selectedBackupIds.includes(option.id),
  );

  const updateBackupPrizes = (next: string[]) => {
    onFieldChange("backupPrizes", next);
  };

  const handleAddBackup = (id: string) => {
    if (selectedBackupIds.includes(id)) return;
    updateBackupPrizes([...selectedBackupIds, id]);
  };

  const handleRemoveBackup = (id: string) => {
    updateBackupPrizes(selectedBackupIds.filter((entry) => entry !== id));
  };
  return (
    <div className="prize-card">
      <div className="field-grid field-grid-4">
        <label className="field span-2">
          <span className="muted small">ID</span>
          {isCreate ? (
            <input
              className="prize-id-input"
              type="text"
              value={prize.id}
              onChange={(event) => onFieldChange("id", event.target.value)}
            />
          ) : (
            <div className="prize-id">{prize.id}</div>
          )}
        </label>
        <div className="field spacer col-3-span-2" aria-hidden="true" />
        <label className="field span-2">
          <span className="muted small">Name</span>
          <input
            type="text"
            value={prize.name}
            onChange={(event) => onFieldChange("name", event.target.value)}
          />
        </label>
        <label className="field col-3">
          <span className="muted small">Pool</span>
          <select
            value={prize.pool}
            onChange={(event) => onFieldChange("pool", event.target.value as PrizePool)}
          >
            <option value="MAIN">MAIN</option>
            <option value="VETERAN">VETERAN</option>
          </select>
        </label>
        <label className="field col-4">
          <span className="muted small">Priority</span>
          <input
            type="number"
            value={prize.priority}
            onChange={(event) => onFieldChange("priority", Number(event.target.value))}
          />
        </label>
        <label className="field span-2 row-span-2">
          <span className="muted small">Image asset</span>
          <AssetPicker
            options={assetOptions}
            value={prize.image ?? null}
            onChange={(next) => onFieldChange("image", next)}
          />
        </label>
        <label className="field col-3">
          <span className="muted small">Quantity</span>
          <input
            type="number"
            min={1}
            placeholder="Unlimited"
            value={prize.quantity ?? ""}
            onChange={(event) =>
              onFieldChange("quantity", event.target.value === "" ? null : Number(event.target.value))
            }
          />
        </label>
        <div className="field spacer col-4" aria-hidden="true" />
        <label className="field col-3">
          <span className="muted small">Filler prize</span>
          <select
            value={prize.isFiller ? "yes" : "no"}
            onChange={(event) => onFieldChange("isFiller", event.target.value === "yes")}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
        <label className="field col-4">
          <span className="muted small">Active</span>
          <select
            value={prize.isActive ? "yes" : "no"}
            onChange={(event) => onFieldChange("isActive", event.target.value === "yes")}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <div className="field span-2 row-span-2">
          <span className="muted small">Backup prizes</span>
          <div className="backup-selector">
            <div className="backup-block">
              <div className="muted small">Selected</div>
              {selectedBackups.length === 0 ? (
                <div className="muted small backup-empty">No backups selected.</div>
              ) : (
                <div className="backup-list">
                  {selectedBackups.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="backup-pill"
                      onClick={() => handleRemoveBackup(option.id)}
                    >
                      {option.name} ({option.id}) ✕
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="backup-block">
              <div className="muted small">Available</div>
              {availableBackups.length === 0 ? (
                <div className="muted small backup-empty">No more prizes available.</div>
              ) : (
                <div className="backup-list">
                  {availableBackups.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className="backup-option"
                      onClick={() => handleAddBackup(option.id)}
                    >
                      {option.name} ({option.id}) +
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <label className="field span-2 col-3-span-2">
          <span className="muted small">Description</span>
          <textarea
            rows={3}
            value={prize.description}
            onChange={(event) => onFieldChange("description", event.target.value)}
          />
        </label>
        <label className="field span-2 col-3-span-2">
          <span className="muted small">Admin notes</span>
          <textarea
            rows={2}
            value={prize.adminNotes ?? ""}
            onChange={(event) => onFieldChange("adminNotes", event.target.value)}
          />
        </label>
      </div>
      {isCreate ? (
        <div className="panel-actions prize-create-actions">
          <button className="primary" type="button" disabled={saving} onClick={onSave}>
            {saving ? "Creating…" : submitLabel ?? "Create prize"}
          </button>
        </div>
      ) : (
        <div className="panel-actions">
          <button className="primary" type="button" disabled={saving} onClick={onSave}>
            {saving ? "Saving…" : submitLabel ?? "Save"}
          </button>
          <button className="ghost danger" type="button" disabled={saving} onClick={onDelete}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
