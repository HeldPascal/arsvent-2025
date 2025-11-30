import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDays } from "../services/api";
import type { DaySummary, Mode, User } from "../types";
import { useI18n } from "../i18n";
import ModeSelector from "./components/ModeSelector";

interface Props {
  user: User;
  version: number;
  onModeChange?: (mode: Mode) => void;
}

export default function CalendarPage({ user, version, onModeChange }: Props) {
  const [days, setDays] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    fetchDays()
      .then(setDays)
      .catch(() => setError(t("dayLoadFailed")))
      .finally(() => setLoading(false));
  }, [t, version]);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      fetchDays()
        .then((d) => {
          if (!cancelled) setDays(d);
        })
        .catch(() => {
          if (!cancelled) setError(t("dayLoadFailed"));
        });
    };
    const interval = window.setInterval(refresh, 10000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [t]);

  return (
    <div className="panel">
      <header className="panel-header">
        <div>
          <div className="eyebrow">
            {user.locale.toUpperCase()} · {user.mode}
          </div>
          <h2>{t("calendarTitle")}</h2>
          <p className="muted">
            {t("calendarSubtitle")}<br />
            <strong>{t("calendarOrderHint")}</strong>
          </p>
        </div>
      </header>

      {user.lastSolvedDay === 0 && (
        <div className="welcome-box">
          <h3>{t("welcomeTitle")}</h3>
          <p className="muted">{t("welcomeBody")}</p>
          <ModeSelector
            mode={user.mode}
            lastSolvedDay={user.lastSolvedDay}
            onUpdated={(mode) => {
              onModeChange?.(mode);
            }}
          />
        </div>
      )}

      {loading && <p>{t("loading")}</p>}
      {error && <p className="error">{error}</p>}

      <div className="grid">
        {days.map((item) => (
          <DayCard
            key={item.day}
            day={item}
            lastSolvedDay={user.lastSolvedDay}
            labels={{
              solved: t("daySolved"),
              available: t("dayAvailable"),
              locked: t("dayLocked"),
              solvePrev: t("daySolvePrev"),
              next: t("dayNext"),
              open: t("open"),
              soon: t("soon"),
            }}
          />
        ))}
      </div>
    </div>
  );
}

function DayCard({
  day,
  labels,
  lastSolvedDay,
}: {
  day: DaySummary;
  labels: { solved: string; available: string; locked: string; solvePrev: string; next: string; open: string; soon: string };
  lastSolvedDay: number;
}) {
  const state = day.isAvailable ? (day.isSolved ? "solved" : "open") : "locked";
  const needsPrev = day.day > lastSolvedDay + 1;
  const statusLabel =
    state === "solved"
      ? labels.solved
      : state === "open"
        ? day.day === lastSolvedDay + 1
          ? labels.next
          : labels.available
        : needsPrev
          ? labels.solvePrev
          : labels.locked;
  return (
    <div className={`day-card ${state}`}>
      <div className="day-number">{day.day}</div>
      <div className="day-status">{statusLabel}</div>
      {day.isAvailable ? (
        <Link className="small-btn" to={`/day/${day.day}`}>
          {labels.open}
        </Link>
      ) : (
        <span className="small-btn disabled">{labels.soon}</span>
      )}
    </div>
  );
}
