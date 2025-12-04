import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import LanguageSwitcher from "./components/LanguageSwitcher";
import type { Locale, User } from "../types";
import { useI18n } from "../i18n";
import Toast from "./components/Toast";

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
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const handledAuthRef = useRef<string | null>(null);
  const [toasts, setToasts] = useState<
    Array<{ id: number; type: "success" | "error" | "info"; message?: string; key?: string; durationMs?: number }>
  >([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [t]);

  useEffect(() => {
    const handleClickAway = (event: MouseEvent) => {
      if (!menuOpen) return;
      const target = event.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [menuOpen]);

  const closeMenuAnd = (cb: () => void) => {
    setMenuOpen(false);
    cb();
  };

  const addToast = (toast: { type: "success" | "error" | "info"; message?: string; key?: string; durationMs?: number }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, ...toast }]);
  };

  useEffect(() => {
    const onGlobalToast = (event: Event) => {
      const detail = (event as CustomEvent<{ type: "success" | "error" | "info"; message?: string; key?: string }>).detail;
      if (detail?.type) {
        addToast(detail);
      }
    };
    window.addEventListener("app:toast", onGlobalToast);
    return () => window.removeEventListener("app:toast", onGlobalToast);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const auth = params.get("auth");
      if (auth && handledAuthRef.current !== auth) {
        handledAuthRef.current = auth;
        if (auth === "success") {
          addToast({ type: "success", key: "loginSuccess" });
        } else if (auth === "failed") {
          addToast({ type: "error", key: "loginFailed" });
        }
        params.delete("auth");
        const newSearch = params.toString();
        navigate({ pathname: location.pathname, search: newSearch ? `?${newSearch}` : "" }, { replace: true });
      }
  }, [location.pathname, location.search, navigate, t]);

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
            <div className="topbar-actions row menu-container" ref={menuRef}>
              <Link className="ghost icon-btn" to="/settings" title={t("settingsTitle")}>
                ⚙️
              </Link>
              <button className="ghost menu-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
                ☰
              </button>
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
            </div>
          </>
        ) : loadingUser ? (
          <span className="muted">{t("loading")}</span>
        ) : (
          <div className="topbar-actions row menu-container" ref={menuRef}>
            <button className="ghost menu-toggle" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
              ☰
            </button>
            {menuOpen && (
              <div className="menu-popover">
                <LanguageSwitcher onLocaleChange={onLocaleChange} persistOnly />
              </div>
            )}
          </div>
        )}
      </header>
      {toasts.length > 0 && (
        <div className="toast-region">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              type={toast.type}
              message={toast.message ?? (toast.key ? t(toast.key as any) : "")}
              durationMs={toast.durationMs}
              onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            />
          ))}
        </div>
      )}
      <main className="content">{children}</main>
      {scrolled && (
        <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top">
          ↑
        </button>
      )}
    </div>
  );
}
