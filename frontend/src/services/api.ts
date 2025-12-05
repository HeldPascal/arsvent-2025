import type {
  AdminOverview,
  AdminUserSummary,
  DayDetail,
  DaysResponse,
  IntroPayload,
  Locale,
  Mode,
  RiddleAnswerPayload,
  User,
} from "../types";

const BASE = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ?? "";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
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
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const fetchMe = () => apiFetch<User>("/api/auth/me");

export const fetchDays = () => apiFetch<DaysResponse>("/api/days");

export const fetchDay = (
  day: number,
  opts?: { override?: boolean; locale?: "en" | "de"; mode?: "NORMAL" | "VET" },
) => {
  const params = new URLSearchParams();
  if (opts?.override) params.set("override", "1");
  if (opts?.locale) params.set("locale", opts.locale);
  if (opts?.mode) params.set("mode", opts.mode);
  const suffix = params.toString();
  return apiFetch<DayDetail>(`/api/days/${day}${suffix ? `?${suffix}` : ""}`);
};

export const submitAnswer = (
  day: number,
  payload: RiddleAnswerPayload,
  opts?: { override?: boolean; locale?: "en" | "de"; mode?: "NORMAL" | "VET" },
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

export const fetchAudit = (limit?: number) =>
  apiFetch<AdminOverview["recentAudit"] extends Array<infer T> ? T[] : never>(
    `/api/admin/audit${limit ? `?limit=${limit}` : ""}`,
  );

export const deleteAuditEntry = (id: number) =>
  apiFetch<{ success: boolean }>(`/api/admin/audit/${id}`, { method: "DELETE" });

export const fetchIntro = () => apiFetch<IntroPayload>("/api/intro");

export const completeIntro = () => apiFetch<{ introCompleted: boolean }>("/api/intro/complete", { method: "POST" });
