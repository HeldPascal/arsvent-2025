import { useState } from "react";
import { updateMode } from "../../services/api";
import type { Mode } from "../../types";
import { useI18n } from "../../i18n";

interface Props {
  mode: Mode;
  onUpdated?: (mode: Mode) => void;
}

export default function ModeSelector({ mode, onUpdated }: Props) {
  const [current, setCurrent] = useState<Mode>(mode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();
  const vetLocked = current === "NORMAL";

  const changeMode = async (next: Mode) => {
    if (next === current || (next === "VET" && vetLocked)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await updateMode(next);
      setCurrent(res.mode);
      onUpdated?.(res.mode);
    } catch (err) {
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
    </div>
  );
}
