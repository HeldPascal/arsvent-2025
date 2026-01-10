import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDays, fetchPublicPrizes } from "../services/api";
import type { DaySummary, Mode, PrizePool, PrizePoolMeta, User } from "../types";
import { useI18n } from "../i18n";

interface Props {
  user: User;
  version: number;
  onModeChange?: (mode: Mode) => void;
}

export default function CalendarPage({ user, version }: Props) {
  const [days, setDays] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poolMeta, setPoolMeta] = useState<Record<PrizePool, PrizePoolMeta> | null>(null);
  const { t } = useI18n();
  const epilogueUnlocked = user.lastSolvedDay >= 24 || user.isAdmin || user.isSuperAdmin;
  const calendarCompleted = user.lastSolvedDay >= 24;
  const availableRef = useRef<number | null>(null);
  const unlockedRef = useRef<number | null>(null);

  const applyDays = (payload: { days: DaySummary[]; unlockedDay: number; contentDayCount?: number }, allowToast: boolean) => {
    setDays(payload.days);
    const available = payload.days.filter((d) => d.isAvailable).length;
    if (allowToast) {
      const unlockedIncreased =
        unlockedRef.current !== null && payload.unlockedDay > (unlockedRef.current ?? payload.unlockedDay);
      const availableIncreased = availableRef.current !== null && available > (availableRef.current ?? available);
      if (unlockedIncreased || availableIncreased) {
        window.dispatchEvent(
          new CustomEvent("app:toast", { detail: { type: "info", key: "dayUnlocked", durationMs: 10000 } }),
        );
      }
    }
    availableRef.current = available;
    unlockedRef.current = payload.unlockedDay;
  };

  const feedbackOpen = Boolean(user.feedbackOpen ?? user.feedbackEnabled) && !user.hasSubmittedFeedback;
  const prizesAvailable = Boolean(user.prizesAvailable);
  const mainCutoff = poolMeta?.MAIN?.cutoffAt ?? null;
  const veteranCutoff = poolMeta?.VETERAN?.cutoffAt ?? null;
  const now = new Date().getTime();
  const mainEnded = Boolean(mainCutoff && now > new Date(mainCutoff).getTime());
  const veteranEnded = Boolean(veteranCutoff && now > new Date(veteranCutoff).getTime());
  const prizesEnded = user.mode === "VETERAN" ? mainEnded && veteranEnded : mainEnded;
  const showPrizesBanner = calendarCompleted && (feedbackOpen || prizesAvailable || prizesEnded);
  const showFeedbackBanner = feedbackOpen;
  const bannerTitle = showFeedbackBanner
    ? t("feedbackBannerTitle")
    : prizesEnded
      ? t("prizesBannerEndedTitle")
      : t("prizesBannerTitle");
  const bannerSubtitle = showFeedbackBanner
    ? t("feedbackSubtitle")
    : prizesEnded
      ? t("prizesBannerEndedSubtitle")
      : t("prizesSubtitle");

  useEffect(() => {
    fetchDays()
      .then((d) => applyDays(d, false))
      .catch(() => setError(t("dayLoadFailed")))
      .finally(() => setLoading(false));
  }, [t, version]);

  useEffect(() => {
    let cancelled = false;
    fetchPublicPrizes()
      .then((payload) => {
        if (!cancelled) setPoolMeta(payload.pools as Record<PrizePool, PrizePoolMeta>);
      })
      .catch(() => {
        // ignore banner errors; prizes messaging handled on prizes page
      });
    return () => {
      cancelled = true;
    };
  }, []);


  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      fetchDays()
        .then((d) => {
          if (!cancelled) applyDays(d, true);
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

      {showPrizesBanner && (
        <div className="panel notice-banner">
          <div>
            <strong>{bannerTitle}</strong>
            <div className="muted small">{bannerSubtitle}</div>
            {showFeedbackBanner && prizesEnded && (
              <div className="muted small">{t("prizesBannerEndedSubtitle")}</div>
            )}
          </div>
          <Link className="small-btn" to="/prizes">
            {t("prizesBannerCta")}
          </Link>
        </div>
      )}

      {loading && <p>{t("loading")}</p>}
      {error && <p className="error">{error}</p>}

      <div className="grid">
        <IntroCard title={t("introLabel")} />
        {days.map((item) => (
          <DayCard
            key={item.day}
            day={item}
            lastSolvedDay={user.lastSolvedDay}
            isAdmin={user.isAdmin || user.isSuperAdmin}
            labels={{
              solved: t("daySolved"),
              available: t("dayAvailable"),
              locked: t("dayLocked"),
              solvePrev: t("daySolvePrev"),
              next: t("dayNext"),
              open: t("open"),
              soon: t("soon"),
              override: t("override"),
              noContent: t("noContent"),
            }}
          />
        ))}
        {epilogueUnlocked && <EpilogueCard title={t("epilogueLabel")} />}
      </div>
    </div>
  );
}

function IntroCard({ title }: { title: string }) {
  const { t } = useI18n();
  return (
    <div className="day-card solved">
      <div className="day-number">0</div>
      <div className="day-status">{title}</div>
      <Link className="small-btn" to="/intro">
        {t("open")}
      </Link>
    </div>
  );
}

function EpilogueCard({ title }: { title: string }) {
  const { t } = useI18n();
  return (
    <div className="day-card solved">
      <div className="day-number">25</div>
      <div className="day-status">{title}</div>
      <Link className="small-btn" to="/epilogue">
        {t("open")}
      </Link>
    </div>
  );
}

function DayCard({
  day,
  labels,
  lastSolvedDay,
  isAdmin,
}: {
  day: DaySummary;
  labels: {
    solved: string;
    available: string;
    locked: string;
    solvePrev: string;
    next: string;
    open: string;
    soon: string;
    override: string;
    noContent: string;
  };
  lastSolvedDay: number;
  isAdmin: boolean;
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
  const hasContent = day.hasContent !== undefined ? day.hasContent : true;
  return (
    <div className={`day-card ${state}`}>
      <div className="day-number">{day.day}</div>
      <div className="day-status">{statusLabel}</div>
      <div className="day-actions">
        {day.isAvailable ? (
          <Link className="small-btn" to={`/day/${day.day}`}>
            {labels.open}
          </Link>
        ) : (
          <span className="small-btn disabled">{labels.soon}</span>
        )}
        {isAdmin && (
          hasContent ? (
            <Link className="small-btn ghost" to={`/day/${day.day}?override=1`}>
              {labels.override}
            </Link>
          ) : (
            <span className="small-btn disabled">{labels.noContent}</span>
          )
        )}
      </div>
    </div>
  );
}
