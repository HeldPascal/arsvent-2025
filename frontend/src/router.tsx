import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import HomePage from "./views/HomePage";
import CalendarPage from "./views/CalendarPage";
import DayPage from "./views/DayPage";
import SettingsPage from "./views/SettingsPage";
import AdminPage from "./views/AdminPage";
import { fetchMe } from "./services/api";
import type { Locale, User } from "./types";
import Layout from "./views/Layout";
import { I18nProvider } from "./i18n";

export default function AppRouter() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>("en");
  const [stateVersion, setStateVersion] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMe()
      .then((u) => {
        setUser(u);
        setLocale(u.locale);
        setStateVersion(u.stateVersion ?? 0);
      })
      .catch(() => {
        setUser(null);
        setLocale("en");
        setStateVersion(0);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUserPatch = (patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const refresh = () => {
      fetchMe()
        .then((u) => {
          if (cancelled) return;
          setUser(u);
          setLocale(u.locale);
          setStateVersion(u.stateVersion ?? 0);
        })
        .catch(() => {
          if (cancelled) return;
          setUser(null);
          setLocale("en");
          setStateVersion(0);
          navigate("/");
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
  };

  return (
    <I18nProvider locale={locale} setLocale={setLocale}>
      <Layout user={user} onLogout={handleLogout} loadingUser={loading} onLocaleChange={handleLocaleChange}>
        <Routes>
          <Route path="/" element={<HomePage user={user} loading={loading} />} />
          <Route
            path="/calendar"
            element={
              user ? (
                <CalendarPage
                  user={user}
                  version={stateVersion}
                  onModeChange={(mode) => handleUserPatch({ mode })}
                />
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
                <DayPage user={user} version={stateVersion} />
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
                <SettingsPage user={user} onModeChange={(mode) => handleUserPatch({ mode })} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </I18nProvider>
  );
}
