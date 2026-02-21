export type GameMode = "title" | "playing" | "paused" | "game_over";

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
}

export interface UpgradeState {
  id: string;
  purchased: boolean;
}

export interface GameState {
  mode: GameMode;
  seed: number;
  elapsedMs: number;
  score: number;
  candies: number;
  candiesPerSecond: number;
  candiesPerClick: number;
  multiplier: number;
  spawnCooldownMs: number;
  bonusTarget: BonusTarget;
  catcherX: number;
  pendingEvents: string[];
  upgrades: UpgradeState[];
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
}
