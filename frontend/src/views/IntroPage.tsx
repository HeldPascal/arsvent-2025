import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { completeIntro, fetchIntro } from "../services/api";
import type { Mode, User } from "../types";
import { useI18n } from "../i18n";
import ModeSelector from "./components/ModeSelector";
import { appendWebpFormat } from "../utils/assets";

interface Props {
  user: User;
  onModeChange: (mode: Mode) => void;
  onIntroComplete: () => void;
}

export default function IntroPage({ user, onModeChange, onIntroComplete }: Props) {
  const { t, locale, setLocale } = useI18n();
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

  useEffect(() => {
    if (user.locale && user.locale !== locale) {
      setLocale(user.locale);
    }
  }, [user.locale, locale, setLocale]);

  const rewriteAssets = useCallback(
    (html: string) => {
      if (!backendBase) return html;
      let out = html.replace(
        /src=(["'])(\/assets\/[^"']+)\1/g,
        (_m, quote, path) => `src=${quote}${backendBase}/content-${path.slice(1)}${quote}`,
      );
      out = out.replace(
        /src=(["'])(\/content-asset\/[^"']+)\1/g,
        (_m, quote, path) => `src=${quote}${appendWebpFormat(`${backendBase}${path}`)}${quote}`,
      );
      out = out.replace(
        /srcset=(["'])([^"']+)\1/gi,
        (_m, quote, val) => {
          const rewritten = val
            .split(",")
            .map((part: string) => {
              const [urlRaw, size] = part.trim().split(/\s+/, 2);
              const url = urlRaw ?? "";
              const masked = url.startsWith("/assets/")
                ? `${backendBase}/content-${url.slice(1)}`
                : url.startsWith("/content-asset/")
                  ? appendWebpFormat(`${backendBase}${url}`)
                  : url;
              return size ? `${masked} ${size}` : masked;
            })
            .join(", ");
          return `srcset=${quote}${rewritten}${quote}`;
        },
      );
      out = out.replace(/url\((['"]?)(\/content-asset\/[^'")]+)\1\)/gi, (_m, quote, path) => {
        return `url(${quote}${appendWebpFormat(`${backendBase}${path}`)}${quote})`;
      });
      out = out.replace(/url\((['"]?)(\/assets\/[^'")]+)\1\)/gi, (_m, quote, path) => {
        return `url(${quote}${backendBase}/content-${path.slice(1)}${quote})`;
      });
      return out;
    },
    [backendBase],
  );

  useEffect(() => {
    fetchIntro(locale)
      .then((data) => {
        setTitle(data.title);
        setBody(rewriteAssets(data.body));
        setIntroCompleted(Boolean(data.introCompleted));
      })
      .catch(() => setError(t("dayLoadFailed")))
      .finally(() => setLoading(false));
  }, [locale, rewriteAssets, t]);

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
