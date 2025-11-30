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

  if (loading) {
    return (
      <div className="panel">
        <h1>{t("homeTitle")}</h1>
        <p>{t("loadingSession")}</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="panel">
        <h1>{t("homeTitle")}</h1>
        <p>
          {t("continueCalendar")}{" "}
          <Link to="/calendar" className="primary">
            {t("calendarLink") ?? "Calendar"}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <section className="hero">
      <h1 className="hero-title">{t("homeTitle")}</h1>
      <p className="hero-subtitle">{t("homeSubtitle")}</p>
      <a className="primary hero-cta" href={loginUrl}>
        <span className="discord-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" role="presentation">
            <path
              fill="#ffffff"
              d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.078.037c-.21.37-.444.85-.607 1.23a18.445 18.445 0 0 0-5.63 0 13.002 13.002 0 0 0-.616-1.23.077.077 0 0 0-.078-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.033.028C1.186 9.14.58 13.74.946 18.275a.08.08 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.08.08 0 0 0 .087-.028 13.933 13.933 0 0 0 1.21-1.967.078.078 0 0 0-.042-.11 12.932 12.932 0 0 1-1.872-.89.078.078 0 0 1-.008-.129c.126-.095.252-.194.372-.296a.078.078 0 0 1 .082-.01 13.755 13.755 0 0 0 11.487 0 .078.078 0 0 1 .083.009c.12.102.246.202.372.297a.078.078 0 0 1-.007.129 12.348 12.348 0 0 1-1.873.888.078.078 0 0 0-.042.111c.355.687.77 1.343 1.209 1.966a.078.078 0 0 0 .087.029 19.876 19.876 0 0 0 6.001-3.031.078.078 0 0 0 .031-.056c.5-5.2-.838-9.766-3.486-13.879a.062.062 0 0 0-.033-.028ZM9.857 15.63c-1.12 0-2.033-.999-2.033-2.228 0-1.228.904-2.228 2.033-2.228 1.138 0 2.042 1.01 2.033 2.228 0 1.23-.904 2.228-2.033 2.228Zm5.284 0c-1.12 0-2.033-.999-2.033-2.228 0-1.228.904-2.228 2.033-2.228 1.138 0 2.042 1.01 2.033 2.228 0 1.23-.895 2.228-2.033 2.228Z"
            />
          </svg>
        </span>
        {t("login")}
      </a>
    </section>
  );
}
