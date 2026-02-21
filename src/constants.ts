import type { ThemeSpec } from "./types";

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;

export const RUN_DURATION_MS = 120000;
export const BOOT_PHASE_MS = 10000;
export const OVERCLOCK_PHASE_MS = 90000;

export const BASE_CANDIES_PER_CLICK = 1;
export const BASE_CANDIES_PER_SECOND = 0.4;

export const BASE_MULTIPLIER = 1;
export const MAX_MULTIPLIER = 5;
export const STREAK_STEP = 0.5;

export const BONUS_SPAWN_INTERVAL_MS = 3000;
export const BONUS_WARNING_MS = 1000;
export const BONUS_FALL_SPEED = 140;
export const BONUS_HEAT_SPEEDUP = 0.4;
export const BONUS_BLUE_SLOW_MS = 5000;
export const BONUS_BLUE_SLOW_MULT = 0.65;
export const BONUS_RED_BOOST_MS = 10000;
export const BONUS_RED_CPS_MULT = 1.8;

export const BASE_CATCHER_WIDTH = 140;
export const CATCHER_WIDTH = BASE_CATCHER_WIDTH;
export const CATCHER_HEIGHT = 16;
export const CATCHER_Y = 548;

export const HEAT_ON_CATCH = 0.14;
export const HEAT_DECAY_PER_SEC = 0.06;
export const HEAT_MODE_THRESHOLD = 0.6;
export const HEAT_MODE_CPS_MULT = 2;

export const MISS_RECOVERY_MS = 5000;
export const MISS_RECOVERY_CPS_MULT = 0.5;

export const COMMAND_FEEDBACK_MS = 1600;
export const COMMAND_COOLDOWN_MS = {
  boost: 10000,
  sync: 15000,
  dump: 20000
} as const;

export const COMMAND_BOOST_MS = 5000;
export const COMMAND_BOOST_CLICK_MULT = 2;

export const CANDY_BUTTON = { x: 280, y: 420, w: 400, h: 140 };
export const START_BUTTON = { x: 320, y: 290, w: 320, h: 72 };

export const UPGRADE_BUTTONS = [
  { id: "sugar_rush", x: 710, y: 150, w: 220, h: 86, label: "Sugar Rush", cost: 25, cps: 0.6, cpc: 0 },
  { id: "factory", x: 710, y: 252, w: 220, h: 86, label: "Candy Factory", cost: 80, cps: 2.0, cpc: 0 },
  { id: "gold_wrapper", x: 710, y: 354, w: 220, h: 86, label: "Gold Wrapper", cost: 150, cps: 0, cpc: 1 },
  {
    id: "narrow_mode",
    x: 710,
    y: 456,
    w: 220,
    h: 86,
    label: "Narrow Mode",
    cost: 210,
    cps: 0,
    cpc: 0,
    bonusValueMult: 2,
    catcherWidthScale: 0.58
  }
] as const;

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

export const MAX_PENDING_EVENTS = 30;
export const TITLE_TEXT = "CANDY BOX // RETRO TERMINAL";
