export type Locale = "en" | "de";
export type Mode = "NORMAL" | "VET";
export type RiddleType = "text" | "single-choice" | "multi-choice" | "sort" | "group" | "drag-sockets";

export interface RiddleOption {
  id: string;
  label: string;
  image?: string;
}

export interface RiddleGroup {
  id: string;
  label: string;
}

export interface DragSocketItem {
  id: string;
  label?: string;
  image?: string;
  shape?: "circle" | "square" | "hex";
}

export interface DragSocketSlot {
  id: string;
  position: { x: number; y: number };
  accepts: string[];
  shape?: "circle" | "square" | "hex";
  label?: string;
}

export type RiddleAnswerPayload =
  | { puzzleId: string; type: "text"; answer: string }
  | { puzzleId: string; type: "single-choice"; answer: string }
  | { puzzleId: string; type: "multi-choice"; answer: string[] }
  | { puzzleId: string; type: "sort"; answer: string[] }
  | { puzzleId: string; type: "group"; answer: Record<string, string[]> }
  | { puzzleId: string; type: "drag-sockets"; answer: Array<{ socketId: string; itemId: string }> };

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

export type DayBlock =
  | { kind: "story"; id?: string; title?: string; html: string; visible: boolean }
  | {
      kind: "puzzle";
      id: string;
      title?: string;
      html: string;
      visible: boolean;
      type: RiddleType;
      solution: unknown;
      solved: boolean;
      options?: RiddleOption[];
      minSelections?: number;
      backgroundImage?: string;
      items?: DragSocketItem[];
      sockets?: DragSocketSlot[];
      shape?: "circle" | "square" | "hex";
    }
  | {
      kind: "reward";
      id?: string;
      title?: string;
      visible: boolean;
      item?: {
        id: string;
        title: string;
        description: string;
        image: string;
        rarity: string;
      };
    };

export interface DayDetail {
  day: number;
  title: string;
  blocks: DayBlock[];
  isSolved: boolean;
  canPlay: boolean;
  message?: string;
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
