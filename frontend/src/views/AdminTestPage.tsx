import { useState } from "react";
import type { User } from "../types";
import {
  adminTestForceComplete,
  adminTestResetFeedback,
  adminTestSetEligibility,
  adminTestUnlockAll,
  adminTestUnlockNext,
  adminTestUnlockSet,
} from "../services/api";

type Props = {
  user: User;
};

const isTestEnv = (user: User) =>
  user.isProduction === false && (user.appEnv === "staging" || user.appEnv === "development");

export default function AdminTestPage({ user }: Props) {
  const [unlockDay, setUnlockDay] = useState(1);
  const [forceUserId, setForceUserId] = useState("");
  const [forceDay, setForceDay] = useState(1);
  const [eligibleUserId, setEligibleUserId] = useState("");
  const [eligible, setEligible] = useState(true);
  const [busy, setBusy] = useState(false);

  const pushToast = (type: "success" | "error" | "info", message: string) => {
    window.dispatchEvent(new CustomEvent("app:toast", { detail: { type, message } }));
  };

  if (!isTestEnv(user)) {
    return (
      <div className="panel">
        <h1>Admin test utilities</h1>
        <p className="muted">Test utilities are only available in staging or development.</p>
      </div>
    );
  }

  const handleAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setBusy(true);
    try {
      await action();
      pushToast("success", successMessage);
    } catch (err) {
      const message = (err as Error).message || "Request failed.";
      pushToast("error", message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-grid">
      <div className="panel test-panel">
        <header className="panel-header">
          <div>
            <div className="eyebrow">Test tools</div>
            <h2>Availability &amp; time locks</h2>
            <p className="muted">Staging/development-only utilities for test flows.</p>
          </div>
        </header>

        <div className="admin-actions">
          <button disabled={busy} onClick={() => handleAction(() => adminTestUnlockNext(), "Unlocked next day.")}>
            Unlock next day
          </button>
          <button disabled={busy} onClick={() => handleAction(() => adminTestUnlockAll(), "Unlocked all days.")}>
            Bypass time locks (unlock all)
          </button>
        </div>

        <div className="progress-editor">
          <label>
            Set unlocked day
            <input
              type="number"
              min={0}
              max={24}
              value={unlockDay}
              onChange={(e) => setUnlockDay(Number(e.target.value))}
            />
          </label>
          <button
            disabled={busy}
            onClick={() => handleAction(() => adminTestUnlockSet(unlockDay), `Unlocked day set to ${unlockDay}.`)}
          >
            Set unlocked day
          </button>
        </div>
      </div>

      <div className="panel test-panel">
        <header className="panel-header">
          <div>
            <div className="eyebrow">Test tools</div>
            <h2>Force completion</h2>
            <p className="muted">Mark a user as solved up to a given day.</p>
          </div>
        </header>

        <div className="progress-editor">
          <label>
            User ID
            <input type="text" value={forceUserId} onChange={(e) => setForceUserId(e.target.value.trim())} />
          </label>
          <label>
            Day
            <input
              type="number"
              min={0}
              max={24}
              value={forceDay}
              onChange={(e) => setForceDay(Number(e.target.value))}
            />
          </label>
          <button
            disabled={busy || !forceUserId}
            onClick={() =>
              handleAction(() => adminTestForceComplete(forceUserId, forceDay), "User completion updated.")
            }
          >
            Force completion
          </button>
        </div>
      </div>

      <div className="panel test-panel">
        <header className="panel-header">
          <div>
            <div className="eyebrow">Test tools</div>
            <h2>Simulate eligibility</h2>
            <p className="muted">Toggle a user between eligible and ineligible test states.</p>
          </div>
        </header>

        <div className="progress-editor">
          <label>
            User ID
            <input type="text" value={eligibleUserId} onChange={(e) => setEligibleUserId(e.target.value.trim())} />
          </label>
          <label>
            Eligible
            <select value={eligible ? "yes" : "no"} onChange={(e) => setEligible(e.target.value === "yes")}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <button
            disabled={busy || !eligibleUserId}
            onClick={() =>
              handleAction(
                () => adminTestSetEligibility(eligibleUserId, eligible),
                `Eligibility set to ${eligible ? "eligible" : "ineligible"}.`,
              )
            }
          >
            Set eligibility
          </button>
        </div>
      </div>

      <div className="panel test-panel">
        <header className="panel-header">
          <div>
            <div className="eyebrow">Test tools</div>
            <h2>Feedback reset</h2>
            <p className="muted">Clear all feedback entries and reset feedback flags.</p>
          </div>
        </header>

        <div className="admin-actions">
          <button
            disabled={busy}
            onClick={() => handleAction(() => adminTestResetFeedback(), "Feedback data cleared.")}
          >
            Wipe feedback data
          </button>
        </div>
      </div>
    </div>
  );
}
