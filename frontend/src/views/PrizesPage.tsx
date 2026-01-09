import { useMemo, useState } from "react";
import type { User } from "../types";
import { submitFeedback } from "../services/api";
import { useI18n } from "../i18n";

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
  const { t } = useI18n();
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feedbackEndsAt = useMemo(
    () => (user.feedbackEndsAt ? new Date(user.feedbackEndsAt) : null),
    [user.feedbackEndsAt],
  );
  const feedbackOpen =
    (user.feedbackOpen ?? null) ??
    (Boolean(user.feedbackEnabled) && (!feedbackEndsAt || Date.now() <= feedbackEndsAt.getTime()));
  const freeTextEnabled = user.feedbackFreeTextEnabled ?? true;
  const needsFeedback = !user.hasSubmittedFeedback && feedbackOpen;
  const commentLimit = 1000;
  const commentRemaining = commentLimit - comment.length;
  const showCommentRemaining = commentRemaining <= 200;
  const prizesAvailable = Boolean(user.prizesAvailable);

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
            <div className="eyebrow">{t("feedbackTitle")}</div>
            <h2>{t("feedbackTitle")}</h2>
            <p className="muted">{t("feedbackSubtitle")}</p>
          </div>
        </header>

        {needsFeedback ? (
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

      <div className="panel">
        <h3>{t("prizeSectionTitle")}</h3>
        <p className="muted">
          {prizesAvailable ? t("prizeSectionBody") : t("prizeSectionBodyPending")}
        </p>
      </div>
    </div>
  );
}
