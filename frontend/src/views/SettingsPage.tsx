import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import ModeSelector from "./components/ModeSelector";
import type { Mode, User } from "../types";
import { useI18n } from "../i18n";
import { updateCreatureSwap } from "../services/api";

interface Props {
  user: User;
  onModeChange?: (mode: Mode) => void;
  onFunChange?: (creatureSwap: boolean) => void;
}

export default function SettingsPage({ user, onModeChange, onFunChange }: Props) {
  const { t } = useI18n();
  const [creatureSwap, setCreatureSwap] = useState(Boolean(user.creatureSwap));
  const [savingFun, setSavingFun] = useState(false);

  useEffect(() => {
    setCreatureSwap(Boolean(user.creatureSwap));
  }, [user.creatureSwap]);

  const toggleFun = async () => {
    const nextValue = !creatureSwap;
    setSavingFun(true);
    try {
      const resp = await updateCreatureSwap(nextValue);
      setCreatureSwap(resp.creatureSwap);
      onFunChange?.(resp.creatureSwap);
      window.dispatchEvent(new CustomEvent("app:toast", { detail: { type: "success", message: t("funSettingSaved") } }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update";
      window.dispatchEvent(new CustomEvent("app:toast", { detail: { type: "error", message } }));
      setCreatureSwap(!nextValue);
    } finally {
      setSavingFun(false);
    }
  };

  return (
    <div className="panel">
      <header className="panel-header">
        <div>
          <div className="eyebrow">{t("difficulty")}</div>
          <h2>{t("settingsTitle")}</h2>
          <p className="muted">{t("settingsSubtitle")}</p>
        </div>
        <Link className="ghost nav-link" to="/calendar">
          {t("backToCalendar")}
        </Link>
      </header>
      <ModeSelector
        mode={user.mode}
        lastSolvedDay={user.lastSolvedDay}
        onUpdated={(mode) => {
          onModeChange?.(mode);
        }}
      />
      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header" style={{ alignItems: "center" }}>
          <div>
            <div className="eyebrow">{t("funSettingTitle")}</div>
            <p className="muted">{t("funSettingDescription")}</p>
          </div>
          <button className={`small-btn ${creatureSwap ? "primary" : "ghost"}`} onClick={toggleFun} disabled={savingFun}>
            {t("funSettingToggle")}
          </button>
        </div>
      </div>
    </div>
  );
}
