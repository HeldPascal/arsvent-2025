import { useState } from "react";
import { updateLocale } from "../../services/api";
import type { User, Locale } from "../../types";
import { useI18n } from "../../i18n";

interface Props {
  user: User;
  onLocaleChange?: (locale: Locale) => void;
}

export default function LanguageSwitcher({ user, onLocaleChange }: Props) {
  const [saving, setSaving] = useState(false);
  const { locale, setLocale, t } = useI18n();
  const current = locale ?? user.locale;

  const toggleLocale = async () => {
    const next = current === "en" ? "de" : "en";
    setSaving(true);
    try {
      await updateLocale(next);
      setLocale(next);
      onLocaleChange?.(next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button className="ghost lang-btn" onClick={toggleLocale} disabled={saving}>
      <span className="lang-label">{t("languageLabel")}</span>
      <span className="lang-code">{current.toUpperCase()}</span>
    </button>
  );
}
