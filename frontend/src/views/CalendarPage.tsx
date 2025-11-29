import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDays } from "../services/api";
import type { DaySummary, User } from "../types";
import { useI18n } from "../i18n";

interface Props {
  user: User;
}

export default function CalendarPage({ user }: Props) {
  const [days, setDays] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    fetchDays()
      .then(setDays)
      .catch(() => setError(t("dayLoadFailed")))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div className="panel">
      <header className="panel-header">
        <div>
          <div className="eyebrow">
            {user.locale.toUpperCase()} · {user.mode}
          </div>
          <h2>{t("calendarTitle")}</h2>
          <p className="muted">{t("calendarSubtitle")}</p>
        </div>
      </header>

      {loading && <p>{t("loading")}</p>}
      {error && <p className="error">{error}</p>}

      <div className="grid">
        {days.map((item) => (
          <DayCard key={item.day} day={item} labels={{ solved: t("daySolved"), available: t("dayAvailable"), locked: t("dayLocked"), open: t("open"), soon: t("soon") }} />
        ))}
      </div>
    </div>
  );
}

function DayCard({
  day,
  labels,
}: {
  day: DaySummary;
  labels: { solved: string; available: string; locked: string; open: string; soon: string };
}) {
  const state = day.isAvailable ? (day.isSolved ? "solved" : "open") : "locked";
  return (
    <div className={`day-card ${state}`}>
      <div className="day-number">{day.day}</div>
      <div className="day-status">
        {state === "solved" ? labels.solved : state === "open" ? labels.available : labels.locked}
      </div>
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
