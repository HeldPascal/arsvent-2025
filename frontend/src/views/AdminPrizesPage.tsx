import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminAsset, AdminPrize, AdminPrizeStore, PrizePool } from "../types";
import {
  createAdminPrize,
  deleteAdminPrize,
  exportPrizesYaml,
  fetchAdminAssets,
  fetchAdminPrizes,
  importPrizesYaml,
  updateAdminPrize,
  updatePrizePools,
} from "../services/api";
import ConfirmDialog from "./components/ConfirmDialog";
import PrizeForm from "./components/PrizeForm";

type PrizeDraft = AdminPrize;
const poolOrder: PrizePool[] = ["MAIN", "VETERAN"];

const emptyPrize = (): PrizeDraft => ({
  id: "",
  name: { en: "", de: "" },
  description: { en: "", de: "" },
  image: null,
  pool: "MAIN",
  quantity: null,
  priority: 0,
  isFiller: false,
  isActive: true,
  backupPrizes: [],
  adminNotes: "",
});

export default function AdminPrizesPage() {
  const [store, setStore] = useState<AdminPrizeStore | null>(null);
  const [assets, setAssets] = useState<AdminAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftNew, setDraftNew] = useState<PrizeDraft>(emptyPrize());
  const [importing, setImporting] = useState(false);
  const [cutoffDrafts, setCutoffDrafts] = useState<Record<PrizePool, string>>({
    MAIN: "",
    VETERAN: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<AdminPrize | null>(null);

  const resolvePrizeLabel = useCallback(
    (prize: AdminPrize) => prize.name.en || prize.name.de || prize.id,
    [],
  );

  const toLocalInputValue = (value: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    const local = new Date(date.getTime() - offsetMs);
    return local.toISOString().slice(0, 16);
  };

  const toIsoValue = (value: string) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [storeData, assetData] = await Promise.all([fetchAdminPrizes(), fetchAdminAssets()]);
      setStore(storeData);
      setAssets(assetData.assets);
      setCutoffDrafts({
        MAIN: toLocalInputValue(storeData.pools.MAIN.cutoffAt),
        VETERAN: toLocalInputValue(storeData.pools.VETERAN.cutoffAt),
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const poolCutoffs = useMemo(() => store?.pools ?? null, [store]);
  const validationErrors = useMemo(() => store?.validationErrors ?? [], [store?.validationErrors]);
  const validationByPrize = useMemo(() => {
    const global: string[] = [];
    const byPrize = new Map<string, string[]>();
    for (const entry of validationErrors) {
      if (!entry.prizeId) {
        global.push(entry.message);
        continue;
      }
      const list = byPrize.get(entry.prizeId) ?? [];
      list.push(entry.message);
      byPrize.set(entry.prizeId, list);
    }
    return { global, byPrize };
  }, [validationErrors]);

  const prizesByPool = useMemo(() => {
    const grouped = new Map<PrizePool, PrizeDraft[]>();
    poolOrder.forEach((pool) => grouped.set(pool, []));
    (store?.prizes ?? [])
      .slice()
      .sort((a, b) => a.priority - b.priority)
      .forEach((prize) => {
        grouped.get(prize.pool)?.push(prize);
      });
    return grouped;
  }, [store?.prizes]);

  const assetOptions = useMemo(
    () =>
      assets.map((asset) => ({
        id: asset.id,
        label: `${asset.name} (${asset.id})`,
        name: asset.name,
        variants: asset.variants,
        variantUrls: asset.variantUrls,
        baseVariantIndex: asset.baseVariantIndex,
      })),
    [assets],
  );

  const backupOptions = useCallback(
    (pool: PrizePool, excludeId?: string) =>
      (store?.prizes ?? []).filter(
        (prize) => prize.pool === pool && prize.isActive && prize.id !== excludeId,
      ),
    [store?.prizes],
  );

  const handlePrizeField = (id: string, field: keyof AdminPrize, value: unknown) => {
    if (!store) return;
    const updates =
      field === "pool"
        ? {
            pool: value as PrizePool,
            backupPrizes: [],
          }
        : { [field]: value } as Partial<AdminPrize>;
    setStore({
      ...store,
      prizes: store.prizes.map((prize) =>
        prize.id === id ? { ...prize, ...updates } : prize,
      ),
    });
  };

  const handleSavePrize = async (prize: AdminPrize) => {
    setSavingId(prize.id);
    setError(null);
    try {
      const payload = {
        ...prize,
        quantity: prize.quantity === null ? null : Number(prize.quantity),
        priority: Number(prize.priority),
      };
      const updated = await updateAdminPrize(prize.id, payload);
      setStore((current) =>
        current
          ? {
              ...current,
              prizes: current.prizes.map((entry) => (entry.id === prize.id ? updated : entry)),
            }
          : current,
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const handleCreatePrize = async () => {
    if (!store) return;
    setSavingId("new");
    setError(null);
    try {
      const payload = {
        ...draftNew,
        quantity: draftNew.quantity === null ? null : Number(draftNew.quantity),
        priority: Number(draftNew.priority),
      };
      const created = await createAdminPrize(payload);
      setStore({ ...store, prizes: [...store.prizes, created] });
      setDraftNew(emptyPrize());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const handleDeletePrize = async (prizeId: string) => {
    if (!store) return;
    setSavingId(prizeId);
    setError(null);
    try {
      await deleteAdminPrize(prizeId);
      setStore({ ...store, prizes: store.prizes.filter((prize) => prize.id !== prizeId) });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteTarget(null);
    await handleDeletePrize(targetId);
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setError(null);
    try {
      const data = await importPrizesYaml(file);
      setStore(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportPrizesYaml();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "prizes.yaml";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleCutoffSave = async (pool: PrizePool, value: string) => {
    if (!store) return;
    setSavingId(`pool-${pool}`);
    setError(null);
    try {
      const payload = { [pool]: { cutoffAt: toIsoValue(value) } } as Record<string, { cutoffAt: string | null }>;
      const pools = await updatePrizePools(payload);
      setStore({ ...store, pools: pools as AdminPrizeStore["pools"] });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="panel">Loading prize pools…</div>;
  }

  return (
    <div className="stack">
      <div className="panel">
        <header className="panel-header">
          <div>
            <div className="eyebrow">Admin</div>
            <h2>Prize pools</h2>
            <p className="muted">Manage prize pools, priorities, and backup prizes.</p>
          </div>
          <div className="panel-actions">
            <button className="ghost" type="button" onClick={handleExport}>
              Export YAML
            </button>
            <label className="ghost" style={{ cursor: "pointer" }}>
              Import YAML
              <input
                type="file"
                accept=".yaml,.yml"
                style={{ display: "none" }}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleImport(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </div>
        </header>

        {error && <p className="error">{error}</p>}
        {validationByPrize.global.length > 0 && (
          <div className="panel warning-panel">
            <div className="warning-title">Prize configuration issues</div>
            <div className="muted small">
              Fix these before running prize draws.
            </div>
            <div className="warning-stack">
              {validationByPrize.global.map((message) => (
                <div key={message} className="warning-card">
                  {message}
                </div>
              ))}
            </div>
          </div>
        )}
        {importing && <p className="muted">Importing…</p>}

        {poolCutoffs && (
          <div className="prize-pool-meta">
            {poolOrder.map((pool) => (
              <label key={pool} className="field">
                <span className="muted small">{pool} cutoff</span>
                <div className="pool-row">
                  <input
                    type="datetime-local"
                    className="date-input"
                    value={cutoffDrafts[pool]}
                    onChange={(event) => {
                      const next = event.target.value;
                      setCutoffDrafts((current) => ({ ...current, [pool]: next }));
                    }}
                  />
                  <button
                    className="ghost"
                    type="button"
                    disabled={savingId === `pool-${pool}`}
                    onClick={() => handleCutoffSave(pool, cutoffDrafts[pool])}
                  >
                    {savingId === `pool-${pool}` ? "Saving…" : "Save"}
                  </button>
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="prize-grid">
          {poolOrder.map((pool) => (
            <div key={pool} className="panel subpanel prize-pool-panel">
              <header className="panel-header">
                <div>
                  <div className="eyebrow">{pool}</div>
                  <h3>{pool} pool</h3>
                </div>
              </header>
              <div className="prize-list">
                {(prizesByPool.get(pool) ?? []).map((prize) => (
                  <PrizeForm
                    key={prize.id}
                    mode="edit"
                    prize={prize}
                    assetOptions={assetOptions}
                    backupOptions={backupOptions(prize.pool, prize.id)}
                    saving={savingId === prize.id}
                    validationMessages={validationByPrize.byPrize.get(prize.id) ?? []}
                    onFieldChange={(field, value) => handlePrizeField(prize.id, field, value)}
                    onSave={() => handleSavePrize(prize)}
                    onDelete={() => setDeleteTarget(prize)}
                  />
                ))}
                {prizesByPool.get(pool)?.length === 0 && (
                  <div className="muted">No prizes yet.</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="panel subpanel prize-new">
          <header className="panel-header">
            <div>
              <div className="eyebrow">New prize</div>
              <h3>Create prize</h3>
            </div>
          </header>
          <PrizeForm
            mode="create"
            prize={draftNew}
            assetOptions={assetOptions}
            backupOptions={backupOptions(draftNew.pool)}
            saving={savingId === "new"}
            validationMessages={[]}
            onFieldChange={(field, value) => {
              if (field === "pool") {
                setDraftNew({ ...draftNew, pool: value as PrizePool, backupPrizes: [] });
                return;
              }
              setDraftNew({ ...draftNew, [field]: value });
            }}
            onSave={handleCreatePrize}
            submitLabel="Create prize"
          />
        </div>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete ${resolvePrizeLabel(deleteTarget)}? This cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
