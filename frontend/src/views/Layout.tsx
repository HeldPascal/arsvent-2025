import { Link } from "react-router-dom";
import LanguageSwitcher from "./components/LanguageSwitcher";
import type { Locale, User } from "../types";
import { useI18n } from "../i18n";

interface Props {
  user: User | null;
  loadingUser: boolean;
  onLogout: () => void;
  onLocaleChange: (locale: Locale) => void;
  children: React.ReactNode;
}

export default function Layout({ user, loadingUser, onLogout, children, onLocaleChange }: Props) {
  const { t } = useI18n();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <Link to="/" className="brand-link">
            <img src="/logo-arsvent-2025.png" alt="Arsvent logo" className="brand-logo" />
            <span className="brand-text">Arsvent 2025</span>
          </Link>
        </div>
        <div className="spacer" />
        {user ? (
          <>
            <div className="topbar-actions">
              <LanguageSwitcher user={user} onLocaleChange={onLocaleChange} />
              <span className="user-chip" title={user.globalName ?? user.username}>
                {user.globalName ?? user.username}
              </span>
              {user.isAdmin || user.isSuperAdmin ? (
                <Link className="ghost nav-link" to="/admin">
                  Admin
                </Link>
              ) : null}
              <Link className="ghost nav-link" to="/settings">
                {t("settingsTitle")}
              </Link>
              <button className="ghost logout-btn" onClick={onLogout}>
                {t("logout")}
              </button>
            </div>
          </>
        ) : loadingUser ? (
          <span className="muted">{t("loading")}</span>
        ) : null}
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
