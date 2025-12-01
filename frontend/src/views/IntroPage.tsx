import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeIntro, fetchIntro } from "../services/api";
import type { Mode, User } from "../types";
import { useI18n } from "../i18n";
import ModeSelector from "./components/ModeSelector";

interface Props {
  user: User;
  onModeChange: (mode: Mode) => void;
  onIntroComplete: () => void;
}

export default function IntroPage({ user, onModeChange, onIntroComplete }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [introCompleted, setIntroCompleted] = useState(Boolean(user.introCompleted));
  const [saving, setSaving] = useState(false);
  const backendBase =
    import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ||
    (window.location.origin.includes("localhost:5173") ? "http://localhost:4000" : window.location.origin);

  const rewriteAssets = (html: string) =>
    backendBase
      ? html.replace(/src=(["'])(\/assets\/[^"']+)\1/g, (_m, quote, path) => `src=${quote}${backendBase}${path}${quote}`)
      : html;

  useEffect(() => {
    fetchIntro()
      .then((data) => {
        setTitle(data.title);
        setBody(rewriteAssets(data.body));
        setIntroCompleted(Boolean(data.introCompleted));
      })
      .catch(() => setError(t("dayLoadFailed")))
      .finally(() => setLoading(false));
  }, [t]);

  const finishIntro = async () => {
    setSaving(true);
    try {
      await completeIntro();
      setIntroCompleted(true);
      onIntroComplete();
      window.dispatchEvent(
        new CustomEvent("app:toast", {
          detail: { type: "success", key: "introCompleted", durationMs: 5000 },
        }),
      );
      setTimeout(() => navigate("/calendar"), 5400);
    } catch {
      setError(t("submissionFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="panel">{t("loading")}</div>;
  if (error) return <div className="panel error">{error}</div>;

  return (
    <div className="panel">
      <header className="panel-header">
        <div>
          <div className="eyebrow">{t("introLabel")}</div>
          <h2>{title}</h2>
        </div>
        <div className="panel-actions">
          {introCompleted && (
            <button className="ghost nav-link" onClick={() => navigate("/calendar")}>
              {t("backToCalendar")}
            </button>
          )}
        </div>
      </header>

      <article className="riddle-body" dangerouslySetInnerHTML={{ __html: body }} />

      <div className="stack">
        <ModeSelector mode={user.mode} lastSolvedDay={user.lastSolvedDay} onUpdated={onModeChange} />
        {!introCompleted && (
          <div className="panel-actions">
            <button className="primary nav-link" disabled={saving} onClick={finishIntro}>
              {t("introContinue")}
            </button>
          </div>
        )}
        {introCompleted && (
          <div className="banner success">
            <div className="banner-title">{t("introCompleted")}</div>
            <div className="banner-body">{t("introRevisitHint")}</div>
          </div>
        )}
      </div>
    </div>
  );
}
