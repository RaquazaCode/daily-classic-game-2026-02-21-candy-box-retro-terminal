import {
  BASE_CANDIES_PER_CLICK,
  BASE_CANDIES_PER_SECOND,
  BONUS_FALL_SPEED,
  BONUS_SPAWN_INTERVAL_MS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CATCHER_HEIGHT,
  CATCHER_WIDTH,
  CATCHER_Y,
  MAX_PENDING_EVENTS,
  UPGRADE_BUTTONS
} from "./constants";
import { makeRng, seedFromText, type RNG } from "./rng";
import type { GameState, Rect, UpgradeSpec } from "./types";

function makeInitialState(seed: number): GameState {
  return {
    mode: "title",
    seed,
    elapsedMs: 0,
    score: 0,
    candies: 0,
    candiesPerSecond: BASE_CANDIES_PER_SECOND,
    candiesPerClick: BASE_CANDIES_PER_CLICK,
    multiplier: 1,
    spawnCooldownMs: BONUS_SPAWN_INTERVAL_MS,
    bonusTarget: {
      active: false,
      x: CANVAS_WIDTH * 0.5,
      y: -24,
      vy: BONUS_FALL_SPEED,
      cycle: 0
    },
    catcherX: CANVAS_WIDTH * 0.5,
    pendingEvents: [],
    upgrades: UPGRADE_BUTTONS.map((u) => ({ id: u.id, purchased: false }))
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rectContains(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function pushEvent(state: GameState, label: string): void {
  state.pendingEvents.push(label);
  if (state.pendingEvents.length > MAX_PENDING_EVENTS) {
    state.pendingEvents = state.pendingEvents.slice(-MAX_PENDING_EVENTS);
  }
}

function spawnBonusTarget(state: GameState, rng: RNG): void {
  const cycle = state.bonusTarget.cycle;
  let x = CANVAS_WIDTH * 0.5;
  if (cycle === 1) {
    x = CANVAS_WIDTH * 0.84;
  }
  if (cycle > 1) {
    x = 80 + rng.next() * (CANVAS_WIDTH - 160);
  }
  state.bonusTarget.active = true;
  state.bonusTarget.x = x;
  state.bonusTarget.y = -24;
  state.bonusTarget.vy = BONUS_FALL_SPEED;
  state.bonusTarget.cycle += 1;
  pushEvent(state, `bonus_spawn_${state.bonusTarget.cycle}`);
}

function resolveCatch(state: GameState): void {
  const catcherLeft = state.catcherX - CATCHER_WIDTH / 2;
  const catcherRight = state.catcherX + CATCHER_WIDTH / 2;
  const target = state.bonusTarget;
  const caught = target.x >= catcherLeft && target.x <= catcherRight;

  if (caught) {
    state.multiplier = Math.min(5, Number((state.multiplier + 0.5).toFixed(2)));
    const bonusPoints = Math.round(20 * state.multiplier);
    state.score += bonusPoints;
    state.candies += bonusPoints * 0.2;
    pushEvent(state, `bonus_hit_x${state.multiplier.toFixed(1)}`);
  } else {
    state.multiplier = 1;
    pushEvent(state, "bonus_miss_reset");
  }

  target.active = false;
  target.y = -24;
  state.spawnCooldownMs = BONUS_SPAWN_INTERVAL_MS;
}

function purchaseUpgrade(state: GameState, upgrade: UpgradeSpec): void {
  const slot = state.upgrades.find((entry) => entry.id === upgrade.id);
  if (!slot || slot.purchased) {
    return;
  }
  if (state.candies < upgrade.cost) {
    pushEvent(state, `upgrade_blocked_${upgrade.id}`);
    return;
  }

  state.candies -= upgrade.cost;
  state.candiesPerSecond += upgrade.cps;
  state.candiesPerClick += upgrade.cpc;
  slot.purchased = true;
  pushEvent(state, `upgrade_bought_${upgrade.id}`);
}

export class CandyBoxGame {
  private readonly seed: number;
  private readonly rng: RNG;
  private state: GameState;

  constructor(seedText: string) {
    this.seed = seedFromText(seedText);
    this.rng = makeRng(this.seed);
    this.state = makeInitialState(this.seed);
  }

  start(): void {
    if (this.state.mode === "title") {
      this.state.mode = "playing";
      pushEvent(this.state, "run_started");
    }
  }

  reset(): void {
    this.state = makeInitialState(this.seed);
    pushEvent(this.state, "run_reset");
  }

  togglePause(): void {
    if (this.state.mode === "playing") {
      this.state.mode = "paused";
      pushEvent(this.state, "paused");
      return;
    }
    if (this.state.mode === "paused") {
      this.state.mode = "playing";
      pushEvent(this.state, "resumed");
    }
  }

  onPointerMove(x: number): void {
    this.state.catcherX = clamp(x, 80, CANVAS_WIDTH - 80);
  }

  onPointerDown(x: number, y: number): void {
    if (this.state.mode === "title") {
      if (rectContains({ x: 320, y: 290, w: 320, h: 72 }, x, y)) {
        this.start();
      }
      return;
    }

    if (this.state.mode !== "playing") {
      return;
    }

    if (rectContains({ x: 280, y: 420, w: 400, h: 140 }, x, y)) {
      const gain = this.state.candiesPerClick * this.state.multiplier;
      this.state.candies += gain;
      this.state.score += Math.round(gain * 10);
      pushEvent(this.state, "manual_collect");
      return;
    }

    for (const upgrade of UPGRADE_BUTTONS) {
      if (rectContains(upgrade, x, y)) {
        purchaseUpgrade(this.state, upgrade);
        return;
      }
    }
  }

  onKeyDown(key: string): void {
    const normalized = key.toLowerCase();
    if (normalized === "p") {
      this.togglePause();
    }
    if (normalized === "r") {
      this.reset();
    }
  }

  update(dtMs: number): void {
    if (this.state.mode !== "playing") {
      return;
    }

    const dtSec = dtMs / 1000;
    this.state.elapsedMs += dtMs;
    this.state.candies += this.state.candiesPerSecond * dtSec;

    if (!this.state.bonusTarget.active) {
      this.state.spawnCooldownMs -= dtMs;
      if (this.state.spawnCooldownMs <= 0) {
        spawnBonusTarget(this.state, this.rng);
      }
    } else {
      this.state.bonusTarget.y += this.state.bonusTarget.vy * dtSec;
      if (this.state.bonusTarget.y + 14 >= CATCHER_Y && this.state.bonusTarget.y - 14 <= CATCHER_Y + CATCHER_HEIGHT) {
        resolveCatch(this.state);
      } else if (this.state.bonusTarget.y > CANVAS_HEIGHT + 20) {
        this.state.multiplier = 1;
        this.state.bonusTarget.active = false;
        this.state.spawnCooldownMs = BONUS_SPAWN_INTERVAL_MS;
        pushEvent(this.state, "bonus_miss_reset");
      }
    }

    if (this.state.elapsedMs >= 120000) {
      this.state.mode = "game_over";
      pushEvent(this.state, "game_over_time_cap");
    }
  }

  getState(): GameState {
    return {
      ...this.state,
      bonusTarget: { ...this.state.bonusTarget },
      upgrades: this.state.upgrades.map((entry) => ({ ...entry })),
      pendingEvents: [...this.state.pendingEvents]
    };
  }

  consumeSnapshot(): string {
    const payload = {
      mode: this.state.mode,
      coordinateSystem: "origin at top-left, +x right, +y down",
      score: this.state.score,
      candies: Number(this.state.candies.toFixed(2)),
      candiesPerSecond: Number(this.state.candiesPerSecond.toFixed(2)),
      candiesPerClick: Number(this.state.candiesPerClick.toFixed(2)),
      multiplier: Number(this.state.multiplier.toFixed(2)),
      bonusTarget: {
        active: this.state.bonusTarget.active,
        x: Number(this.state.bonusTarget.x.toFixed(2)),
        y: Number(this.state.bonusTarget.y.toFixed(2)),
        vy: Number(this.state.bonusTarget.vy.toFixed(2)),
        cycle: this.state.bonusTarget.cycle
      },
      seed: this.state.seed,
      elapsedMs: Math.round(this.state.elapsedMs),
      pendingEvents: [...this.state.pendingEvents]
    };
    this.state.pendingEvents = [];
    return JSON.stringify(payload);
  }
}
