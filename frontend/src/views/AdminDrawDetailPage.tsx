import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type {
  AdminDrawAssignment,
  AdminDrawDetail,
  AdminPrize,
  AdminPrizeStore,
  DeliveryMethod,
  LocalizedText,
} from "../types";
import {
  fetchAdminDraw,
  fetchAdminPrizes,
  overrideAdminDraw,
  publishAdminDraw,
  updateAdminDrawDelivery,
} from "../services/api";
import ConfirmDialog from "./components/ConfirmDialog";
import { useI18n } from "../i18n";

type OverrideDraft = { newPrizeId: string; reason: string };

export default function AdminDrawDetailPage() {
  const { id } = useParams();
  const [detail, setDetail] = useState<AdminDrawDetail | null>(null);
  const [store, setStore] = useState<AdminPrizeStore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [overrideDrafts, setOverrideDrafts] = useState<Record<string, OverrideDraft>>({});
  const [deliveryMethods, setDeliveryMethods] = useState<Record<string, DeliveryMethod | "">>({});
  const [deliveryNotes, setDeliveryNotes] = useState<Record<string, string>>({});
  const { locale, t } = useI18n();

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [drawData, prizeStore] = await Promise.all([fetchAdminDraw(id), fetchAdminPrizes()]);
      setDetail(drawData);
      setStore(prizeStore);
    } catch (err) {
      setError((err as Error).message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const prizeMap = useMemo(() => {
    const map = new Map<string, AdminPrize>();
    store?.prizes.forEach((prize) => map.set(prize.id, prize));
    return map;
  }, [store?.prizes]);

  const prizeUsage = useMemo(() => {
    const usage = new Map<string, number>();
    detail?.assignments.forEach((assignment) => {
      const currentPrizeId = assignment.currentPrize?.id ?? assignment.prize?.id ?? null;
      if (!currentPrizeId) return;
      usage.set(currentPrizeId, (usage.get(currentPrizeId) ?? 0) + 1);
    });
    return usage;
  }, [detail?.assignments]);

  const hasPrizeCapacity = (prize: AdminPrize) => {
    if (prize.quantity === null || prize.quantity === undefined) return true;
    const used = prizeUsage.get(prize.id) ?? 0;
    return used < prize.quantity;
  };

  const activePoolPrizes = useMemo(() => {
    const pool = detail?.draw.pool;
    if (!pool) return [];
    return (store?.prizes ?? []).filter((prize) => prize.pool === pool && prize.isActive);
  }, [detail?.draw.pool, store?.prizes]);

  const resolvePrizeName = useCallback(
    (value: LocalizedText, id: string) => value[locale] || value.en || value.de || id,
    [locale],
  );

  const deliveryMethodLabel = useCallback(
    (method: DeliveryMethod) => {
      const labels: Record<DeliveryMethod, string> = {
        INGAME_MAIL: t("deliveryMethodIngameMail"),
        CROWN_STORE_GIFT: t("deliveryMethodCrownStoreGift"),
        PHYSICAL: t("deliveryMethodPhysical"),
        CODE: t("deliveryMethodCode"),
        OTHER: t("deliveryMethodOther"),
      };
      return labels[method];
    },
    [t],
  );

  const getOverrideOptions = (assignment: AdminDrawAssignment) => {
    if (!detail) return [];
    if (detail.draw.status === "DELIVERED") return [];
    if (detail.draw.status === "DRAFT") {
      return activePoolPrizes.filter(hasPrizeCapacity);
    }
    const basisPrizeId = assignment.currentPrize?.id ?? assignment.prizeId;
    if (!basisPrizeId) return [];
    const original = prizeMap.get(basisPrizeId);
    if (!original) return [];
    const backupIds = new Set(original.backupPrizes ?? []);
    return activePoolPrizes.filter((prize) => backupIds.has(prize.id) && hasPrizeCapacity(prize));
  };

  const handlePublish = async () => {
    if (!detail) return;
    setBusyId("publish");
    setError(null);
    try {
      await publishAdminDraw(detail.draw.id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
      setConfirmPublish(false);
    }
  };

  const handleOverride = async (assignmentId: string) => {
    if (!detail) return;
    const draft = overrideDrafts[assignmentId];
    if (!draft?.newPrizeId || !draft?.reason.trim()) {
      setError("Override requires a prize and reason.");
      return;
    }
    setBusyId(assignmentId);
    setError(null);
    try {
      await overrideAdminDraw(detail.draw.id, {
        assignmentId,
        newPrizeId: draft.newPrizeId,
        reason: draft.reason.trim(),
      });
      setOverrideDrafts((current) => ({ ...current, [assignmentId]: { newPrizeId: "", reason: "" } }));
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelivery = async (assignmentId: string, status: "pending" | "delivered") => {
    if (!detail) return;
    setBusyId(`${assignmentId}:${status}`);
    setError(null);
    try {
      const assignment = detail.assignments.find((entry) => entry.id === assignmentId);
      const method = deliveryMethods[assignmentId] ?? assignment?.deliveryMethod ?? "";
      const note = (deliveryNotes[assignmentId] ?? assignment?.deliveryMethodNote ?? "").trim();
      await updateAdminDrawDelivery(detail.draw.id, assignmentId, {
        status,
        method: status === "delivered" ? method : undefined,
        note: status === "delivered" ? note : undefined,
      });
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  if (!detail) {
    return (
      <div className="panel">
        <p className="muted">Loading draw…</p>
      </div>
    );
  }

  const draw = detail.draw;
  const statusTone = draw.status === "DRAFT" ? "muted" : "success";
  const seedDisplay = draw.seed ? `${draw.seed.slice(0, 8)}…${draw.seed.slice(-8)}` : "—";
  const copySeed = async () => {
    if (!draw.seed) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(draw.seed);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = draw.seed;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      window.dispatchEvent(
        new CustomEvent("app:toast", {
          detail: { type: "success", message: "Seed copied to clipboard.", durationMs: 2000 },
        }),
      );
    } catch {
      window.dispatchEvent(
        new CustomEvent("app:toast", {
          detail: { type: "error", message: "Failed to copy seed.", durationMs: 3000 },
        }),
      );
    }
  };

  return (
    <div className="panel stack">
      <header className="panel-header">
        <div>
          <div className="eyebrow">Admin</div>
          <h2>Draw {draw.pool}</h2>
          <div className="draw-header-meta">
            <span className={`pill ${statusTone}`}>{draw.status.toLowerCase()}</span>
            <span className="muted small">
              {draw.assignedCount}/{draw.eligibleCount} assigned
            </span>
            <button
              className="primary draw-publish"
              type="button"
              onClick={() => setConfirmPublish(true)}
              disabled={draw.status !== "DRAFT" || busyId === "publish"}
            >
              {busyId === "publish" ? "Publishing…" : "Publish draw"}
            </button>
          </div>
        </div>
        <Link className="ghost nav-link" to="/admin/draws">
          Back to draws
        </Link>
      </header>

      {error && <p className="error">{error}</p>}

      <div className="panel subpanel draw-meta">
        <div className="draw-meta-item">
          <span className="muted small">Created</span>
          <p>{new Date(draw.createdAt).toLocaleString()}</p>
        </div>
        <div className="draw-meta-item">
          <span className="muted small">Drafted</span>
          <p>{new Date(draw.updatedAt).toLocaleString()}</p>
        </div>
        <div className="draw-meta-item">
          <span className="muted small">Seed</span>
          <div className="seed-field">
            <code className="seed-value">{seedDisplay}</code>
            <button
              className="ghost seed-copy"
              type="button"
              onClick={copySeed}
              disabled={!draw.seed}
              aria-label="Copy seed"
              title={draw.seed ?? "No seed"}
            >
              ⧉
            </button>
          </div>
        </div>
        <div className="draw-meta-item">
          <span className="muted small">Published</span>
          <p>{draw.publishedAt ? new Date(draw.publishedAt).toLocaleString() : "—"}</p>
        </div>
        <div className="draw-meta-item">
          <span className="muted small">Published by</span>
          <p>{draw.publishedByUser?.globalName || draw.publishedByUser?.username || "—"}</p>
        </div>
      </div>

      <div className="panel subpanel draw-assignments">
        <header className="panel-header">
          <div>
            <div className="eyebrow">Assignments</div>
            <h3>Prize assignments</h3>
          </div>
        </header>
        {detail.assignments.map((assignment) => {
          const currentPrize = assignment.currentPrize ?? assignment.prize;
          const overrideDraft = overrideDrafts[assignment.id] ?? { newPrizeId: "", reason: "" };
          const overrideOptions = getOverrideOptions(assignment);
          const deliveryLabel = assignment.deliveryStatus === "DELIVERED" ? "Delivered" : "Pending";
          const selectedMethod = deliveryMethods[assignment.id] ?? assignment.deliveryMethod ?? "";
          const selectedNote = deliveryNotes[assignment.id] ?? assignment.deliveryMethodNote ?? "";
          const needsNote = selectedMethod === "OTHER";
          const deliveryReady = Boolean(selectedMethod) && (!needsNote || Boolean(selectedNote.trim()));
          return (
            <div key={assignment.id} className="panel subpanel draw-assignment-card">
              <div className="draw-assignment-header">
                <div className="field static-field">
                  <span className="muted small">User</span>
                  <p>{assignment.user.globalName || assignment.user.username}</p>
                  <span className="muted small">{assignment.userId}</span>
                </div>
                <div className={`pill ${assignment.deliveryStatus === "DELIVERED" ? "success" : "muted"}`}>
                  {deliveryLabel}
                </div>
              </div>
              <div className="draw-assignment-grid">
                <div className="field prize-field">
                  <span className="muted small">Original</span>
                  <div className="prize-inline">
                    {assignment.prize?.image ? (
                      <img src={assignment.prize.image} alt={assignment.prize.name} />
                    ) : (
                      <div className="prize-placeholder">—</div>
                    )}
                    <div>
                      <p className="prize-name">{assignment.prize ? assignment.prize.name : "No prize"}</p>
                      <span className="muted small">{assignment.prize?.id ?? "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="field prize-field">
                  <span className="muted small">Current</span>
                  <div className="prize-inline">
                    {currentPrize?.image ? (
                      <img src={currentPrize.image} alt={currentPrize.name} />
                    ) : (
                      <div className="prize-placeholder">—</div>
                    )}
                    <div>
                      <p className="prize-name">{currentPrize ? currentPrize.name : "No prize"}</p>
                      <span className="muted small">{currentPrize?.id ?? "—"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="field delivery-field">
                <span className="muted small">Delivery</span>
                <div className="delivery-controls">
                  <div className="delivery-stack">
                    <select
                      value={selectedMethod}
                      onChange={(event) =>
                        setDeliveryMethods((current) => ({
                          ...current,
                          [assignment.id]: event.target.value as DeliveryMethod | "",
                        }))
                      }
                      disabled={!assignment.prize || draw.status === "DRAFT"}
                    >
                      <option value="">Select delivery</option>
                      <option value="INGAME_MAIL">{deliveryMethodLabel("INGAME_MAIL")}</option>
                      <option value="CROWN_STORE_GIFT">{deliveryMethodLabel("CROWN_STORE_GIFT")}</option>
                      <option value="PHYSICAL">{deliveryMethodLabel("PHYSICAL")}</option>
                      <option value="CODE">{deliveryMethodLabel("CODE")}</option>
                      <option value="OTHER">{deliveryMethodLabel("OTHER")}</option>
                    </select>
                    {needsNote && (
                      <input
                        type="text"
                        placeholder={t("deliveryMethodOtherNote")}
                        value={selectedNote}
                        onChange={(event) =>
                          setDeliveryNotes((current) => ({
                            ...current,
                            [assignment.id]: event.target.value,
                          }))
                        }
                        disabled={!assignment.prize || draw.status === "DRAFT"}
                      />
                    )}
                  </div>
                  <div className="delivery-actions">
                    <button
                      className="ghost"
                      type="button"
                      disabled={!assignment.prize || draw.status === "DRAFT" || busyId === `${assignment.id}:pending`}
                      onClick={() => handleDelivery(assignment.id, "pending")}
                    >
                      Mark pending
                    </button>
                    <button
                      className="primary"
                      type="button"
                      disabled={
                        !assignment.prize ||
                        draw.status === "DRAFT" ||
                        busyId === `${assignment.id}:delivered` ||
                        !deliveryReady
                      }
                      onClick={() => handleDelivery(assignment.id, "delivered")}
                    >
                      Mark delivered
                    </button>
                  </div>
                </div>
              </div>
              <div className="draw-override">
                <div className="draw-override-title">
                  <span className="muted small">Override prize</span>
                  {draw.status !== "DRAFT" && <span className="muted small">Backup prizes only</span>}
                </div>
                {overrideOptions.length === 0 ? (
                  <p className="muted small">No override options available.</p>
                ) : (
                  <div className="draw-override-form">
                    <label className="field">
                      <span className="muted small">New prize</span>
                      <select
                        value={overrideDraft.newPrizeId}
                        onChange={(event) =>
                          setOverrideDrafts((current) => ({
                            ...current,
                            [assignment.id]: { ...overrideDraft, newPrizeId: event.target.value },
                          }))
                        }
                      >
                        <option value="">Select prize</option>
                        {overrideOptions.map((prize) => (
                          <option key={prize.id} value={prize.id}>
                            {resolvePrizeName(prize.name, prize.id)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span className="muted small">Reason</span>
                      <input
                        type="text"
                        value={overrideDraft.reason}
                        onChange={(event) =>
                          setOverrideDrafts((current) => ({
                            ...current,
                            [assignment.id]: { ...overrideDraft, reason: event.target.value },
                          }))
                        }
                        placeholder="Reason"
                      />
                    </label>
                    <div className="field">
                      <span className="muted small" aria-hidden="true">&nbsp;</span>
                      <button
                        className="primary"
                        type="button"
                        disabled={busyId === assignment.id}
                        onClick={() => handleOverride(assignment.id)}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {assignment.overrides.length > 0 && (
                <div className="draw-override-history">
                  <span className="muted small">Override history</span>
                  <ul>
                    {assignment.overrides.map((override) => (
                      <li key={override.id}>
                        <span className="muted">{new Date(override.createdAt).toLocaleString()}:</span>{" "}
                        {override.oldPrizeId ?? "none"} → {override.newPrizeId ?? "none"} ({override.reason})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {confirmPublish && (
        <ConfirmDialog
          message="Publishing makes the draw visible to users and prevents re-running it."
          confirmLabel="Publish"
          cancelLabel="Cancel"
          onConfirm={handlePublish}
          onCancel={() => setConfirmPublish(false)}
        />
      )}
    </div>
  );
}
