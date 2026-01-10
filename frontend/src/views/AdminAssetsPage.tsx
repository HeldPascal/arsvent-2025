import { useCallback, useEffect, useState } from "react";
import type { AdminAsset } from "../types";
import {
  deleteAdminAsset,
  fetchAdminAssets,
  updateAdminAsset,
  uploadAdminAsset,
  uploadAdminAssetsBulk,
} from "../services/api";
import AssetPicture from "./components/AssetPicture";
import ConfirmDialog from "./components/ConfirmDialog";

type AssetWarning = {
  type: "checksum_match";
  entries: Array<{
    incoming: {
      originalName: string;
      mime: string;
      size: number;
      token: string;
      checksum: string;
      index: number;
    };
    existing: Array<{
      id: string;
      name: string;
      originalName: string;
      checksum: string;
      mime: string;
      size: number;
      token: string;
      createdAt: string;
    }>;
  }>;
};

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<AdminAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<AssetWarning | null>(null);
  const [pendingUpload, setPendingUpload] = useState<{
    files: File[];
    bulk: boolean;
    warningFiles?: File[];
    remainingFiles?: File[];
  } | null>(null);
  const [warningIndex, setWarningIndex] = useState(0);
  const [assetMessage, setAssetMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminAsset | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const assetData = await fetchAdminAssets();
      setAssets(assetData.assets);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssetUpload = async (file: File, confirmDuplicate = false) => {
    setAssetMessage(null);
    try {
      await uploadAdminAsset(file, { confirmDuplicate });
      await loadData();
      setUploadWarning(null);
      setPendingUpload(null);
      setWarningIndex(0);
    } catch (err) {
      const apiErr = err as Error & { payload?: { warning?: unknown } };
      if (apiErr.message === "asset_checksum_match" && apiErr.payload?.warning) {
        setUploadWarning(apiErr.payload.warning as AssetWarning);
        setPendingUpload({ files: [file], bulk: false, warningFiles: [file], remainingFiles: [] });
        setWarningIndex(0);
        return;
      }
      setAssetMessage(apiErr.message);
    }
  };

  const handleAssetBulkUpload = async (files: File[], confirmDuplicate = false) => {
    setAssetMessage(null);
    try {
      await uploadAdminAssetsBulk(files, confirmDuplicate);
      await loadData();
      setUploadWarning(null);
      setPendingUpload(null);
      setWarningIndex(0);
    } catch (err) {
      const apiErr = err as Error & { payload?: { warning?: unknown } };
      if (apiErr.message === "asset_checksum_match" && apiErr.payload?.warning) {
        const warning = apiErr.payload.warning as AssetWarning;
        const warningIndexes = new Set(warning.entries.map((entry) => entry.incoming.index));
        const warningFiles = warning.entries
          .map((entry) => files[entry.incoming.index])
          .filter((file): file is File => Boolean(file));
        const remainingFiles = files.filter((_, index) => !warningIndexes.has(index));
        setUploadWarning(warning);
        setPendingUpload({ files, bulk: true, warningFiles, remainingFiles });
        setWarningIndex(0);
        return;
      }
      setAssetMessage(apiErr.message);
    }
  };

  const handleAssetUpdate = async (assetId: string, fields: { id?: string; name?: string }) => {
    setAssetMessage(null);
    try {
      const result = await updateAdminAsset(assetId, fields);
      if (result.updatedReferences && result.updatedReferences.length) {
        setAssetMessage(`Updated references: ${result.updatedReferences.join(", ")}`);
      }
      await loadData();
    } catch (err) {
      setAssetMessage((err as Error).message);
    }
  };

  const handleAssetDelete = async (assetId: string) => {
    setAssetMessage(null);
    try {
      await deleteAdminAsset(assetId);
      await loadData();
    } catch (err) {
      setAssetMessage((err as Error).message);
    }
  };

  const confirmDuplicateUpload = async () => {
    if (!pendingUpload) return;
    const warningFiles = pendingUpload.warningFiles ?? pendingUpload.files;
    const remainingFiles = pendingUpload.remainingFiles ?? [];
    const currentFile = warningFiles[warningIndex];
    if (!currentFile) return;
    const currentEntry = uploadWarning?.entries[warningIndex];
    if (!currentEntry) return;
    try {
      await uploadAdminAsset(currentFile, { confirmDuplicate: true });
    } catch (err) {
      setAssetMessage((err as Error).message);
      return;
    }
    const nextIndex = warningIndex + 1;
    if (nextIndex < warningFiles.length) {
      setWarningIndex(nextIndex);
      return;
    }
    setUploadWarning(null);
    setPendingUpload(null);
    setWarningIndex(0);
    if (remainingFiles.length) {
      await handleAssetBulkUpload(remainingFiles);
      return;
    }
    await loadData();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteTarget(null);
    await handleAssetDelete(targetId);
  };

  if (loading) {
    return <div className="panel">Loading assets…</div>;
  }

  return (
    <div className="stack">
      <div className="panel">
        <header className="panel-header">
          <div>
            <div className="eyebrow">Assets</div>
            <h2>Asset library</h2>
            <p className="muted">Upload images and keep track of where they are used.</p>
          </div>
        </header>

        {error && <p className="error">{error}</p>}
        {assetMessage && <p className="error">{assetMessage}</p>}

        <div className="asset-actions">
          <label className="ghost" style={{ cursor: "pointer" }}>
            Upload asset
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: "none" }}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleAssetUpload(file);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <label className="ghost" style={{ cursor: "pointer" }}>
            Bulk upload
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              style={{ display: "none" }}
              onChange={(event) => {
                const files = event.target.files ? Array.from(event.target.files) : [];
                if (files.length) handleAssetBulkUpload(files);
                event.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        {uploadWarning && (
          <div className="panel warning-panel">
            <div className="muted small">
              A matching checksum already exists. Review the comparison and confirm to proceed.
            </div>
            <div className="warning-grid">
              <div>
                <div className="muted small">Incoming</div>
                <div className="warning-card">
                  <div className="muted small">
                    {warningIndex + 1} of {uploadWarning.entries.length}
                  </div>
                  <div className="warning-title">
                    {uploadWarning.entries[warningIndex]?.incoming.originalName ?? "Unknown file"}
                  </div>
                  <div className="muted small">
                    Size: {uploadWarning.entries[warningIndex]?.incoming.size ?? 0} bytes
                  </div>
                  <div className="muted small">
                    Type: {uploadWarning.entries[warningIndex]?.incoming.mime ?? "unknown"}
                  </div>
                  <div className="muted small">
                    Token: {uploadWarning.entries[warningIndex]?.incoming.token ?? "unknown"}
                  </div>
                </div>
              </div>
              <div>
                <div className="muted small">Existing</div>
                <div className="warning-stack">
                  {(uploadWarning.entries[warningIndex]?.existing ?? []).map((asset) => (
                    <div key={asset.id} className="warning-card">
                      <div className="warning-title">{asset.name}</div>
                      <div className="muted small">ID: {asset.id}</div>
                      <div className="muted small">Original: {asset.originalName}</div>
                      <div className="muted small">Size: {asset.size} bytes</div>
                      <div className="muted small">Type: {asset.mime}</div>
                      <div className="muted small">Token: {asset.token}</div>
                      <div className="muted small">
                        Uploaded: {new Date(asset.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button className="primary" type="button" onClick={confirmDuplicateUpload}>
              Proceed anyway
            </button>
          </div>
        )}

        <div className="asset-grid">
          {assets.map((asset) => (
            <div key={asset.id} className="asset-card">
              <div className="asset-preview">
                <AssetPicture
                  variants={asset.variants}
                  variantUrls={asset.variantUrls}
                  baseVariantIndex={asset.baseVariantIndex}
                  alt={asset.name}
                />
              </div>
              <div className="asset-details">
                <label className="field">
                  <span className="muted small">ID</span>
                  <input
                    type="text"
                    defaultValue={asset.id}
                    onBlur={(event) =>
                      event.target.value !== asset.id &&
                      handleAssetUpdate(asset.id, { id: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span className="muted small">Name (image alt text)</span>
                  <input
                    type="text"
                    defaultValue={asset.name}
                    onBlur={(event) =>
                      event.target.value !== asset.name &&
                      handleAssetUpdate(asset.id, { name: event.target.value })
                    }
                  />
                </label>
                <div className="muted small">Original: {asset.originalName}</div>
                <div className="muted small">
                  Used by: {asset.references.length ? asset.references.join(", ") : "—"}
                </div>
              </div>
              <button
                className="ghost danger"
                type="button"
                disabled={asset.references.length > 0}
                onClick={() => setDeleteTarget(asset)}
              >
                Delete
              </button>
            </div>
          ))}
          {assets.length === 0 && <div className="muted">No assets uploaded yet.</div>}
        </div>
      </div>
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete ${deleteTarget.name}? This cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
