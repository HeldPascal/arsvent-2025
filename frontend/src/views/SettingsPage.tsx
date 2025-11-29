import { Link } from "react-router-dom";
import ModeSelector from "./components/ModeSelector";
import type { User } from "../types";
import { useI18n } from "../i18n";

interface Props {
  user: User;
}

export default function SettingsPage({ user }: Props) {
  const { t } = useI18n();

  return (
    <div className="panel">
      <header className="panel-header">
        <div>
          <div className="eyebrow">{t("difficulty")}</div>
          <h2>{t("settingsTitle")}</h2>
          <p className="muted">{t("settingsSubtitle")}</p>
        </div>
        <Link className="ghost nav-link" to="/calendar">
          {t("backToCalendar")}
        </Link>
      </header>
      <ModeSelector mode={user.mode} />
    </div>
  );
}
