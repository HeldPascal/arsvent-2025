import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchDay, submitAnswer } from "../services/api";
import type { DayDetail, User } from "../types";
import { useI18n } from "../i18n";

interface Props {
  user: User;
}

export default function DayPage({ user }: Props) {
  const { day } = useParams<{ day: string }>();
  const navigate = useNavigate();
  const dayNumber = Number(day);
  const { t } = useI18n();
  const [detail, setDetail] = useState<DayDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<{ message: string; correct: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 24) {
      navigate("/calendar");
      return;
    }

    fetchDay(dayNumber)
      .then((data) => setDetail(data))
      .catch(() => setError(t("dayLoadFailed")))
      .finally(() => setLoading(false));
  }, [dayNumber, navigate, t]);

  const onSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!detail) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const resp = await submitAnswer(detail.day, answer);
      setDetail({ ...detail, isSolved: resp.isSolved });
      setFeedback({ message: resp.message, correct: resp.correct });
      if (resp.correct) {
        setAnswer("");
      }
    } catch (err) {
      setFeedback({ message: t("submissionFailed"), correct: false });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="panel">{t("loading")}</div>;
  if (error) return <div className="panel error">{error}</div>;
  if (!detail) return null;

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
          <article className="riddle-body" dangerouslySetInnerHTML={{ __html: detail.body }} />
          {detail.isSolved ? (
            <span className="pill success">{t("solved")}</span>
          ) : (
            <>
              <form className="answer-form" onSubmit={onSubmit}>
                <input
                  type="text"
                  placeholder={t("yourAnswer")}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  required
                  disabled={submitting}
                />
                <button className="primary" type="submit" disabled={submitting}>
                  {submitting ? t("checking") : t("submit")}
                </button>
              </form>
              {feedback && (
                <div className={`feedback ${feedback.correct ? "success" : "error"}`}>{feedback.message}</div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="muted">{detail.message ?? t("notAvailable")}</div>
      )}
    </div>
  );
}
