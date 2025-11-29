export type Locale = "en" | "de";
export type Mode = "NORMAL" | "VET";

export interface User {
  id: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
  locale: Locale;
  mode: Mode;
  createdAt: string;
}

export interface DaySummary {
  day: number;
  isAvailable: boolean;
  isSolved: boolean;
}

export interface DayDetail {
  day: number;
  title: string;
  body: string;
  isSolved: boolean;
  canPlay: boolean;
  message?: string;
}
