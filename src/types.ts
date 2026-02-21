export type GameMode = "title" | "playing" | "paused" | "game_over";

export type GamePhase = "boot" | "core" | "overclock" | "shutdown";

export type BonusType = "orange" | "blue" | "red";

export type ThemeId = "classic_green" | "amber" | "blue_vector";

export type DifficultyId = "easy" | "medium" | "hard";

export type CommandId = "boost" | "sync" | "dump";

export type PrestigeUpgradeId =
  | "manual_core"
  | "passive_core"
  | "catcher_rails"
  | "heat_sink"
  | "recovery_patch"
  | "command_bus";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface UiPanelsOpen {
  left: boolean;
  right: boolean;
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
}

export interface PendingEvent {
  type: string;
  tick: number;
  data?: Record<string, number | string | boolean | null>;
}

export interface DifficultyProfile {
  id: DifficultyId;
  label: string;
  runDurationMs: number;
  spawnIntervalMs: number;
  bonusFallSpeed: number;
  missRecoveryMs: number;
  upgradeCostMult: number;
  baseRateMult: number;
  chipMult: number;
}

export type PrestigeUpgradeState = Record<PrestigeUpgradeId, number>;

export interface MetaState {
  version: number;
  chips: number;
  lifetimeChips: number;
  upgrades: PrestigeUpgradeState;
}

export interface PrestigeUpgradeSpec {
  id: PrestigeUpgradeId;
  label: string;
  description: string;
  maxRank: number;
  costs: number[];
}

export interface GameState {
  mode: GameMode;
  phase: GamePhase;
  difficulty: DifficultyId;
  runDurationMs: number;
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
  blueSlowMs: number;
  redBoostMs: number;
  commandBoostMs: number;
  syncShield: number;
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
  chipsEarnedThisRun: number;
  playfieldRect: Rect;
  uiPanelsOpen: UiPanelsOpen;
  meta: MetaState;
}

export interface UpgradeSpec {
  id: string;
  label: string;
  baseCost: number;
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

export interface GameConstructorOptions {
  difficulty?: DifficultyId;
  meta?: MetaState;
  metaMode?: "enabled" | "disabled";
}

export interface UpgradeCostInfo {
  id: string;
  label: string;
  cost: number;
  purchased: boolean;
  canAfford: boolean;
  shortBy: number;
  effects: string[];
}

export interface MetaUpgradeInfo {
  id: PrestigeUpgradeId;
  label: string;
  rank: number;
  maxRank: number;
  nextCost: number | null;
  description: string;
  canAfford: boolean;
}
