import fs from "fs/promises";
import path from "path";
import {
  loadDayContent,
  loadParsedFile,
  resolveDayPath,
  getDayIndexWarnings,
  type DayContent,
  type Locale,
  type Mode,
  CONTENT_ROOT,
  RiddleNotFoundError,
} from "./loader.js";
import { loadInventory } from "./inventory.js";

const ASSETS_ROOT = path.join(CONTENT_ROOT, "assets");
const SUPPORTED_LOCALES: Locale[] = ["en", "de"];
const MODES: Mode[] = ["NORMAL", "VETERAN"];

type VariantStatus = "ok" | "missing" | "warning" | "error";

export interface VariantDiagnostics {
  day: number;
  locale: Locale;
  mode: Mode;
  status: VariantStatus;
  issues: string[];
  filePath?: string;
  title?: string;
  contentId?: string;
}

export interface DayDiagnostics {
  day: number;
  status: "complete" | "partial" | "issue" | "empty";
  ok: number;
  missing: number;
  issues: number;
}

export interface InventoryLocaleDiagnostics {
  locale: Locale;
  hasFile: boolean;
  items: number;
  missingImages: string[];
  issues: string[];
  ids: string[];
}

export interface InventoryConsistencyDiagnostics {
  locale: Locale;
  missingIds: string[];
  extraIds: string[];
}

export interface ContentDiagnostics {
  variants: VariantDiagnostics[];
  days: DayDiagnostics[];
  stats: {
    totalDays: number;
    completeDays: number;
    partialDays: number;
    issueDays: number;
    emptyDays: number;
  };
  indexWarnings: string[];
  inventory: {
    locales: InventoryLocaleDiagnostics[];
    consistency: InventoryConsistencyDiagnostics[];
  };
}

const resolveAssetPath = (ref: string): string | null => {
  const normalized = ref.trim();
  if (!normalized || normalized.startsWith("http://") || normalized.startsWith("https://") || normalized.startsWith("data:")) {
    return null;
  }
  const cleaned = normalized.replace(/^\/?(content-assets|assets)\//i, "").replace(/^\/+/, "");
  return path.join(ASSETS_ROOT, cleaned);
};

const checkAsset = async (ref: string): Promise<string | null> => {
  const assetPath = resolveAssetPath(ref);
  if (!assetPath) return null;
  try {
    await fs.access(assetPath);
    return null;
  } catch {
    return `Missing asset: ${ref}`;
  }
};

const collectBlockAssetIssues = async (content: DayContent, issues: string[]) => {
  const tasks: Array<Promise<void>> = [];
  content.blocks.forEach((block) => {
    if (block.kind === "puzzle") {
      if (block.backgroundImage) {
        tasks.push(
          checkAsset(block.backgroundImage).then((res) => {
            if (res) issues.push(res);
          }),
        );
      }
      block.options?.forEach((opt) => {
        if (opt.image) {
          tasks.push(
            checkAsset(opt.image).then((res) => {
              if (res) issues.push(res);
            }),
          );
        }
      });
      block.items?.forEach((item) => {
        if (item.image) {
          tasks.push(
            checkAsset(item.image).then((res) => {
              if (res) issues.push(res);
            }),
          );
        }
      });
      block.sockets?.forEach((socket) => {
        if (socket.image) {
          tasks.push(
            checkAsset(socket.image).then((res) => {
              if (res) issues.push(res);
            }),
          );
        }
      });
    }
    if (block.kind === "reward" && block.item?.image) {
      tasks.push(
        checkAsset(block.item.image).then((res) => {
          if (res) issues.push(res);
        }),
      );
    }
  });
  await Promise.all(tasks);
};

const checkFilenameConsistency = (filePath: string, locale: Locale, mode: Mode): string | null => {
  const base = path.basename(filePath).toLowerCase();
  const expected = `${mode === "VETERAN" ? "veteran" : "normal"}.${locale}.md`;
  return base === expected ? null : `Filename mismatch: expected ${expected}, found ${base}`;
};

const diagnoseVariant = async (day: number, locale: Locale, mode: Mode): Promise<VariantDiagnostics> => {
  const issues: string[] = [];
  try {
    const filePath = await resolveDayPath(day, locale, mode);
    const parsed = await loadParsedFile(filePath);
    const contentLocale = String(parsed.parsed.data?.language ?? parsed.parsed.data?.locale ?? "").toLowerCase() === "de" ? "de" : "en";
    const contentMode =
      String(parsed.parsed.data?.mode ?? "").toLowerCase() === "veteran" || String(parsed.parsed.data?.mode ?? "").toLowerCase() === "vet"
        ? "VETERAN"
        : "NORMAL";
    const contentId = typeof parsed.parsed.data?.id === "string" ? parsed.parsed.data.id.trim() : undefined;
    if (contentLocale !== locale || contentMode !== mode) {
      issues.push(`Metadata mismatch: frontmatter mode=${contentMode}, locale=${contentLocale}`);
    }
    const mismatch = checkFilenameConsistency(filePath, locale, mode);
    if (mismatch) issues.push(mismatch);

    const inventory = await loadInventory(locale);
    const content = await loadDayContent(day, locale, mode, new Set(), true);

    await collectBlockAssetIssues(content, issues);

    // Validate rewards still resolve to inventory items
    content.blocks.forEach((block) => {
      if (block.kind === "reward" && block.item && !inventory.has(block.item.id)) {
        issues.push(`Reward references missing inventory id: ${block.item.id}`);
      }
    });

    return {
      day,
      locale,
      mode,
      status: issues.length ? "warning" : "ok",
      issues,
      filePath,
      title: content.title,
      ...(contentId ? { contentId } : {}),
    };
  } catch (err) {
    if (err instanceof RiddleNotFoundError) {
      return { day, locale, mode, status: "missing", issues: [] };
    }
    issues.push((err as Error).message);
    return {
      day,
      locale,
      mode,
      status: "error",
      issues,
    };
  }
};

const readInventoryDiagnostics = async (locale: Locale): Promise<InventoryLocaleDiagnostics & { idSet: Set<string> }> => {
  const filePath = path.join(CONTENT_ROOT, "inventory", `${locale}.yaml`);
  const issues: string[] = [];
  const missingImages: string[] = [];
  let hasFile = true;
  const ids = new Set<string>();
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = raw
      .split(/^-/gm)
      .map((entry) => entry.trim())
      .filter(Boolean);
    parsed.forEach((block) => {
      const idMatch = block.match(/id:\s*(.+)/);
      const imageMatch = block.match(/image:\s*(.+)/);
      const id = idMatch ? idMatch[1]?.trim().replace(/^['"]|['"]$/g, "") : "";
      if (id) ids.add(id);
      const image = imageMatch ? imageMatch[1]?.trim().replace(/^['"]|['"]$/g, "") : "";
      if (image) {
        missingImages.push(image);
      }
    });
  } catch (err) {
    hasFile = false;
    issues.push(`Failed to read inventory file: ${(err as Error).message}`);
  }

  // Deduplicate and test assets
  const seen = new Set<string>();
  const verifiedImages: string[] = [];
  await Promise.all(
    missingImages.map(async (img) => {
      if (seen.has(img)) return;
      seen.add(img);
      verifiedImages.push(img);
      const missing = await checkAsset(img);
      if (!missing) return;
      issues.push(missing);
    }),
  );

  return {
    locale,
    hasFile,
    items: ids.size,
    missingImages: verifiedImages,
    issues,
    ids: Array.from(ids),
    idSet: ids,
  };
};

const computeInventoryConsistency = (
  locales: Array<InventoryLocaleDiagnostics & { idSet: Set<string> }>,
): InventoryConsistencyDiagnostics[] => {
  if (locales.length === 0) return [];
  const base = locales[0];
  if (!base) return [];
  const baseIds = base.idSet;
  return locales.slice(1).map((loc) => {
    const missingIds = Array.from(baseIds).filter((id) => !loc.idSet.has(id));
    const extraIds = Array.from(loc.idSet).filter((id) => !baseIds.has(id));
    return { locale: loc.locale, missingIds, extraIds };
  });
};

const parseIndexWarningTargets = (warnings: string[]) => {
  const map = new Map<string, string[]>();
  const regex =
    /day\s+(\d+),\s+locale\s+(en|de),\s+mode\s+(normal|veteran|NORMAL|VETERAN).*?/i;
  warnings.forEach((w) => {
    const match = w.match(regex);
    if (match) {
      const day = Number(match[1]);
      const locale = (match[2]?.toLowerCase() as Locale) ?? "en";
      const mode = match[3]?.toUpperCase() === "VETERAN" ? "VETERAN" : "NORMAL";
      const key = `${day}-${locale}-${mode}`;
      const list = map.get(key) ?? [];
      list.push(w);
      map.set(key, list);
    }
  });
  return map;
};

export const getContentDiagnostics = async (maxDay: number): Promise<ContentDiagnostics> => {
  const variantDiagnostics: VariantDiagnostics[] = [];
  const tasks: Array<Promise<void>> = [];
  const indexWarnings = await getDayIndexWarnings();
  const indexWarningMap = parseIndexWarningTargets(indexWarnings);

  for (let day = 1; day <= maxDay; day++) {
    SUPPORTED_LOCALES.forEach((locale) => {
      MODES.forEach((mode) => {
        tasks.push(
          diagnoseVariant(day, locale, mode).then((diag) => {
            variantDiagnostics.push(diag);
          }),
        );
      });
    });
  }

  await Promise.all(tasks);

  // Attach index warnings to specific variants and upgrade status to warning
  variantDiagnostics.forEach((variant) => {
    const key = `${variant.day}-${variant.locale}-${variant.mode}`;
    const warnings = indexWarningMap.get(key);
    if (warnings?.length) {
      variant.issues.push(...warnings);
      if (variant.status === "ok") {
        variant.status = "warning";
      }
    }
  });

  // Detect duplicate content ids across variants
  const contentIdMap = new Map<string, VariantDiagnostics>();
  variantDiagnostics.forEach((variant) => {
    if (!variant.contentId) return;
    const existing = contentIdMap.get(variant.contentId);
    if (!existing) {
      contentIdMap.set(variant.contentId, variant);
      return;
    }
    const message = `Duplicate content id "${variant.contentId}" also used by day ${existing.day} ${existing.locale} ${existing.mode}`;
    [existing, variant].forEach((entry) => {
      entry.issues.push(message);
      if (entry.status === "ok") entry.status = "warning";
    });
  });

  const days: DayDiagnostics[] = [];
  let completeDays = 0;
  let partialDays = 0;
  let issueDays = 0;
  let emptyDays = 0;

  for (let day = 1; day <= maxDay; day++) {
    const variants = variantDiagnostics.filter((v) => v.day === day);
    const ok = variants.filter((v) => v.status === "ok").length;
    const warnings = variants.filter((v) => v.status === "warning" || v.status === "error").length;
    const missing = variants.filter((v) => v.status === "missing").length;

    let status: DayDiagnostics["status"] = "empty";
    if (warnings > 0) {
      status = "issue";
      issueDays += 1;
    } else if (ok === variants.length && variants.length > 0) {
      status = "complete";
      completeDays += 1;
    } else if (ok > 0 && missing > 0) {
      status = "partial";
      partialDays += 1;
    } else if (missing === variants.length) {
      status = "empty";
      emptyDays += 1;
    }

    days.push({ day, status, ok, missing, issues: warnings });
  }

  const inventoryLocales = await Promise.all(SUPPORTED_LOCALES.map((locale) => readInventoryDiagnostics(locale)));
  const consistency = computeInventoryConsistency(inventoryLocales);
  const inventoryResponse = inventoryLocales.map((entry) => ({
    locale: entry.locale,
    hasFile: entry.hasFile,
    items: entry.items,
    missingImages: entry.missingImages,
    issues: entry.issues,
    ids: Array.from(entry.ids),
  }));

  return {
    variants: variantDiagnostics,
    days,
    stats: {
      totalDays: maxDay,
      completeDays,
      partialDays,
      issueDays,
      emptyDays,
    },
    indexWarnings,
    inventory: {
      locales: inventoryResponse,
      consistency,
    },
  };
};
