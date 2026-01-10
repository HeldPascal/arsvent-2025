import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { loadPrizeStore, savePrizeStore } from "./store.js";
import { resolveDataRoot } from "./paths.js";

export type AssetVariant = {
  ext: string;
  mime: string;
  size: number;
};

export type AssetEntry = {
  id: string;
  name: string;
  originalName: string;
  checksum: string;
  token: string;
  createdAt: string;
  variants: AssetVariant[];
  baseVariantIndex: number;
};

export type AssetManifest = {
  assets: AssetEntry[];
};

const DATA_ROOT = resolveDataRoot();
const ASSETS_ROOT = path.join(DATA_ROOT, "assets");
const PUBLIC_ASSETS_ROOT = path.join(ASSETS_ROOT, "public");
const MANIFEST_PATH = path.join(ASSETS_ROOT, "manifest.json");

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

const warn = (...args: unknown[]) => console.warn("[assets]", ...args);

const normalizeName = (value: string) => path.basename(value).trim();

const createChecksum = (buffer: Buffer) => crypto.createHash("sha256").update(buffer).digest("hex");

const createToken = (input: string) => crypto.createHash("sha256").update(input).digest("hex").slice(0, 32);

const ensureAssetsDir = async () => {
  await fs.mkdir(PUBLIC_ASSETS_ROOT, { recursive: true });
};

export const getAssetsRoot = () => PUBLIC_ASSETS_ROOT;

export const loadAssetManifest = async (): Promise<AssetManifest> => {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, "utf8");
    const parsed = JSON.parse(raw) as AssetManifest;
    if (!parsed.assets) return { assets: [] };
    return parsed;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      warn("Failed to read asset manifest:", err);
    }
    return { assets: [] };
  }
};

const saveAssetManifest = async (manifest: AssetManifest) => {
  await ensureAssetsDir();
  const payload = JSON.stringify(manifest, null, 2);
  await fs.writeFile(MANIFEST_PATH, payload, "utf8");
};

export const ensureAssetManifest = async () => {
  await ensureAssetsDir();
  try {
    await fs.readFile(MANIFEST_PATH, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      throw err;
    }
    await fs.writeFile(MANIFEST_PATH, JSON.stringify({ assets: [] }, null, 2), "utf8");
  }
};

const generateAssetId = (originalName: string, token: string, existing: Set<string>) => {
  const base = normalizeName(originalName).replace(/\.[^.]+$/, "");
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const candidate = slug || `asset-${token.slice(0, 6)}`;
  if (!existing.has(candidate)) return candidate;
  let i = 2;
  let next = `${candidate}-${i}`;
  while (existing.has(next)) {
    i += 1;
    next = `${candidate}-${i}`;
  }
  return next;
};

const resolveExtension = (mime: string) => ACCEPTED_MIME[mime] ?? null;

export type AssetUploadWarning = {
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
    existing: Array<
      Pick<AssetEntry, "id" | "name" | "originalName" | "checksum" | "token" | "createdAt"> & {
        mime: string;
        size: number;
      }
    >;
  }>;
};

const buildVariantPath = (token: string, variant: AssetVariant) => `${token}.${variant.ext}`;

const getPrimaryVariant = (asset: AssetEntry) => {
  const index = Number.isInteger(asset.baseVariantIndex) ? asset.baseVariantIndex : 0;
  return asset.variants[index] ?? asset.variants[0];
};

export const buildAssetUrl = (asset: AssetEntry) => {
  const primary = getPrimaryVariant(asset);
  return primary ? `/asset/${buildVariantPath(asset.token, primary)}` : "";
};

export const listAssetsWithReferences = async () => {
  const manifest = await loadAssetManifest();
  const prizeStore = await loadPrizeStore();
  const references = new Map<string, string[]>();
  prizeStore.prizes.forEach((prize) => {
    if (!prize.image) return;
    const list = references.get(prize.image) ?? [];
    list.push(prize.id);
    references.set(prize.image, list);
  });
  return manifest.assets.map((asset) => ({
    ...asset,
    references: references.get(asset.id) ?? [],
    url: buildAssetUrl(asset),
    variantUrls: asset.variants.map((variant) => `/asset/${buildVariantPath(asset.token, variant)}`),
  }));
};

export const resolveAssetById = async (assetId: string): Promise<AssetEntry | null> => {
  const manifest = await loadAssetManifest();
  return manifest.assets.find((asset) => asset.id === assetId) ?? null;
};

export const resolveAssetUrlById = async (assetId: string): Promise<string | null> => {
  const asset = await resolveAssetById(assetId);
  return asset ? buildAssetUrl(asset) : null;
};

const writeVariant = async (token: string, ext: string, buffer: Buffer) => {
  const filePath = path.join(PUBLIC_ASSETS_ROOT, `${token}.${ext}`);
  await fs.writeFile(filePath, buffer);
  const stat = await fs.stat(filePath);
  return { ext, size: stat.size };
};

export const uploadAsset = async (input: {
  buffer: Buffer;
  originalName: string;
  mime: string;
  name?: string;
  id?: string;
  confirmDuplicate?: boolean;
}): Promise<{ asset: AssetEntry; warning?: AssetUploadWarning }> => {
  if (!input.buffer || input.buffer.length === 0) {
    throw new Error("empty_upload");
  }
  if (input.buffer.length > MAX_FILE_SIZE) {
    throw new Error("file_too_large");
  }

  const ext = resolveExtension(input.mime);
  if (!ext) {
    throw new Error("unsupported_type");
  }

  const originalName = normalizeName(input.originalName);
  const checksum = createChecksum(input.buffer);
  const token = createToken(`${originalName}:${checksum}`);

  const manifest = await loadAssetManifest();
  const existingSame = manifest.assets.find(
    (asset) => asset.originalName === originalName && asset.checksum === checksum,
  );
  if (existingSame) {
    throw new Error("asset_exists");
  }

  const checksumMatches = manifest.assets.filter((asset) => asset.checksum === checksum);
  if (checksumMatches.length > 0 && !input.confirmDuplicate) {
    const firstMatch = checksumMatches[0];
    if (!firstMatch) {
      throw new Error("asset_exists");
    }
    return {
      asset: firstMatch,
      warning: {
        type: "checksum_match",
        entries: [
          {
            incoming: {
              originalName,
              mime: input.mime,
              size: input.buffer.length,
              token,
              checksum,
              index: 0,
            },
            existing: checksumMatches.map((asset) => ({
              id: asset.id,
              name: asset.name,
              originalName: asset.originalName,
              checksum: asset.checksum,
              token: asset.token,
              createdAt: asset.createdAt,
              mime: getPrimaryVariant(asset)?.mime ?? "application/octet-stream",
              size: getPrimaryVariant(asset)?.size ?? 0,
            })),
          },
        ],
      },
    };
  }

  await ensureAssetsDir();

  const filePath = path.join(PUBLIC_ASSETS_ROOT, `${token}.${ext}`);
  await fs.writeFile(filePath, input.buffer);
  const stat = await fs.stat(filePath);

  const variants: AssetVariant[] = [
    {
      ext,
      mime: input.mime,
      size: stat.size,
    },
  ];
  if (ext !== "webp") {
    const webpBuffer = await sharp(input.buffer).webp({ quality: 82 }).toBuffer();
    const { size } = await writeVariant(token, "webp", webpBuffer);
    variants.push({
      ext: "webp",
      mime: "image/webp",
      size,
    });
  }

  const existingIds = new Set(manifest.assets.map((asset) => asset.id));
  const id = input.id ? normalizeName(input.id) : generateAssetId(originalName, token, existingIds);
  if (existingIds.has(id)) {
    throw new Error("asset_id_exists");
  }

  const entry: AssetEntry = {
    id,
    name: input.name ? String(input.name).trim() : originalName,
    originalName,
    checksum,
    token,
    createdAt: new Date().toISOString(),
    variants,
    baseVariantIndex: 0,
  };

  manifest.assets.push(entry);
  await saveAssetManifest(manifest);
  return { asset: entry };
};

export const uploadAssetsBulk = async (
  inputs: Array<Omit<Parameters<typeof uploadAsset>[0], "confirmDuplicate">>,
  confirmDuplicate = false,
) => {
  const manifest = await loadAssetManifest();
  const warningEntries: AssetUploadWarning["entries"] = [];

  for (const [index, input] of inputs.entries()) {
    const ext = resolveExtension(input.mime);
    if (!ext) throw new Error("unsupported_type");
    const originalName = normalizeName(input.originalName);
    const checksum = createChecksum(input.buffer);
    const token = createToken(`${originalName}:${checksum}`);
    const existingSame = manifest.assets.find(
      (asset) => asset.originalName === originalName && asset.checksum === checksum,
    );
    if (existingSame) {
      throw new Error("asset_exists");
    }
    const matches = manifest.assets.filter((asset) => asset.checksum === checksum);
    if (matches.length > 0) {
      warningEntries.push({
        incoming: {
          originalName,
          mime: input.mime,
          size: input.buffer.length,
          token,
          checksum,
          index,
        },
        existing: matches.map((asset) => ({
          id: asset.id,
          name: asset.name,
          originalName: asset.originalName,
          checksum: asset.checksum,
          token: asset.token,
          createdAt: asset.createdAt,
          mime: getPrimaryVariant(asset)?.mime ?? "application/octet-stream",
          size: getPrimaryVariant(asset)?.size ?? 0,
        })),
      });
    }
  }

  if (warningEntries.length && !confirmDuplicate) {
    return {
      assets: [],
      warning: {
        type: "checksum_match",
        entries: warningEntries,
      },
    };
  }

  const results: AssetEntry[] = [];
  for (const input of inputs) {
    const { asset } = await uploadAsset({ ...input, confirmDuplicate: true });
    results.push(asset);
  }
  return { assets: results };
};

export const updateAsset = async (assetId: string, payload: { id?: string; name?: string }) => {
  const manifest = await loadAssetManifest();
  const asset = manifest.assets.find((entry) => entry.id === assetId);
  if (!asset) return null;

  const updatedReferences: string[] = [];
  if (payload.id && payload.id !== asset.id) {
    const nextId = normalizeName(payload.id);
    if (!nextId) throw new Error("invalid_asset_id");
    if (manifest.assets.some((entry) => entry.id === nextId)) {
      throw new Error("asset_id_exists");
    }
    const prizeStore = await loadPrizeStore();
    const prizes = prizeStore.prizes.map((prize) => {
      if (prize.image === asset.id) {
        updatedReferences.push(prize.id);
        return { ...prize, image: nextId };
      }
      return prize;
    });
    prizeStore.prizes = prizes;
    await savePrizeStore(prizeStore);
    asset.id = nextId;
  }

  if (payload.name !== undefined) {
    asset.name = String(payload.name).trim();
  }

  await saveAssetManifest(manifest);
  return { asset, updatedReferences };
};

export const deleteAsset = async (assetId: string) => {
  const manifest = await loadAssetManifest();
  const index = manifest.assets.findIndex((entry) => entry.id === assetId);
  if (index === -1) return null;
  const asset = manifest.assets[index];
  if (!asset) return null;

  const prizeStore = await loadPrizeStore();
  const references = prizeStore.prizes.filter((prize) => prize.image === asset.id).map((prize) => prize.id);
  if (references.length) {
    const err = new Error("asset_in_use");
    (err as Error & { references?: string[] }).references = references;
    throw err;
  }

  const files = new Set(asset.variants.map((variant) => buildVariantPath(asset.token, variant)));
  await Promise.all(
    Array.from(files).map(async (filename) => {
      try {
        await fs.unlink(path.join(PUBLIC_ASSETS_ROOT, filename));
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
          warn("Failed to delete asset file", filename, err);
        }
      }
    }),
  );

  manifest.assets.splice(index, 1);
  await saveAssetManifest(manifest);
  return asset;
};
