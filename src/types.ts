export type GameMode = "title" | "playing" | "paused" | "game_over";

export type GamePhase = "boot" | "core" | "overclock" | "shutdown";

export type BonusType = "orange" | "blue" | "red";

export type ThemeId = "classic_green" | "amber" | "blue_vector";

export type CommandId = "boost" | "sync" | "dump";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BonusTarget {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  cycle: number;
  type: BonusType;
}

export interface UpgradeState {
  id: string;
  purchased: boolean;
}

export interface GameStats {
  clicks: number;
  catches: number;
  misses: number;
  bestStreak: number;
}

export interface ScoreBreakdown {
  manual: number;
  passive: number;
  bonus: number;
  command: number;
}

export interface CommandState {
  buffer: string;
  lastSubmitted: string;
  lastResult: "ok" | "error" | "cooldown" | "none";
  feedbackMs: number;
  cooldownMs: Record<CommandId, number>;
  used: Record<CommandId, number>;
}

export interface FxState {
  shakeMs: number;
  missFlashMs: number;
  catchFlashMs: number;
  purchaseFlashMs: number;
  screenJolt: number;
}

export interface PendingEvent {
  type: string;
  tick: number;
  data?: Record<string, number | string | boolean | null>;
}

export interface GameState {
  mode: GameMode;
  phase: GamePhase;
  seed: number;
  tick: number;
  elapsedMs: number;
  timeLeftMs: number;
  score: number;
  candies: number;
  candiesPerSecond: number;
  candiesPerClick: number;
  multiplier: number;
  streak: number;
  heat: number;
  spawnCooldownMs: number;
  nextSpawnMs: number;
  warningActive: boolean;
  recoveryMs: number;
  bonusTarget: BonusTarget;
  catcherX: number;
  catcherWidth: number;
  theme: ThemeId;
  pausedReason: string;
  bootTextMs: number;
  tutorialHint: string;
  pendingEvents: PendingEvent[];
  upgrades: UpgradeState[];
  stats: GameStats;
  scoreBreakdown: ScoreBreakdown;
  command: CommandState;
  fx: FxState;
}

export interface UpgradeSpec {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  cost: number;
  cps: number;
  cpc: number;
  bonusValueMult?: number;
  catcherWidthScale?: number;
}

export interface ThemeSpec {
  id: ThemeId;
  name: string;
  bg: string;
  grid: string;
  bright: string;
  dim: string;
  panel: string;
  alert: string;
  accent: string;
}
