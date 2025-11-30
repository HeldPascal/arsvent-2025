import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const closeMenuAnd = (cb: () => void) => {
    setMenuOpen(false);
    cb();
  };

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
            <div className="topbar-actions row">
              <Link className="ghost icon-btn" to="/settings" title={t("settingsTitle")}>
                ⚙️
              </Link>
              <button className="ghost menu-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
                ☰
              </button>
            </div>
            {menuOpen && (
              <div className="menu-popover">
                <LanguageSwitcher user={user} onLocaleChange={onLocaleChange} />
                <span className="user-chip" title={user.globalName ?? user.username}>
                  {user.globalName ?? user.username}
                </span>
                {user.isAdmin || user.isSuperAdmin ? (
                  <button className="ghost nav-link" onClick={() => closeMenuAnd(() => navigate("/admin"))}>
                    Admin
                  </button>
                ) : null}
                <button className="ghost logout-btn" onClick={() => closeMenuAnd(onLogout)}>
                  {t("logout")}
                </button>
              </div>
            )}
          </>
        ) : loadingUser ? (
          <span className="muted">{t("loading")}</span>
        ) : null}
      </header>
      <main className="content">{children}</main>
      {scrolled && (
        <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top">
          ↑
        </button>
      )}
    </div>
  );
}
