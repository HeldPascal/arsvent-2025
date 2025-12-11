import { useEffect, useRef, useState } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import HomePage from "./views/HomePage";
import CalendarPage from "./views/CalendarPage";
import DayPage from "./views/DayPage";
import SettingsPage from "./views/SettingsPage";
import AdminPage from "./views/AdminPage";
import AdminAuditPage from "./views/AdminAuditPage";
import { fetchMe } from "./services/api";
import type { Locale, User } from "./types";
import Layout from "./views/Layout";
import { I18nProvider } from "./i18n";
import IntroPage from "./views/IntroPage";

export default function AppRouter() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialLocale = (() => {
    const params = new URLSearchParams(window.location.search);
    const queryLang = params.get("lang");
    if (queryLang === "en" || queryLang === "de") return queryLang;
    try {
      const stored = localStorage.getItem("arsvent_locale");
      if (stored === "en" || stored === "de") return stored;
    } catch {
      // ignore storage errors
    }
    return "en";
  })();
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [stateVersion, setStateVersion] = useState(0);
  const navigate = useNavigate();
  const hadUserRef = useRef(false);
  const backendBase = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ?? "";
  const logoutUrl = `${backendBase}/auth/logout`;
  const normalizeMode = (mode: string): User["mode"] => (mode === "VETERAN" || mode === "VET" ? "VETERAN" : "NORMAL");

  const pushToast = (detail: { type: "success" | "error" | "info"; message?: string; key?: string; durationMs?: number }) => {
    window.dispatchEvent(new CustomEvent("app:toast", { detail }));
  };

  useEffect(() => {
    try {
      document.documentElement.lang = locale;
    } catch {
      // ignore
    }
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    let retrying = false;

    const load = async () => {
      retrying = false;
      try {
        const u = await fetchMe();
        if (cancelled) return;
        const normalizedUser = { ...u, mode: normalizeMode(u.mode) };
        setUser(normalizedUser);
        const nextLocale = (["en", "de"] as const).includes(locale) ? locale : normalizedUser.locale;
        setLocale(nextLocale);
        try {
          localStorage.setItem("arsvent_locale", nextLocale);
        } catch {
          // ignore
        }
        setStateVersion(normalizedUser.stateVersion ?? 0);
        hadUserRef.current = true;
        if (!normalizedUser.introCompleted) {
          navigate("/intro", { replace: true });
        }
      } catch (err) {
        if (cancelled) return;
        const status = (err as { status?: number })?.status;
        if (status === 401) {
          setUser(null);
          setLocale(initialLocale);
          setStateVersion(0);
          hadUserRef.current = false;
        } else {
          // Keep the existing user state if the failure was transient
          if (hadUserRef.current) {
            pushToast({ type: "info", key: "sessionRefreshRetry" });
          }
          // retry once after a brief delay
          retrying = true;
          window.setTimeout(() => {
            if (!cancelled) {
              load();
            }
          }, 700);
          return;
        }
      } finally {
        if (!cancelled && !retrying) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [initialLocale, navigate, locale]);

  const handleUserPatch = (patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleIntroComplete = () => {
    setUser((prev) => (prev ? { ...prev, introCompleted: true } : prev));
  };

  const handleLogout = () => {
    fetch(logoutUrl, { method: "POST", credentials: "include" }).finally(() => {
      setUser(null);
      hadUserRef.current = false;
      navigate("/");
      pushToast({ type: "success", key: "logoutSuccess" });
    });
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const refresh = () => {
      fetchMe()
        .then((u) => {
          if (cancelled) return;
          const normalizedUser = { ...u, mode: normalizeMode(u.mode) };
          setUser(normalizedUser);
          setLocale(normalizedUser.locale);
          setStateVersion(normalizedUser.stateVersion ?? 0);
          hadUserRef.current = true;
          if (!normalizedUser.introCompleted) {
            navigate("/intro", { replace: true });
          }
        })
        .catch((err) => {
          if (cancelled) return;
          const status = (err as { status?: number })?.status;
          if (status === 401) {
            if (hadUserRef.current) {
              pushToast({ type: "info", key: "sessionEnded" });
            }
            hadUserRef.current = false;
            setUser(null);
            setLocale("en");
            setStateVersion(0);
            navigate("/");
          } else {
            // transient failure; keep user state and try again soon
            pushToast({
              type: "info",
              key: "sessionRefreshRetry",
              durationMs: 4000,
            });
          }
        });
    };

    const interval = window.setInterval(refresh, 10000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user, navigate]);

  const handleLocaleChange = (loc: Locale) => {
    setLocale(loc);
    setUser((prev) => (prev ? { ...prev, locale: loc } : prev));
    try {
      localStorage.setItem("arsvent_locale", loc);
    } catch {
      // ignore
    }
  };

  return (
    <I18nProvider locale={locale} setLocale={setLocale}>
      <Layout user={user} onLogout={handleLogout} loadingUser={loading} onLocaleChange={handleLocaleChange}>
        <Routes>
          <Route path="/" element={<HomePage user={user} loading={loading} />} />
          <Route
            path="/intro"
            element={
              user ? (
                <IntroPage user={user} onModeChange={(mode) => handleUserPatch({ mode })} onIntroComplete={handleIntroComplete} />
              ) : loading ? (
                <div className="panel">Loading…</div>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/calendar"
            element={
              user ? (
                user.introCompleted ? (
                  <CalendarPage
                    user={user}
                    version={stateVersion}
                    onModeChange={(mode) => handleUserPatch({ mode })}
                  />
                ) : (
                  <Navigate to="/intro" replace />
                )
              ) : loading ? (
                <div className="panel">Loading…</div>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/day/:day"
            element={
              user ? (
                user.introCompleted ? (
                  <DayPage user={user} version={stateVersion} />
                ) : (
                  <Navigate to="/intro" replace />
                )
              ) : loading ? (
                <div className="panel">Loading…</div>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/settings"
            element={
              user ? (
                user.introCompleted ? (
                  <SettingsPage
                    user={user}
                    onModeChange={(mode) => handleUserPatch({ mode })}
                    onFunChange={(creatureSwap) => handleUserPatch({ creatureSwap })}
                  />
                ) : (
                  <Navigate to="/intro" replace />
                )
              ) : loading ? (
                <div className="panel">Loading…</div>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/admin"
            element={
              user ? (
                user.isAdmin || user.isSuperAdmin ? (
                  <AdminPage user={user} />
                ) : (
                  <Navigate to="/" replace />
                )
              ) : loading ? (
                <div className="panel">Loading…</div>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/admin/audit"
            element={
              user ? (
                user.isAdmin || user.isSuperAdmin ? (
                  <AdminAuditPage user={user} />
                ) : (
                  <Navigate to="/" replace />
                )
              ) : loading ? (
                <div className="panel">Loading…</div>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </I18nProvider>
  );
}
