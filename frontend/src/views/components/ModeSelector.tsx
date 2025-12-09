import { useEffect, useState } from "react";
import { updateMode } from "../../services/api";
import type { Mode } from "../../types";
import { useI18n } from "../../i18n";
import ConfirmDialog from "./ConfirmDialog";

interface Props {
  mode: Mode;
  lastSolvedDay: number;
  onUpdated?: (mode: Mode) => void;
}

export default function ModeSelector({ mode, lastSolvedDay, onUpdated }: Props) {
  const [current, setCurrent] = useState<Mode>(mode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  const { t } = useI18n();
  const vetLocked = current === "NORMAL" && lastSolvedDay > 0;

  useEffect(() => {
    setCurrent(mode);
    setError(null);
  }, [mode]);

  const changeMode = async (next: Mode, skipConfirm = false) => {
    if (next === current || (next === "VET" && vetLocked)) return;
    if (!skipConfirm && current === "VET" && next === "NORMAL" && lastSolvedDay > 0) {
      setPendingMode(next);
      setShowConfirm(true);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await updateMode(next);
      setCurrent(res.mode);
      onUpdated?.(res.mode);
    } catch {
      setError(t("modeChangeNotAllowed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mode-selector">
      <div className="mode-label">{t("difficulty")}</div>
      <div className="mode-options">
        <button
          className={`mode-btn ${current === "NORMAL" ? "selected" : ""}`}
          onClick={() => changeMode("NORMAL")}
          disabled={saving}
          type="button"
        >
          <span className="mode-title">{t("modeNormalLabel")}</span>
          {current === "NORMAL" && <span className="mode-badge">{t("selected")}</span>}
        </button>
        <button
          className={`mode-btn ${current === "VET" ? "selected" : ""} ${vetLocked ? "locked" : ""}`}
          onClick={() => changeMode("VET")}
          disabled={saving || vetLocked}
          type="button"
        >
          <span className="mode-title">{t("modeVetLabel")}</span>
          <span className="mode-badge">{vetLocked ? t("locked") : current === "VET" ? t("selected") : ""}</span>
        </button>
      </div>
      <div className="mode-hint">{t("modeHint")}</div>
      {error && <div className="error">{error}</div>}

      {showConfirm && pendingMode && (
        <ConfirmDialog
          message={t("confirmVetToNormal")}
          confirmLabel={t("confirm")}
          cancelLabel={t("cancel")}
          onConfirm={() => {
            setShowConfirm(false);
            const modeToApply = pendingMode;
            setPendingMode(null);
            changeMode(modeToApply, true);
          }}
          onCancel={() => {
            setPendingMode(null);
            setShowConfirm(false);
          }}
        />
      )}
    </div>
  );
}
