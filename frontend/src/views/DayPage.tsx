import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchDay, submitAnswer } from "../services/api";
import type { DayDetail, RiddleAnswerPayload, User } from "../types";
import { useI18n } from "../i18n";
import ConfirmDialog from "./components/ConfirmDialog";
import RiddleAnswerForm from "./components/RiddleAnswerForm";

interface Props {
  user: User;
  version: number;
}

export default function DayPage({ user, version }: Props) {
  const { day } = useParams<{ day: string }>();
  const navigate = useNavigate();
  const dayNumber = Number(day);
  const { t } = useI18n();
  const [detail, setDetail] = useState<DayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; correct: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [warned, setWarned] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<RiddleAnswerPayload | null>(null);
  const backendBase =
    import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ||
    (window.location.origin.includes("localhost:5173") ? "http://localhost:4000" : window.location.origin);

  const rewriteAssets = (html: string) =>
    backendBase
      ? html.replace(
          /src=(["'])(\/assets\/[^"']+)\1/g,
          (_m, quote, path) => `src=${quote}${backendBase}/content-${path.slice(1)}${quote}`,
        )
      : html;

  useEffect(() => {
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 24) {
      navigate("/calendar");
      return;
    }

    setLoading(true);
    setError(null);
    setFeedback(null);
    setPendingPayload(null);
    setWarned(false);
    setShowConfirm(false);

    fetchDay(dayNumber)
      .then((data) => setDetail(data))
      .catch(() => setError(t("dayLoadFailed")))
      .finally(() => setLoading(false));
  }, [dayNumber, navigate, t, version]);

  const performSubmit = async (payload: RiddleAnswerPayload) => {
    if (!detail) return;
    setSubmitting(true);
    setFeedback(null);
    setPendingPayload(null);
    try {
      const resp = await submitAnswer(detail.day, payload);
      setDetail((current) =>
        current
          ? {
              ...current,
              isSolved: resp.isSolved,
              solvedAnswer: resp.correct ? (resp.solution as any) ?? current.solvedAnswer : current.solvedAnswer,
              post: resp.correct ? resp.post ?? current.post : current.post,
              reward: resp.correct ? resp.reward ?? current.reward : current.reward,
            }
          : current,
      );
      setFeedback({ message: resp.message, correct: resp.correct });
    } catch (err) {
      const message = err instanceof Error ? err.message : t("submissionFailed");
      setFeedback({ message, correct: false });
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (payload: RiddleAnswerPayload) => {
    if (!detail) return;
    if (user.mode === "NORMAL" && detail.day === 1 && !warned) {
      setPendingPayload(payload);
      setShowConfirm(true);
      return;
    }
    void performSubmit(payload);
  };

  if (loading) return <div className="panel">{t("loading")}</div>;
  if (error) return <div className="panel error">{error}</div>;
  if (!detail) return null;
  const bodyHtml = rewriteAssets(detail.body);
  const postHtml = detail.post ? rewriteAssets(detail.post) : null;
  const rewardImage =
    detail.reward?.image && detail.reward.image.startsWith("/assets/") && backendBase
      ? `${backendBase}${detail.reward.image}`
      : detail.reward?.image ?? null;

  return (
    <div className="panel">
      <header className="panel-header">
        <div>
          <div className="eyebrow">
            {t("day")} {detail.day} · {user.mode}
          </div>
          <h2>{detail.title}</h2>
        </div>
        <div className="panel-actions">
          <button className="ghost nav-link" onClick={() => navigate("/calendar")}>
            {t("backToCalendar")}
          </button>
        </div>
      </header>

      {detail.canPlay ? (
        <>
          <article className="riddle-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          <RiddleAnswerForm detail={detail} submitting={submitting} onSubmit={onSubmit} />
          {detail.isSolved && (
            <div className="banner success">
              <div className="banner-title">{t("solved")}</div>
              <div className="banner-body">{t("answerCorrect")}</div>
            </div>
          )}
          {!detail.isSolved && feedback && feedback.correct && (
            <div className="banner success">
              <div className="banner-title">{t("solved")}</div>
              <div className="banner-body">{t("answerCorrect")}</div>
            </div>
          )}
          {!detail.isSolved && feedback && !feedback.correct && (
            <div className="banner error">
              <div className="banner-title">{t("unsolved")}</div>
              <div className="banner-body">{t("answerIncorrect")}</div>
            </div>
          )}
          {detail.isSolved && postHtml && (
            <article className="riddle-body" dangerouslySetInnerHTML={{ __html: postHtml }} />
          )}
          {detail.isSolved && detail.reward && (
            <div className="reward-card">
              {rewardImage && <img src={rewardImage} alt={detail.reward.title} className="reward-image" />}
              <div>
                <div className="reward-title">{detail.reward.title}</div>
                {detail.reward.description && <div className="reward-desc">{detail.reward.description}</div>}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="muted">{detail.message ?? t("notAvailable")}</div>
      )}

      {showConfirm && (
        <ConfirmDialog
          message={t("warnNormalLock")}
          confirmLabel={t("confirm")}
          cancelLabel={t("cancel")}
          onConfirm={() => {
            setWarned(true);
            setShowConfirm(false);
            if (pendingPayload) {
              void performSubmit(pendingPayload);
            }
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
