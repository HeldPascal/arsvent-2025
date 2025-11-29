import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import HomePage from "./views/HomePage";
import CalendarPage from "./views/CalendarPage";
import DayPage from "./views/DayPage";
import SettingsPage from "./views/SettingsPage";
import { fetchMe } from "./services/api";
import type { Locale, User } from "./types";
import Layout from "./views/Layout";
import { I18nProvider } from "./i18n";

export default function AppRouter() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>("en");
  const navigate = useNavigate();

  useEffect(() => {
    fetchMe()
      .then((u) => {
        setUser(u);
        setLocale(u.locale);
      })
      .catch(() => {
        setUser(null);
        setLocale("en");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    setUser(null);
    navigate("/");
  };

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
                <CalendarPage user={user} />
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
                <DayPage user={user} />
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
                <SettingsPage user={user} />
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
