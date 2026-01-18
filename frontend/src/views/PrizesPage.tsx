import { useEffect, useMemo, useState } from "react";
import type { DeliveryMethod, User } from "../types";
import { fetchEligibility, fetchPublicPrizes, fetchUserDraw, fetchUserDraws, submitFeedback } from "../services/api";
import { useI18n } from "../i18n";
import type { EligibilityStatus, PrizePool, PrizePoolMeta, UserDrawDetail } from "../types";

interface Props {
  user: User;
  onFeedbackSubmitted: () => void;
}

const feedbackOptions = [
  { value: 1, emoji: "😡", labelKey: "feedbackVeryDissatisfied" },
  { value: 2, emoji: "😕", labelKey: "feedbackDissatisfied" },
  { value: 3, emoji: "😐", labelKey: "feedbackNeutral" },
  { value: 4, emoji: "🙂", labelKey: "feedbackSatisfied" },
  { value: 5, emoji: "😍", labelKey: "feedbackVerySatisfied" },
] as const;

export default function PrizesPage({ user, onFeedbackSubmitted }: Props) {
  const { t, locale } = useI18n();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [poolMeta, setPoolMeta] = useState<Record<PrizePool, PrizePoolMeta> | null>(null);
  const [prizeLoadError, setPrizeLoadError] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityStatus | null>(null);
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [drawDetails, setDrawDetails] = useState<Record<string, UserDrawDetail>>({});
  const [drawLoadError, setDrawLoadError] = useState<string | null>(null);
  const [drawLoading, setDrawLoading] = useState(false);

  const feedbackEndsAt = useMemo(
    () => (user.feedbackEndsAt ? new Date(user.feedbackEndsAt) : null),
    [user.feedbackEndsAt],
  );
  const feedbackOpen =
    (user.feedbackOpen ?? null) ??
    (Boolean(user.feedbackEnabled) && (!feedbackEndsAt || Date.now() <= feedbackEndsAt.getTime()));
  const freeTextEnabled = user.feedbackFreeTextEnabled ?? true;
  const commentLimit = 1000;
  const commentRemaining = commentLimit - comment.length;
  const showCommentRemaining = commentRemaining <= 200;
  const prizesAvailable = Boolean(user.prizesAvailable);
  const lastSolvedAt = useMemo(
    () => (user.lastSolvedAt ? new Date(user.lastSolvedAt) : null),
    [user.lastSolvedAt],
  );
  const calendarCompleted = user.lastSolvedDay >= 24;
  const needsFeedback = calendarCompleted && !user.hasSubmittedFeedback && feedbackOpen;
  const canViewPrizes = Boolean(user.hasSubmittedFeedback) || !feedbackOpen;
  const poolOrder: PrizePool[] = ["MAIN", "VETERAN"];

  const parseCutoff = (value: string | null) => (value ? new Date(value) : null);
  const isCutoffPassed = (cutoff: Date | null, solvedAt: Date | null) =>
    Boolean(cutoff && solvedAt && solvedAt.getTime() > cutoff.getTime());

  const prizeStatusMessage = (pool: PrizePool) => {
    const cutoff = poolMeta ? parseCutoff(poolMeta[pool]?.cutoffAt ?? null) : null;
    const ended = isCutoffPassed(cutoff, lastSolvedAt);
    if (ended) return t("prizeStatusEnded");
    return t("prizeStatusPending");
  };

  const deliveryMethodLabel = (method: DeliveryMethod | null, note: string | null) => {
    if (!method) return "—";
    const labels: Record<DeliveryMethod, string> = {
      INGAME_MAIL: t("deliveryMethodIngameMail"),
      CROWN_STORE_GIFT: t("deliveryMethodCrownStoreGift"),
      PHYSICAL: t("deliveryMethodPhysical"),
      CODE: t("deliveryMethodCode"),
      OTHER: t("deliveryMethodOther"),
    };
    const base = labels[method];
    if (method === "OTHER" && note) {
      return `${base}: ${note}`;
    }
    return base;
  };

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

  useEffect(() => {
    let cancelled = false;
    fetchPublicPrizes(locale)
      .then((payload) => {
        if (cancelled) return;
        setPoolMeta(payload.pools as Record<PrizePool, PrizePoolMeta>);
        setPrizeLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setPrizeLoadError((err as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    if (!calendarCompleted) {
      setEligibility(null);
      return;
    }
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
  }, [calendarCompleted]);

  useEffect(() => {
    if (!calendarCompleted) {
      setDrawDetails({});
      return;
    }
    let cancelled = false;
    setDrawLoading(true);
    setDrawLoadError(null);
    fetchUserDraws()
      .then(async (payload) => {
        if (cancelled) return;
        const details = await Promise.all(
          payload.draws.map(async (draw) => ({
            id: draw.id,
            detail: await fetchUserDraw(draw.id, locale),
          })),
        );
        if (cancelled) return;
        const map = details.reduce<Record<string, UserDrawDetail>>((acc, entry) => {
          acc[entry.id] = entry.detail;
          return acc;
        }, {});
        setDrawDetails(map);
      })
      .catch((err) => {
        if (cancelled) return;
        setDrawLoadError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setDrawLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [calendarCompleted, locale]);

  const drawsByPool = useMemo(() => {
    const map = new Map<PrizePool, UserDrawDetail>();
    Object.values(drawDetails).forEach((detail) => map.set(detail.pool, detail));
    return map;
  }, [drawDetails]);

  const sendToast = (key: string) => {
    window.dispatchEvent(new CustomEvent("app:toast", { detail: { type: "success", key } }));
  };

  const handleSubmit = async (skip = false) => {
    if (!skip && rating === null) {
      setError(t("feedbackRatingRequired"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (skip) {
        await submitFeedback({ skipped: true });
        sendToast("feedbackSkipped");
      } else {
        await submitFeedback({ rating: rating ?? undefined, comment: comment || undefined });
        sendToast("feedbackSubmitted");
      }
      onFeedbackSubmitted();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack">
      <div className="panel">
        <header className="panel-header">
          <div>
            <h2>{t("feedbackTitle")}</h2>
            <p className="muted">{t("feedbackSubtitle")}</p>
          </div>
        </header>

        {!calendarCompleted ? (
          <div className="feedback-module">
            <h3>{t("feedbackLockedTitle")}</h3>
            <p className="muted">{t("feedbackLockedBody")}</p>
          </div>
        ) : needsFeedback ? (
          <div className="feedback-module">
            <div className="feedback-scale" role="radiogroup" aria-label={t("feedbackTitle")}>
              {feedbackOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`feedback-option ${rating === option.value ? "active" : ""}`}
                  onClick={() => setRating(option.value)}
                  aria-label={t(option.labelKey)}
                  aria-pressed={rating === option.value}
                >
                  <span className="feedback-emoji" aria-hidden="true">
                    {option.emoji}
                  </span>
                  <span className="feedback-label">{t(option.labelKey)}</span>
                </button>
              ))}
            </div>
            {freeTextEnabled && (
              <label className="feedback-comment">
                <span className="muted">{t("feedbackCommentLabel")}</span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  rows={4}
                  maxLength={commentLimit}
                  placeholder={t("feedbackCommentPlaceholder")}
                />
                <span
                  className={`feedback-comment-count muted${showCommentRemaining ? "" : " is-hidden"}`}
                >
                  {t("feedbackCharsRemaining", { count: commentRemaining })}
                </span>
              </label>
            )}
            {error && <p className="error">{error}</p>}
            <div className="feedback-actions">
              <button className="ghost" type="button" onClick={() => handleSubmit(true)} disabled={submitting}>
                {t("feedbackSkip")}
              </button>
              <button className="primary" type="button" onClick={() => handleSubmit(false)} disabled={submitting}>
                {submitting ? t("saving") : t("feedbackSubmit")}
              </button>
            </div>
          </div>
        ) : (
          <div className="feedback-module">
            <h3>{feedbackOpen ? t("feedbackThanksTitle") : t("feedbackClosedTitle")}</h3>
            <p className="muted">{feedbackOpen ? t("feedbackThanksBody") : t("feedbackClosedBody")}</p>
          </div>
        )}
      </div>

      <div className="panel prize-panel">
        <h2>{t("prizeSectionTitle")}</h2>
        {!calendarCompleted ? (
          <p className="muted">{t("prizeSectionBodyLocked")}</p>
        ) : (
          <>
            {prizeLoadError && <p className="error">{prizeLoadError}</p>}
            {drawLoadError && <p className="error">{drawLoadError}</p>}
            {eligibilityError && <p className="error">{eligibilityError}</p>}
            {eligibilityMessage && canViewPrizes && (
              <div className="panel subpanel prize-eligibility">
                <div className="eyebrow">{t("eligibilityTitle")}</div>
                <p>{eligibilityMessage}</p>
                <p className="muted small">{eligibilityCheckedAt}</p>
              </div>
            )}
            {!canViewPrizes ? (
              <div className="panel subpanel prize-eligibility">
                <div className="eyebrow">{t("prizeFeedbackGateTitle")}</div>
                <p>{t("prizeFeedbackGateBody")}</p>
              </div>
            ) : (
              <div className="prize-status-grid">
                {poolOrder.map((pool) => {
                  const draw = drawsByPool.get(pool);
                  return (
                    <div key={pool} className="panel subpanel prize-status-card">
                      <div className="eyebrow">{pool}</div>
                      <h4>{t("prizeSectionTitle")}</h4>
                      {!draw ? (
                        <>
                          {drawLoading ? (
                            <p className="muted">{t("loading")}</p>
                          ) : (
                            <p className="muted">{prizeStatusMessage(pool)}</p>
                          )}
                          {prizesAvailable && <p className="muted small">{t("prizeSectionBody")}</p>}
                        </>
                      ) : draw.prize ? (
                        <div className="prize-result prize-result-wide">
                          <div className="prize-art">
                            {draw.prize.image ? (
                              <img src={draw.prize.image} alt={draw.prize.name} loading="lazy" />
                            ) : (
                              <div className="prize-art-placeholder" aria-hidden="true">
                                ★
                              </div>
                            )}
                          </div>
                          <div className="prize-body">
                            <div>
                              <p className="prize-name">{draw.prize.name}</p>
                              <p className="muted">{draw.prize.description}</p>
                            </div>
                            {draw.delivery && (
                              <p className="muted small">
                                {draw.delivery.status === "delivered"
                                  ? t("prizeDeliveryDelivered", {
                                      method: deliveryMethodLabel(draw.delivery.method, draw.delivery.note),
                                    })
                                  : t("prizeDeliveryPending")}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="muted">{t("prizeNoPrize")}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
