import type { DifficultyProfile, MetaState, PrestigeUpgradeSpec, Rect, ThemeSpec, UpgradeSpec } from "./types";

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;

export const PLAYFIELD_RECT: Rect = {
  x: 0,
  y: 0,
  w: CANVAS_WIDTH,
  h: CANVAS_HEIGHT
};

export const BOOT_PHASE_MS = 10000;

export const BASE_CANDIES_PER_CLICK = 1;
export const BASE_CANDIES_PER_SECOND = 0.4;

export const BASE_MULTIPLIER = 1;
export const MAX_MULTIPLIER = 5;
export const STREAK_STEP = 0.5;

export const BONUS_WARNING_MS = 1000;
export const BONUS_HEAT_SPEEDUP = 0.4;
export const BONUS_BLUE_SLOW_MS = 5000;
export const BONUS_BLUE_SLOW_MULT = 0.65;
export const BONUS_RED_BOOST_MS = 10000;
export const BONUS_RED_CPS_MULT = 1.8;

export const BASE_CATCHER_WIDTH = 140;
export const CATCHER_HEIGHT = 16;
export const CATCHER_Y = 548;

export const HEAT_ON_CATCH = 0.14;
export const HEAT_DECAY_PER_SEC = 0.06;
export const HEAT_MODE_THRESHOLD = 0.6;
export const HEAT_MODE_CPS_MULT = 2;

export const COMMAND_FEEDBACK_MS = 1600;
export const BASE_COMMAND_COOLDOWN_MS = {
  boost: 10000,
  sync: 15000,
  dump: 20000
} as const;

export const COMMAND_BOOST_MS = 5000;
export const COMMAND_BOOST_CLICK_MULT = 2;

export const DIFFICULTY_PROFILES: DifficultyProfile[] = [
  {
    id: "easy",
    label: "Easy",
    runDurationMs: 300000,
    spawnIntervalMs: 3400,
    bonusFallSpeed: 120,
    missRecoveryMs: 3000,
    upgradeCostMult: 0.9,
    baseRateMult: 1.12,
    chipMult: 0.85
  },
  {
    id: "medium",
    label: "Medium",
    runDurationMs: 240000,
    spawnIntervalMs: 2800,
    bonusFallSpeed: 145,
    missRecoveryMs: 4500,
    upgradeCostMult: 1,
    baseRateMult: 1,
    chipMult: 1
  },
  {
    id: "hard",
    label: "Hard",
    runDurationMs: 180000,
    spawnIntervalMs: 2200,
    bonusFallSpeed: 180,
    missRecoveryMs: 6000,
    upgradeCostMult: 1.18,
    baseRateMult: 0.92,
    chipMult: 1.35
  }
];

export const DEFAULT_DIFFICULTY_ID = "medium" as const;

export const UPGRADE_SPECS: UpgradeSpec[] = [
  { id: "sugar_rush", label: "Sugar Rush", baseCost: 25, cps: 0.6, cpc: 0 },
  { id: "factory", label: "Candy Factory", baseCost: 80, cps: 2.0, cpc: 0 },
  { id: "gold_wrapper", label: "Gold Wrapper", baseCost: 150, cps: 0, cpc: 1 },
  {
    id: "narrow_mode",
    label: "Narrow Mode",
    baseCost: 210,
    cps: 0,
    cpc: 0,
    bonusValueMult: 2,
    catcherWidthScale: 0.58
  }
];

export const PRESTIGE_UPGRADE_SPECS: PrestigeUpgradeSpec[] = [
  {
    id: "manual_core",
    label: "Manual Core",
    description: "+0.15 CPC per rank",
    maxRank: 5,
    costs: [3, 7, 12, 18, 26]
  },
  {
    id: "passive_core",
    label: "Passive Core",
    description: "+0.12 CPS per rank",
    maxRank: 5,
    costs: [3, 7, 12, 18, 26]
  },
  {
    id: "catcher_rails",
    label: "Catcher Rails",
    description: "+8px catcher width per rank",
    maxRank: 4,
    costs: [5, 11, 19, 30]
  },
  {
    id: "heat_sink",
    label: "Heat Sink",
    description: "-8% heat gain per rank",
    maxRank: 4,
    costs: [5, 11, 19, 30]
  },
  {
    id: "recovery_patch",
    label: "Recovery Patch",
    description: "-10% miss recovery per rank",
    maxRank: 4,
    costs: [5, 11, 19, 30]
  },
  {
    id: "command_bus",
    label: "Command Bus",
    description: "-12% command cooldown per rank (rank 3: +1 starting shield)",
    maxRank: 3,
    costs: [8, 18, 34]
  }
];

export const META_STORAGE_KEY = "candy_box_retro_terminal_v2_meta";

export const META_VERSION = 1;

export const DEFAULT_META_STATE: MetaState = {
  version: META_VERSION,
  chips: 0,
  lifetimeChips: 0,
  upgrades: {
    manual_core: 0,
    passive_core: 0,
    catcher_rails: 0,
    heat_sink: 0,
    recovery_patch: 0,
    command_bus: 0
  }
};

export const THEMES: ThemeSpec[] = [
  {
    id: "classic_green",
    name: "Classic Green",
    bg: "#010a04",
    grid: "#0b4e24",
    bright: "#00ff88",
    dim: "#b8ffd7",
    panel: "#032112",
    alert: "#ff4444",
    accent: "#1aff6e"
  },
  {
    id: "amber",
    name: "Amber Archive",
    bg: "#120d00",
    grid: "#5a3f00",
    bright: "#ffbf3d",
    dim: "#ffe4a7",
    panel: "#2a1b00",
    alert: "#ff7755",
    accent: "#ff9b21"
  },
  {
    id: "blue_vector",
    name: "Blue Vector",
    bg: "#02091a",
    grid: "#0b3c5e",
    bright: "#33c0e7",
    dim: "#b5ecfb",
    panel: "#03243a",
    alert: "#ff5470",
    accent: "#00aaff"
  }
];

export const MAX_PENDING_EVENTS = 40;
export const TITLE_TEXT = "CANDY BOX // RETRO TERMINAL";
