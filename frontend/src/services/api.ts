import type {
  AdminAsset,
  AdminPrize,
  AdminPrizeStore,
  AdminOverview,
  AdminVersionResponse,
  AdminContentDayDetail,
  AdminFeedbackSummary,
  AdminFeedbackSettings,
  AdminEligibilityConfig,
  AdminEligibilityResponse,
  AdminEligibilityRole,
  ContentDiagnostics,
  AdminUserSummary,
  DayDetail,
  DaysResponse,
  EligibilityStatus,
  IntroPayload,
  EpiloguePayload,
  InventoryResponse,
  Locale,
  Mode,
  PrizePoolMeta,
  PublicPrize,
  RiddleAnswerPayload,
  User,
} from "../types";

const BASE = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ?? "";

type ApiError = Error & { status?: number; payload?: unknown };

const isFormData = (body: unknown): body is FormData => typeof FormData !== "undefined" && body instanceof FormData;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    const headers = isFormData(options?.body)
      ? { ...(options?.headers ?? {}) }
      : {
          "Content-Type": "application/json",
          ...(options?.headers ?? {}),
        };
    res = await fetch(`${BASE}${path}`, {
      ...options,
      credentials: "include",
      headers,
    });
  } catch (err) {
    const error = new Error("Network request failed") as ApiError;
    error.cause = err;
    throw error;
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    let payload: unknown;
    try {
      const data = await res.json();
      if (typeof data?.error === "string") {
        message = data.error;
      }
      payload = data;
    } catch {
      // ignore parse errors
    }
    const error = new Error(message) as ApiError;
    error.status = res.status;
    error.payload = payload;
    throw error;
  }
  return res.json() as Promise<T>;
}

async function apiFetchRaw(path: string, options?: RequestInit): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options?.headers ?? {}),
      },
    });
  } catch (err) {
    const error = new Error("Network request failed") as ApiError;
    error.cause = err;
    throw error;
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = await res.json();
      if (typeof data?.error === "string") {
        message = data.error;
      }
    } catch {
      // ignore parse errors
    }
    const error = new Error(message) as ApiError;
    error.status = res.status;
    throw error;
  }
  return res.blob();
}

export const fetchMe = () => apiFetch<User>("/api/auth/me");

export const fetchDays = () => apiFetch<DaysResponse>("/api/days");

export const fetchDay = (
  day: number,
  opts?: { override?: boolean; locale?: "en" | "de"; mode?: "NORMAL" | "VETERAN"; resetPreview?: boolean },
) => {
  const params = new URLSearchParams();
  if (opts?.override) params.set("override", "1");
  if (opts?.locale) params.set("locale", opts.locale);
  if (opts?.mode) params.set("mode", opts.mode);
  if (opts?.resetPreview) params.set("resetPreview", "1");
  const suffix = params.toString();
  return apiFetch<DayDetail>(`/api/days/${day}${suffix ? `?${suffix}` : ""}`);
};

export const submitAnswer = (
  day: number,
  payload: RiddleAnswerPayload,
  opts?: { override?: boolean; locale?: "en" | "de"; mode?: "NORMAL" | "VETERAN" },
) => {
  const params = new URLSearchParams();
  if (opts?.override) params.set("override", "1");
  if (opts?.locale) params.set("locale", opts.locale);
  if (opts?.mode) params.set("mode", opts.mode);
  const suffix = params.toString();
  return apiFetch<{
    day: number;
    isSolved: boolean;
    correct: boolean;
    message: string;
    blocks: DayDetail["blocks"];
  }>(
    `/api/days/${day}/submit${suffix ? `?${suffix}` : ""}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
};

export const resetPuzzle = (
  day: number,
  puzzleId: string,
  opts?: { override?: boolean; locale?: "en" | "de"; mode?: "NORMAL" | "VETERAN" },
) => {
  const params = new URLSearchParams();
  if (opts?.override) params.set("override", "1");
  if (opts?.locale) params.set("locale", opts.locale);
  if (opts?.mode) params.set("mode", opts.mode);
  const suffix = params.toString();
  return apiFetch<{ day: number; isSolved?: boolean; blocks: DayDetail["blocks"] }>(
    `/api/days/${day}/puzzle/${puzzleId}/reset${suffix ? `?${suffix}` : ""}`,
    { method: "POST" },
  );
};

export const solvePuzzle = (
  day: number,
  puzzleId: string,
  opts?: { override?: boolean; locale?: "en" | "de"; mode?: "NORMAL" | "VETERAN" },
) => {
  const params = new URLSearchParams();
  if (opts?.override) params.set("override", "1");
  if (opts?.locale) params.set("locale", opts.locale);
  if (opts?.mode) params.set("mode", opts.mode);
  const suffix = params.toString();
  return apiFetch<{ day: number; isSolved?: boolean; blocks: DayDetail["blocks"] }>(
    `/api/days/${day}/puzzle/${puzzleId}/solve${suffix ? `?${suffix}` : ""}`,
    { method: "POST" },
  );
};

export const checkMemoryPair = (
  day: number,
  payload: { puzzleId: string; cards: [string, string] },
  opts?: { override?: boolean; locale?: "en" | "de"; mode?: "NORMAL" | "VETERAN" },
) => {
  const params = new URLSearchParams();
  if (opts?.override) params.set("override", "1");
  if (opts?.locale) params.set("locale", opts.locale);
  if (opts?.mode) params.set("mode", opts.mode);
  const suffix = params.toString();
  return apiFetch<{ match: boolean }>(`/api/days/${day}/memory/check${suffix ? `?${suffix}` : ""}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const checkPairItems = (
  day: number,
  payload: { puzzleId: string; left: string; right: string },
  opts?: { override?: boolean; locale?: "en" | "de"; mode?: "NORMAL" | "VETERAN" },
) => {
  const params = new URLSearchParams();
  if (opts?.override) params.set("override", "1");
  if (opts?.locale) params.set("locale", opts.locale);
  if (opts?.mode) params.set("mode", opts.mode);
  const suffix = params.toString();
  return apiFetch<{ match: boolean }>(`/api/days/${day}/pair-items/check${suffix ? `?${suffix}` : ""}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateLocale = (locale: Locale) =>
  apiFetch<{ id: string; locale: Locale }>("/api/user/locale", {
    method: "POST",
    body: JSON.stringify({ locale }),
  });

export const updateMode = (mode: Mode) =>
  apiFetch<{ id: string; mode: Mode }>("/api/user/mode", {
    method: "POST",
    body: JSON.stringify({ mode }),
  });

export const updateCreatureSwap = (creatureSwap: boolean) =>
  apiFetch<{ id: string; creatureSwap: boolean }>("/api/user/creature-swap", {
    method: "POST",
    body: JSON.stringify({ creatureSwap }),
  });

export const fetchAdminOverview = () => apiFetch<AdminOverview>("/api/admin/overview");
export const fetchAdminVersion = () => apiFetch<AdminVersionResponse>("/api/admin/version");
export const fetchAdminFeedback = () => apiFetch<AdminFeedbackSummary>("/api/admin/feedback");
export const fetchAdminFeedbackSettings = () => apiFetch<AdminFeedbackSettings>("/api/admin/feedback/settings");
export const updateAdminFeedbackSettings = (payload: {
  enabled?: boolean;
  endsAt?: string | null;
  freeTextEnabled?: boolean;
}) =>
  apiFetch<AdminFeedbackSettings>("/api/admin/feedback/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const fetchAdminEligibility = () =>
  apiFetch<AdminEligibilityResponse>("/api/admin/eligibility");

export const updateAdminEligibility = (payload: AdminEligibilityConfig) =>
  apiFetch<AdminEligibilityConfig>("/api/admin/eligibility", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const fetchAdminEligibilityRoles = () =>
  apiFetch<{ roles: AdminEligibilityRole[] }>("/api/admin/eligibility/roles");

export const refreshAdminEligibility = () =>
  apiFetch<{ ok: true }>("/api/admin/eligibility/refresh", { method: "POST" });

export const fetchEligibility = () => apiFetch<EligibilityStatus>("/api/eligibility");

export const fetchAdminUsers = () => apiFetch<AdminUserSummary[]>("/api/admin/users");

export const adminUpdateMode = (userId: string, mode: Mode) =>
  apiFetch<{ id: string; mode: Mode }>(`/api/admin/users/${userId}/mode`, {
    method: "POST",
    body: JSON.stringify({ mode }),
  });

export const adminUpdateProgress = (userId: string, lastSolvedDay: number) =>
  apiFetch<{ id: string; lastSolvedDay: number }>(`/api/admin/users/${userId}/progress`, {
    method: "POST",
    body: JSON.stringify({ lastSolvedDay }),
  });

export const adminRevokeSessions = (userId: string) =>
  apiFetch<{ id: string; sessionVersion: number }>(`/api/admin/users/${userId}/revoke-sessions`, { method: "POST" });

export const adminDeleteUser = (userId: string) =>
  apiFetch<{ success: boolean }>(`/api/admin/users/${userId}`, { method: "DELETE" });

export const adminSetAdmin = (userId: string, isAdmin: boolean) =>
  apiFetch<{ id: string; isAdmin: boolean }>(`/api/admin/users/${userId}/admin`, {
    method: "POST",
    body: JSON.stringify({ isAdmin }),
  });

export const adminUnlockNext = () => apiFetch<{ unlockedDay: number }>("/api/admin/unlock/increment", { method: "POST" });

export const adminUnlockSet = (unlockedDay: number) =>
  apiFetch<{ unlockedDay: number }>("/api/admin/unlock/set", {
    method: "POST",
    body: JSON.stringify({ unlockedDay }),
  });

export const adminTestUnlockNext = () =>
  apiFetch<{ unlockedDay: number }>("/api/admin/test/unlock/increment", { method: "POST" });

export const adminTestUnlockSet = (unlockedDay: number) =>
  apiFetch<{ unlockedDay: number }>("/api/admin/test/unlock/set", {
    method: "POST",
    body: JSON.stringify({ unlockedDay }),
  });

export const adminTestUnlockAll = () =>
  apiFetch<{ unlockedDay: number }>("/api/admin/test/unlock/all", { method: "POST" });

export const adminTestForceComplete = (userId: string, day: number) =>
  apiFetch<{ id: string; lastSolvedDay: number; lastSolvedAt: string | null }>(
    `/api/admin/test/users/${userId}/complete`,
    {
      method: "POST",
      body: JSON.stringify({ day }),
    },
  );

export const adminTestSetEligibility = (userId: string, eligible: boolean) =>
  apiFetch<{ id: string; introCompleted: boolean; lastSolvedDay: number; lastSolvedAt: string | null }>(
    `/api/admin/test/users/${userId}/eligibility`,
    {
      method: "POST",
      body: JSON.stringify({ eligible }),
    },
  );

export const adminTestResetFeedback = () => apiFetch<{ ok: true }>("/api/admin/test/feedback/reset", { method: "POST" });

export const fetchAdminContentDiagnostics = () => apiFetch<ContentDiagnostics>("/api/admin/content/diagnostics");

export const fetchAdminContentDay = (day: number, locale: Locale, mode: Mode) =>
  apiFetch<AdminContentDayDetail>(
    `/api/admin/content/day?day=${day}&locale=${locale}&mode=${mode}`,
  );

export const fetchAdminPrizes = () => apiFetch<AdminPrizeStore>("/api/admin/prizes");

export const createAdminPrize = (payload: AdminPrize) =>
  apiFetch<AdminPrize>("/api/admin/prizes", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateAdminPrize = (id: string, payload: Partial<AdminPrize>) =>
  apiFetch<AdminPrize>(`/api/admin/prizes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteAdminPrize = (id: string) =>
  apiFetch<{ ok: true }>(`/api/admin/prizes/${id}`, { method: "DELETE" });

export const updatePrizePools = (payload: Record<string, PrizePoolMeta>) =>
  apiFetch<Record<string, PrizePoolMeta>>("/api/admin/prizes/pools", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const importPrizesYaml = (file: File) => {
  const body = new FormData();
  body.append("file", file);
  return apiFetch<AdminPrizeStore>("/api/admin/prizes/import", {
    method: "POST",
    body,
  });
};

export const exportPrizesYaml = () => apiFetchRaw("/api/admin/prizes/export");

export const fetchAdminAssets = () => apiFetch<{ assets: AdminAsset[] }>("/api/admin/assets");

export const uploadAdminAsset = (
  file: File,
  fields?: { id?: string; name?: string; confirmDuplicate?: boolean },
) => {
  const body = new FormData();
  body.append("file", file);
  if (fields?.id) body.append("id", fields.id);
  if (fields?.name) body.append("name", fields.name);
  if (fields?.confirmDuplicate) body.append("confirmDuplicate", "true");
  return apiFetch<{ asset: AdminAsset; url: string }>("/api/admin/assets", {
    method: "POST",
    body,
  });
};

export const uploadAdminAssetsBulk = (files: File[], confirmDuplicate = false) => {
  const body = new FormData();
  files.forEach((file) => body.append("files", file));
  if (confirmDuplicate) body.append("confirmDuplicate", "true");
  return apiFetch<{ assets: AdminAsset[] }>("/api/admin/assets/bulk", {
    method: "POST",
    body,
  });
};

export const updateAdminAsset = (id: string, payload: { id?: string; name?: string }) =>
  apiFetch<{ asset: AdminAsset; updatedReferences?: string[] }>(`/api/admin/assets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteAdminAsset = (id: string) =>
  apiFetch<{ ok: true }>(`/api/admin/assets/${id}`, { method: "DELETE" });

export const fetchPublicPrizes = () =>
  apiFetch<{ pools: Record<string, PrizePoolMeta>; prizes: PublicPrize[] }>("/api/prizes");

export const fetchAudit = (limit?: number) =>
  apiFetch<AdminOverview["recentAudit"] extends Array<infer T> ? T[] : never>(
    `/api/admin/audit${limit ? `?limit=${limit}` : ""}`,
  );

export const deleteAuditEntry = (id: number) =>
  apiFetch<{ success: boolean }>(`/api/admin/audit/${id}`, { method: "DELETE" });

export const submitFeedback = (payload: { rating?: number; comment?: string; skipped?: boolean }) =>
  apiFetch<{ ok: true; skipped?: boolean }>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const fetchIntro = (locale?: "en" | "de") => {
  const params = new URLSearchParams();
  if (locale) params.set("locale", locale);
  const suffix = params.toString();
  return apiFetch<IntroPayload>(`/api/intro${suffix ? `?${suffix}` : ""}`);
};

export const completeIntro = () => apiFetch<{ introCompleted: boolean }>("/api/intro/complete", { method: "POST" });

export const fetchEpilogue = () => apiFetch<EpiloguePayload>("/api/epilogue");

export const fetchInventory = () => apiFetch<InventoryResponse>("/api/inventory");
