import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import ModeSelector from "./components/ModeSelector";
import type { EligibilityStatus, Mode, User } from "../types";
import { useI18n } from "../i18n";
import { fetchEligibility, updateCreatureSwap } from "../services/api";

interface Props {
  user: User;
  onModeChange?: (mode: Mode) => void;
  onFunChange?: (creatureSwap: boolean) => void;
}

export default function SettingsPage({ user, onModeChange, onFunChange }: Props) {
  const { t, locale } = useI18n();
  const [creatureSwap, setCreatureSwap] = useState(Boolean(user.creatureSwap));
  const [savingFun, setSavingFun] = useState(false);
  const [eligibility, setEligibility] = useState<EligibilityStatus | null>(null);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);

  useEffect(() => {
    setCreatureSwap(Boolean(user.creatureSwap));
  }, [user.creatureSwap]);

  useEffect(() => {
    let cancelled = false;
    setEligibilityError(null);
    fetchEligibility()
      .then((payload) => {
        if (cancelled) return;
        setEligibility(payload);
      })
      .catch((err) => {
        if (cancelled) return;
        setEligibilityError((err as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const eligibilityMessage = useMemo(() => {
    if (!eligibility) return null;
    if (eligibility.eligible) return t("eligibilityEligible");
    switch (eligibility.reason) {
      case "admin_ineligible":
        return t("eligibilityAdminIneligible");
      case "not_linked":
        return t("eligibilityNotLinked");
      case "not_in_server":
        return t("eligibilityNotInServer");
      case "missing_role":
        return t("eligibilityMissingRole");
      default:
        return t("eligibilityUnknown");
    }
  }, [eligibility, t]);

  const eligibilityCheckedAt = useMemo(() => {
    if (!eligibility?.checkedAt) return t("eligibilityCheckedAtMissing");
    const date = new Date(eligibility.checkedAt);
    if (Number.isNaN(date.getTime())) return t("eligibilityCheckedAtMissing");
    return t("eligibilityCheckedAt", { date: date.toLocaleString(locale) });
  }, [eligibility?.checkedAt, locale, t]);

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
      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header" style={{ alignItems: "center" }}>
          <div>
            <div className="eyebrow">{t("eligibilityTitle")}</div>
            <p className="muted">{t("eligibilitySubtitle")}</p>
          </div>
        </div>
        {eligibilityError && <p className="error">{eligibilityError}</p>}
        {eligibilityMessage && (
          <div className="panel subpanel" style={{ marginTop: 12 }}>
            <p>{eligibilityMessage}</p>
            <p className="muted small">{eligibilityCheckedAt}</p>
          </div>
        )}
      </div>
    </div>
  );
}
