import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { User } from "../types";
import { useI18n } from "../i18n";

interface Props {
  user: User | null;
  loading: boolean;
}

export default function HomePage({ user, loading }: Props) {
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    if (user) {
      navigate("/calendar");
    }
  }, [user, navigate]);

  const backendBase = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ?? "";
  const loginUrl = `${backendBase}/auth/discord`;

  return (
    <div className="panel">
      <h1>{t("homeTitle")}</h1>
      <p className="muted">{t("homeSubtitle")}</p>
      {loading ? (
        <p>{t("loadingSession")}</p>
      ) : user ? (
        <p>
          {t("continueCalendar")}{" "}
          <Link to="/calendar" className="primary">
            {t("calendarLink") ?? "Calendar"}
          </Link>
        </p>
      ) : (
        <a className="primary" href={loginUrl}>
          {t("login")}
        </a>
      )}
    </div>
  );
}
