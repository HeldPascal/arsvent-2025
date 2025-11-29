import type { DayDetail, DaySummary, Locale, Mode, User } from "../types";

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
    throw new Error(`Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const fetchMe = () => apiFetch<User>("/api/auth/me");

export const fetchDays = () => apiFetch<DaySummary[]>("/api/days");

export const fetchDay = (day: number) => apiFetch<DayDetail>(`/api/days/${day}`);

export const submitAnswer = (day: number, answer: string) =>
  apiFetch<{ day: number; isSolved: boolean; correct: boolean; message: string }>(`/api/days/${day}/submit`, {
    method: "POST",
    body: JSON.stringify({ answer }),
  });

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
