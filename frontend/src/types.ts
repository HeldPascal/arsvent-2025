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
  updatedAt: string;
  lastLoginAt?: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  sessionVersion: number;
  stateVersion: number;
  lastSolvedDay: number;
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

export interface AdminOverview {
  diagnostics: {
    uptimeSeconds: number;
    serverTime: string;
    availableDay: number;
    maxDay: number;
    nodeVersion: string;
    superAdminId: string | null;
  };
  stats: {
    totalUsers: number;
    adminUsers: number;
    vetUsers: number;
    normalUsers: number;
    progressedUsers: number;
  };
  recentUsers: Array<{
    id: string;
    username: string;
    locale: Locale;
    mode: Mode;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt: string | null;
    lastSolvedDay: number;
  }>;
  recentSolves: [];
}

export interface AdminUserSummary {
  id: string;
  username: string;
  globalName?: string | null;
  locale: Locale;
  mode: Mode;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  sessionVersion: number;
  stateVersion: number;
  lastSolvedDay: number;
}
