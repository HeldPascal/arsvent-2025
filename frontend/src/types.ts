export type Locale = "en" | "de";
export type Mode = "NORMAL" | "VET";
export type RiddleType = "text" | "single-choice" | "multi-choice" | "sort" | "group";

export interface RiddleOption {
  id: string;
  label: string;
}

export interface RiddleGroup {
  id: string;
  label: string;
}

export type RiddleAnswerPayload =
  | { type: "text"; answer: string }
  | { type: "single-choice"; answer: string }
  | { type: "multi-choice"; answer: string[] }
  | { type: "sort"; answer: string[] }
  | { type: "group"; answer: Record<string, string[]> };

export interface User {
  id: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
  locale: Locale;
  mode: Mode;
  introCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  lastSolvedAt?: string | null;
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

export interface DaysResponse {
  days: DaySummary[];
  unlockedDay: number;
}

export interface DayDetail {
  day: number;
  title: string;
  body: string;
  type: RiddleType;
  options?: RiddleOption[];
  groups?: RiddleGroup[];
  minSelections?: number;
  isSolved: boolean;
  canPlay: boolean;
  message?: string;
  solvedAnswer?: string | string[] | Record<string, string[]>;
}

export interface IntroPayload {
  title: string;
  body: string;
  introCompleted: boolean;
  mode: Mode;
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
    downgradedUsers: number;
    solveHistogram: number[];
    downgradeHistogram: number[];
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
  recentSolves: Array<{
    id: string;
    username: string;
    lastSolvedDay: number;
    lastSolvedAt: string | null;
    mode: Mode;
  }>;
  recentAudit?: AdminAuditEntry[];
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
  lastSolvedAt?: string | null;
  lastDowngradedAt?: string | null;
  sessionVersion: number;
  stateVersion: number;
  lastSolvedDay: number;
}

export interface AdminAuditEntry {
  id: number;
  action: string;
  actorId?: string | null;
  details?: string | null;
  createdAt: string;
}
