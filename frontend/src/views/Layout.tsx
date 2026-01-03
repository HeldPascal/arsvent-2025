import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { updateLocale as apiUpdateLocale } from "../services/api";
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
  const { t, locale } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const handledAuthRef = useRef<string | null>(null);
  const [screenshotting, setScreenshotting] = useState(false);
  const allowTestTools =
    user?.isProduction === false && (user?.appEnv === "staging" || user?.appEnv === "development");
  const [toasts, setToasts] = useState<
    Array<{ id: number; type: "success" | "error" | "info"; message?: string; key?: string; durationMs?: number }>
  >([]);
  const syncedLocaleRef = useRef<string | null>(null);

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

  // Persist client-selected locale to the backend after login
  useEffect(() => {
    if (!user || !locale) return;
    const key = `${user.id}:${locale}`;
    if (syncedLocaleRef.current === key) return;
    if (user.locale === locale) {
      syncedLocaleRef.current = key;
      return;
    }
    const persist = async () => {
      try {
        await apiUpdateLocale(locale as Locale);
        onLocaleChange(locale as Locale);
      } catch {
        // ignore sync failures; UI locale stays
      } finally {
        syncedLocaleRef.current = key;
      }
    };
    void persist();
  }, [user, locale, onLocaleChange]);

  const closeMenuAnd = (cb: () => void) => {
    setMenuOpen(false);
    cb();
  };

  const addToast = (toast: { type: "success" | "error" | "info"; message?: string; key?: string; durationMs?: number }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => {
      if (toast.key && prev.some((t) => t.key === toast.key)) return prev;
      return [...prev, { id, ...toast }];
    });
  };

  useEffect(() => {
    const onGlobalToast = (event: Event) => {
      const detail = (
        event as CustomEvent<{ type: "success" | "error" | "info"; message?: string; key?: string; durationMs?: number }>
      ).detail;
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

  const handleScreenshot = async () => {
    if (!user?.isAdmin && !user?.isSuperAdmin) return;
    if (screenshotting) return;
    setScreenshotting(true);
    try {
      const target = document.documentElement;
      const width = target.scrollWidth;
      const height = target.scrollHeight;
      const dataUrl = await toPng(target, {
        cacheBust: true,
        pixelRatio: window.devicePixelRatio || 2,
        width,
        height,
        canvasWidth: width,
        canvasHeight: height,
        style: { width: `${width}px`, height: `${height}px` },
      });
      const link = document.createElement("a");
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      link.download = `arsvent-${stamp}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      addToast({ type: "error", message: (err as Error).message || "Failed to capture screenshot" });
    } finally {
      setScreenshotting(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <Link to="/" className="brand-link">
            <picture>
              <source srcSet="/logo-arsvent-2025.webp" type="image/webp" />
              <img
                src="/logo-arsvent-2025.png"
                alt="Arsvent logo"
                className="brand-logo"
                loading="eager"
                fetchPriority="high"
              />
            </picture>
            <span className="brand-text">Arsvent 2025</span>
          </Link>
        </div>
        <div className="spacer" />
        {user ? (
          <>
            <div className="topbar-actions row menu-container" ref={menuRef}>
              {(user.isAdmin || user.isSuperAdmin) && (
                <button className="ghost icon-btn" onClick={handleScreenshot} title="Download full-page screenshot" disabled={screenshotting}>
                  {screenshotting ? "…" : "📸"}
                </button>
              )}
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
                  <button className="ghost nav-link" onClick={() => closeMenuAnd(() => navigate("/inventory"))}>
                    {t("inventoryTitle")}
                  </button>
                  {user.isAdmin || user.isSuperAdmin ? (
                    <button className="ghost nav-link" onClick={() => closeMenuAnd(() => navigate("/admin"))}>
                      Admin
                    </button>
                  ) : null}
                  {allowTestTools && (user.isAdmin || user.isSuperAdmin) ? (
                    <button className="ghost nav-link" onClick={() => closeMenuAnd(() => navigate("/admin/test"))}>
                      Test tools
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
              message={toast.message ?? (toast.key ? t(toast.key as Parameters<typeof t>[0]) : "")}
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
