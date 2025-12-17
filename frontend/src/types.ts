export type Locale = "en" | "de";
export type Mode = "NORMAL" | "VETERAN";
export type RiddleType =
  | "text"
  | "placeholder"
  | "single-choice"
  | "multi-choice"
  | "sort"
  | "group"
  | "drag-sockets"
  | "select-items"
  | "memory"
  | "grid-path";

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
  defaultSocketId?: string;
  position?: { x: number; y: number };
}

export interface DragSocketSlot {
  id: string;
  position: { x: number; y: number };
  accepts: string[];
  shape?: "circle" | "square" | "hex";
  label?: string;
  image?: string;
}

export interface MemoryCard {
  id: string;
  image: string;
  label?: string;
}

export interface GridSize {
  width: number;
  height: number;
}

export interface GridPathSolution {
  path: Array<{ x: number; y: number }>;
  startColumn?: number;
  goalColumn?: number;
}

export type RiddleAnswerPayload =
  | { puzzleId: string; type: "text"; answer: string }
  | { puzzleId: string; type: "single-choice"; answer: string }
  | { puzzleId: string; type: "multi-choice"; answer: string[] }
  | { puzzleId: string; type: "sort"; answer: string[] }
  | { puzzleId: string; type: "group"; answer: Record<string, string[]> }
  | { puzzleId: string; type: "select-items"; answer: string[] }
  | { puzzleId: string; type: "memory"; answer: Array<{ a: string; b: string }> }
  | { puzzleId: string; type: "drag-sockets"; answer: Array<{ socketId: string; itemId: string }> }
  | { puzzleId: string; type: "grid-path"; answer: GridPathSolution };

export interface User {
  id: string;
  username: string;
  globalName?: string | null;
  avatar?: string | null;
  locale: Locale;
  mode: Mode;
  creatureSwap?: boolean;
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
  hasContent?: boolean;
}

export interface DaysResponse {
  days: DaySummary[];
  unlockedDay: number;
  contentDayCount?: number;
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
      ordered?: boolean;
      optionSize?: "small" | "medium" | "large";
      backgroundImage?: string;
      items?: DragSocketItem[];
      sockets?: DragSocketSlot[];
      shape?: "circle" | "square" | "hex";
      cards?: MemoryCard[];
      backImage?: string;
      hoverBackImage?: string;
      maxMisses?: number | null;
      missIndicator?: "deplete" | "fill";
      missIndicatorAnimation?: "burst" | "shatter";
      flipBackMs?: number;
      grid?: GridSize;
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
      contentDayCount: number;
      maxContiguousContentDay: number;
      nextDayHasContent: boolean;
      nodeVersion: string;
      superAdminId: string | null;
    };
  stats: {
    totalUsers: number;
    adminUsers: number;
    veteranUsers: number;
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

export type IssueSeverity = "info" | "warning" | "error";
export type IssueSource = "inventory" | "asset" | "content" | "consistency" | "link";
export interface ContentIssue {
  severity: IssueSeverity;
  source: IssueSource;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ContentVariantStatus = "ok" | "missing" | "warning" | "error";

export interface ContentVariantDiagnostics {
  day: number;
  locale: Locale;
  mode: Mode;
  status: ContentVariantStatus;
  issues: string[];
  filePath?: string;
  title?: string;
  contentId?: string;
}

export interface ContentDayDiagnostics {
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
  ids?: string[];
  itemList?: Array<{
    id: string;
    title: string;
    description: string;
    image: string;
    rarity: string;
    imageToken?: string;
  }>;
}

export interface InventoryConsistencyDiagnostics {
  locale: Locale;
  missingIds: string[];
  extraIds: string[];
}

export interface ContentDiagnostics {
  variants: ContentVariantDiagnostics[];
  days: ContentDayDiagnostics[];
  stats: {
    totalDays: number;
    completeDays: number;
    partialDays: number;
    issueDays: number;
    emptyDays: number;
  };
  indexWarnings: string[];
  issues: ContentIssue[];
  assets: {
    total: number;
    referenced: number;
    unused: number;
    list: Array<{ path: string; referenced: boolean; size: number; hash?: string; token: string }>;
  };
  inventory: {
    locales: InventoryLocaleDiagnostics[];
    consistency: InventoryConsistencyDiagnostics[];
  };
}

export interface AdminContentDayDetail {
  day: number;
  locale: Locale;
  mode: Mode;
  filePath?: string;
  title: string;
  blocks: DayBlock[];
  puzzleIds: string[];
  solvedCondition: unknown;
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
