export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;
export const BASE_CANDIES_PER_CLICK = 1;
export const BASE_CANDIES_PER_SECOND = 0.4;
export const BONUS_SPAWN_INTERVAL_MS = 3000;
export const BONUS_FALL_SPEED = 140;
export const CATCHER_Y = 548;
export const CATCHER_WIDTH = 140;
export const CATCHER_HEIGHT = 16;
export const CANDY_BUTTON = { x: 280, y: 420, w: 400, h: 140 };
export const START_BUTTON = { x: 320, y: 290, w: 320, h: 72 };
export const UPGRADE_BUTTONS = [
  { id: "sugar_rush", x: 710, y: 170, w: 220, h: 90, label: "Sugar Rush", cost: 25, cps: 0.6, cpc: 0 },
  { id: "factory", x: 710, y: 280, w: 220, h: 90, label: "Candy Factory", cost: 80, cps: 2.0, cpc: 0 },
  { id: "gold_wrapper", x: 710, y: 390, w: 220, h: 90, label: "Gold Wrapper", cost: 150, cps: 0, cpc: 1 }
] as const;
export const MAX_PENDING_EVENTS = 10;
export const TITLE_TEXT = "CANDY BOX // RETRO TERMINAL";
