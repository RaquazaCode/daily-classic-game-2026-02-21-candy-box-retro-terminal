import {
  BASE_CANDIES_PER_CLICK,
  BASE_CANDIES_PER_SECOND,
  BASE_CATCHER_WIDTH,
  BASE_MULTIPLIER,
  BONUS_BLUE_SLOW_MS,
  BONUS_BLUE_SLOW_MULT,
  BONUS_FALL_SPEED,
  BONUS_HEAT_SPEEDUP,
  BONUS_RED_BOOST_MS,
  BONUS_RED_CPS_MULT,
  BONUS_SPAWN_INTERVAL_MS,
  BONUS_WARNING_MS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CANDY_BUTTON,
  CATCHER_HEIGHT,
  CATCHER_Y,
  COMMAND_COOLDOWN_MS,
  COMMAND_FEEDBACK_MS,
  HEAT_DECAY_PER_SEC,
  HEAT_MODE_CPS_MULT,
  HEAT_MODE_THRESHOLD,
  HEAT_ON_CATCH,
  MAX_MULTIPLIER,
  MAX_PENDING_EVENTS,
  MISS_RECOVERY_CPS_MULT,
  MISS_RECOVERY_MS,
  RUN_DURATION_MS,
  START_BUTTON,
  STREAK_STEP,
  THEMES,
  UPGRADE_BUTTONS
} from "./constants";
import { makeRng, seedFromText, type RNG } from "./rng";
import type { BonusType, GamePhase, GameState, PendingEvent, Rect, UpgradeSpec } from "./types";

function makeInitialState(seed: number): GameState {
  return {
    mode: "title",
    phase: "boot",
    seed,
    tick: 0,
    elapsedMs: 0,
    timeLeftMs: RUN_DURATION_MS,
    score: 0,
    candies: 0,
    candiesPerSecond: BASE_CANDIES_PER_SECOND,
    candiesPerClick: BASE_CANDIES_PER_CLICK,
    multiplier: BASE_MULTIPLIER,
    streak: 0,
    heat: 0,
    spawnCooldownMs: BONUS_SPAWN_INTERVAL_MS,
    nextSpawnMs: BONUS_SPAWN_INTERVAL_MS,
    warningActive: false,
    recoveryMs: 0,
    blueSlowMs: 0,
    redBoostMs: 0,
    commandBoostMs: 0,
    syncShield: 0,
    bonusTarget: {
      active: false,
      x: CANVAS_WIDTH * 0.5,
      y: -24,
      vy: BONUS_FALL_SPEED,
      cycle: 0,
      type: "orange"
    },
    catcherX: CANVAS_WIDTH * 0.5,
    catcherWidth: BASE_CATCHER_WIDTH,
    theme: THEMES[0].id,
    pausedReason: "",
    bootTextMs: 0,
    tutorialHint: "Catch falling bonuses to build streak. Miss = reset.",
    pendingEvents: [],
    upgrades: UPGRADE_BUTTONS.map((u) => ({ id: u.id, purchased: false })),
    stats: {
      clicks: 0,
      catches: 0,
      misses: 0,
      bestStreak: 0
    },
    scoreBreakdown: {
      manual: 0,
      passive: 0,
      bonus: 0,
      command: 0
    },
    command: {
      buffer: "",
      lastSubmitted: "",
      lastResult: "none",
      feedbackMs: 0,
      cooldownMs: {
        boost: 0,
        sync: 0,
        dump: 0
      },
      used: {
        boost: 0,
        sync: 0,
        dump: 0
      }
    },
    fx: {
      shakeMs: 0,
      missFlashMs: 0,
      catchFlashMs: 0,
      purchaseFlashMs: 0,
      screenJolt: 0
    }
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function rectContains(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function phaseForElapsed(elapsedMs: number): GamePhase {
  if (elapsedMs < 10000) {
    return "boot";
  }
  if (elapsedMs < 60000) {
    return "core";
  }
  if (elapsedMs < 90000) {
    return "overclock";
  }
  if (elapsedMs < RUN_DURATION_MS) {
    return "shutdown";
  }
  return "shutdown";
}

function pushEvent(state: GameState, event: PendingEvent): void {
  state.pendingEvents.push(event);
  if (state.pendingEvents.length > MAX_PENDING_EVENTS) {
    state.pendingEvents = state.pendingEvents.slice(-MAX_PENDING_EVENTS);
  }
}

function cycleBonusType(cycle: number, rng: RNG): BonusType {
  if (cycle <= 2) {
    return "orange";
  }
  const roll = Math.floor(rng.next() * 3);
  if (roll === 0) return "orange";
  if (roll === 1) return "blue";
  return "red";
}

function isUpgradePurchased(state: GameState, upgradeId: string): boolean {
  return Boolean(state.upgrades.find((entry) => entry.id === upgradeId)?.purchased);
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
  state.bonusTarget.type = cycleBonusType(state.bonusTarget.cycle, rng);
  state.spawnCooldownMs = BONUS_SPAWN_INTERVAL_MS;
  state.nextSpawnMs = BONUS_SPAWN_INTERVAL_MS;
  state.warningActive = false;

  pushEvent(state, {
    type: "bonus_spawn",
    tick: state.tick,
    data: {
      cycle: state.bonusTarget.cycle,
      bonusType: state.bonusTarget.type
    }
  });
}

function handleMissPenalty(state: GameState, reason: string, bonusType: BonusType): void {
  if (state.syncShield > 0) {
    state.syncShield -= 1;
    pushEvent(state, {
      type: "sync_shield_used",
      tick: state.tick,
      data: { reason, bonusType, shieldsLeft: state.syncShield }
    });
    return;
  }

  state.multiplier = BASE_MULTIPLIER;
  state.streak = 0;
  state.recoveryMs = MISS_RECOVERY_MS;
  state.fx.missFlashMs = 180;
  state.fx.shakeMs = 120;
  state.stats.misses += 1;
  pushEvent(state, {
    type: "bonus_miss_reset",
    tick: state.tick,
    data: { reason, bonusType }
  });
}

function resolveCatch(state: GameState): void {
  const catcherLeft = state.catcherX - state.catcherWidth / 2;
  const catcherRight = state.catcherX + state.catcherWidth / 2;
  const target = state.bonusTarget;
  const caught = target.x >= catcherLeft && target.x <= catcherRight;

  if (caught) {
    state.streak = Number((state.streak + STREAK_STEP).toFixed(2));
    state.multiplier = Math.min(MAX_MULTIPLIER, Number((state.multiplier + STREAK_STEP).toFixed(2)));
    state.heat = Math.min(1, Number((state.heat + HEAT_ON_CATCH).toFixed(4)));
    state.stats.bestStreak = Math.max(state.stats.bestStreak, state.streak);
    const narrowModeBoost = isUpgradePurchased(state, "narrow_mode") ? 2 : 1;
    const bonusPoints = Math.round(20 * state.multiplier * narrowModeBoost);
    state.score += bonusPoints;
    state.candies += bonusPoints * 0.2;
    state.scoreBreakdown.bonus += bonusPoints;
    state.stats.catches += 1;
    state.fx.catchFlashMs = 110;
    state.fx.shakeMs = Math.max(state.fx.shakeMs, 90);
    pushEvent(state, {
      type: "bonus_hit",
      tick: state.tick,
      data: {
        multi: Number(state.multiplier.toFixed(2)),
        bonusType: target.type
      }
    });
    if (target.type === "blue") {
      state.blueSlowMs = BONUS_BLUE_SLOW_MS;
      pushEvent(state, {
        type: "bonus_effect_blue",
        tick: state.tick,
        data: { ms: BONUS_BLUE_SLOW_MS }
      });
    }
    if (target.type === "red") {
      state.redBoostMs = BONUS_RED_BOOST_MS;
      pushEvent(state, {
        type: "bonus_effect_red",
        tick: state.tick,
        data: { ms: BONUS_RED_BOOST_MS }
      });
    }
  } else {
    handleMissPenalty(state, "missed_lane", target.type);
  }

  target.active = false;
  target.y = -24;
  state.spawnCooldownMs = BONUS_SPAWN_INTERVAL_MS;
  state.nextSpawnMs = BONUS_SPAWN_INTERVAL_MS;
}

function purchaseUpgrade(state: GameState, upgrade: UpgradeSpec): void {
  const slot = state.upgrades.find((entry) => entry.id === upgrade.id);
  if (!slot || slot.purchased) {
    return;
  }
  if (state.candies < upgrade.cost) {
    pushEvent(state, {
      type: "upgrade_blocked",
      tick: state.tick,
      data: {
        upgrade: upgrade.id
      }
    });
    return;
  }

  state.candies -= upgrade.cost;
  state.candiesPerSecond += upgrade.cps;
  state.candiesPerClick += upgrade.cpc;
  slot.purchased = true;
  if (upgrade.catcherWidthScale) {
    state.catcherWidth = Math.max(48, Math.round(BASE_CATCHER_WIDTH * upgrade.catcherWidthScale));
    pushEvent(state, {
      type: "risk_toggle",
      tick: state.tick,
      data: {
        upgrade: upgrade.id,
        catcherWidth: state.catcherWidth
      }
    });
  }
  state.fx.purchaseFlashMs = 180;
  pushEvent(state, {
    type: "upgrade_bought",
    tick: state.tick,
    data: {
      upgrade: upgrade.id
    }
  });
}

function runManualCollect(state: GameState): void {
  const clickBoost = state.commandBoostMs > 0 ? 2 : 1;
  const gain = state.candiesPerClick * state.multiplier * clickBoost;
  state.candies += gain;
  const points = Math.round(gain * 10);
  state.score += points;
  state.stats.clicks += 1;
  state.scoreBreakdown.manual += points;
  pushEvent(state, {
    type: "manual_collect",
    tick: state.tick,
    data: {
      gain: Number(gain.toFixed(2))
    }
  });
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
      pushEvent(this.state, {
        type: "run_started",
        tick: this.state.tick
      });
    }
  }

  reset(): void {
    this.state = makeInitialState(this.seed);
    pushEvent(this.state, {
      type: "run_reset",
      tick: this.state.tick
    });
  }

  togglePause(): void {
    if (this.state.mode === "playing") {
      this.state.mode = "paused";
      this.state.pausedReason = "manual";
      pushEvent(this.state, {
        type: "paused",
        tick: this.state.tick
      });
      return;
    }
    if (this.state.mode === "paused") {
      this.state.mode = "playing";
      this.state.pausedReason = "";
      pushEvent(this.state, {
        type: "resumed",
        tick: this.state.tick
      });
    }
  }

  onPointerMove(x: number): void {
    this.state.catcherX = clamp(x, 80, CANVAS_WIDTH - 80);
  }

  onPointerDown(x: number, y: number): void {
    if (this.state.mode === "title") {
      if (rectContains(START_BUTTON, x, y)) {
        this.start();
      }
      return;
    }

    if (this.state.mode !== "playing") {
      return;
    }

    if (rectContains(CANDY_BUTTON, x, y)) {
      runManualCollect(this.state);
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
    if (this.state.mode === "title" && (normalized === "enter" || normalized === " ")) {
      this.start();
      return;
    }
    if (normalized === "p") {
      this.togglePause();
    }
    if (normalized === "r") {
      this.reset();
    }
    if (this.state.mode !== "playing") {
      return;
    }
    if (normalized === "arrowleft" || normalized === "a") {
      this.state.catcherX = clamp(this.state.catcherX - 28, 80, CANVAS_WIDTH - 80);
      return;
    }
    if (normalized === "arrowright" || normalized === "d") {
      this.state.catcherX = clamp(this.state.catcherX + 28, 80, CANVAS_WIDTH - 80);
      return;
    }
    if (normalized === " " || normalized === "space" || normalized === "spacebar") {
      runManualCollect(this.state);
      return;
    }
    if (/^[a-z]$/.test(normalized)) {
      this.state.command.buffer = `${this.state.command.buffer}${normalized}`.slice(-14);
      return;
    }
    if (normalized === "backspace") {
      this.state.command.buffer = this.state.command.buffer.slice(0, -1);
      return;
    }
    if (normalized === "enter") {
      this.submitCommand();
      return;
    }
  }

  private submitCommand(): void {
    const command = this.state.command.buffer.trim().toLowerCase();
    this.state.command.lastSubmitted = command;
    this.state.command.buffer = "";
    this.state.command.feedbackMs = COMMAND_FEEDBACK_MS;
    if (!command) {
      this.state.command.lastResult = "error";
      return;
    }

    const cooldown = this.state.command.cooldownMs as Record<string, number>;
    if (cooldown[command] != null && cooldown[command] > 0) {
      this.state.command.lastResult = "cooldown";
      pushEvent(this.state, {
        type: "command_cooldown",
        tick: this.state.tick,
        data: { cmd: command, remainingMs: Math.round(cooldown[command]) }
      });
      return;
    }

    if (command === "boost") {
      this.state.commandBoostMs = 5000;
      this.state.command.cooldownMs.boost = COMMAND_COOLDOWN_MS.boost;
      this.state.command.used.boost += 1;
      this.state.command.lastResult = "ok";
    } else if (command === "sync") {
      this.state.syncShield = Math.min(3, this.state.syncShield + 1);
      this.state.recoveryMs = 0;
      this.state.command.cooldownMs.sync = COMMAND_COOLDOWN_MS.sync;
      this.state.command.used.sync += 1;
      this.state.command.lastResult = "ok";
    } else if (command === "dump") {
      const payout = Math.max(0, Math.round((this.state.candies * 0.15 + this.state.heat * 40) * this.state.multiplier));
      this.state.score += payout;
      this.state.scoreBreakdown.command += payout;
      this.state.command.cooldownMs.dump = COMMAND_COOLDOWN_MS.dump;
      this.state.command.used.dump += 1;
      this.state.command.lastResult = "ok";
    } else {
      this.state.command.lastResult = "error";
      pushEvent(this.state, {
        type: "command_error",
        tick: this.state.tick,
        data: { cmd: command }
      });
      return;
    }

    pushEvent(this.state, {
      type: "command_success",
      tick: this.state.tick,
      data: { cmd: command }
    });
  }

  update(dtMs: number): void {
    if (this.state.mode === "title") {
      this.state.tick += 1;
      this.state.bootTextMs += dtMs;
      return;
    }
    if (this.state.mode !== "playing") {
      return;
    }

    this.state.tick += 1;
    const dtSec = dtMs / 1000;
    this.state.elapsedMs += dtMs;
    this.state.timeLeftMs = Math.max(0, RUN_DURATION_MS - this.state.elapsedMs);
    this.state.phase = phaseForElapsed(this.state.elapsedMs);
    if (this.state.elapsedMs < 10000) {
      this.state.tutorialHint = "Arrow keys or mouse move catcher. SPACE/CLICK to collect.";
    } else if (this.state.elapsedMs < 30000) {
      this.state.tutorialHint = "Catch falling bonuses to build streak. Miss resets multiplier.";
    } else {
      this.state.tutorialHint = "Buy upgrades and type BOOST / SYNC / DUMP in command panel.";
    }

    for (const key of Object.keys(this.state.command.cooldownMs) as Array<keyof typeof COMMAND_COOLDOWN_MS>) {
      this.state.command.cooldownMs[key] = Math.max(0, this.state.command.cooldownMs[key] - dtMs);
    }
    this.state.command.feedbackMs = Math.max(0, this.state.command.feedbackMs - dtMs);
    if (this.state.command.feedbackMs === 0) {
      this.state.command.lastResult = "none";
    }
    this.state.commandBoostMs = Math.max(0, this.state.commandBoostMs - dtMs);
    this.state.fx.shakeMs = Math.max(0, this.state.fx.shakeMs - dtMs);
    this.state.fx.catchFlashMs = Math.max(0, this.state.fx.catchFlashMs - dtMs);
    this.state.fx.missFlashMs = Math.max(0, this.state.fx.missFlashMs - dtMs);
    this.state.fx.purchaseFlashMs = Math.max(0, this.state.fx.purchaseFlashMs - dtMs);

    if (!this.state.bonusTarget.active) {
      this.state.spawnCooldownMs -= dtMs;
      this.state.nextSpawnMs = Math.max(0, this.state.spawnCooldownMs);
      this.state.warningActive = this.state.nextSpawnMs <= BONUS_WARNING_MS;
      if (this.state.spawnCooldownMs <= 0) {
        spawnBonusTarget(this.state, this.rng);
      }
    } else {
      let fallSpeed = this.state.bonusTarget.vy * (1 + this.state.heat * BONUS_HEAT_SPEEDUP);
      if (this.state.phase === "overclock" || this.state.phase === "shutdown") {
        fallSpeed *= 1.15;
      }
      if (this.state.blueSlowMs > 0) {
        fallSpeed *= BONUS_BLUE_SLOW_MULT;
      }
      this.state.bonusTarget.y += fallSpeed * dtSec;
      if (
        this.state.bonusTarget.y + 14 >= CATCHER_Y &&
        this.state.bonusTarget.y - 14 <= CATCHER_Y + CATCHER_HEIGHT
      ) {
        resolveCatch(this.state);
      } else if (this.state.bonusTarget.y > CANVAS_HEIGHT + 20) {
        this.state.bonusTarget.active = false;
        this.state.spawnCooldownMs = BONUS_SPAWN_INTERVAL_MS;
        this.state.nextSpawnMs = BONUS_SPAWN_INTERVAL_MS;
        this.state.warningActive = false;
        handleMissPenalty(this.state, "fell_out", this.state.bonusTarget.type);
      }
    }

    this.state.heat = Math.max(0, Number((this.state.heat - HEAT_DECAY_PER_SEC * dtSec).toFixed(4)));
    this.state.recoveryMs = Math.max(0, this.state.recoveryMs - dtMs);
    this.state.blueSlowMs = Math.max(0, this.state.blueSlowMs - dtMs);
    this.state.redBoostMs = Math.max(0, this.state.redBoostMs - dtMs);

    let cpsMult = 1;
    if (this.state.recoveryMs > 0) {
      cpsMult *= MISS_RECOVERY_CPS_MULT;
    }
    if (this.state.heat >= HEAT_MODE_THRESHOLD) {
      cpsMult *= HEAT_MODE_CPS_MULT;
    }
    if (this.state.redBoostMs > 0) {
      cpsMult *= BONUS_RED_CPS_MULT;
    }
    const effectiveCps = this.state.candiesPerSecond * cpsMult;
    const passiveGain = effectiveCps * dtSec;
    this.state.candies += passiveGain;
    this.state.scoreBreakdown.passive += passiveGain;

    if (this.state.elapsedMs >= RUN_DURATION_MS) {
      this.state.mode = "game_over";
      this.state.timeLeftMs = 0;
      pushEvent(this.state, {
        type: "game_over_time_cap",
        tick: this.state.tick
      });
    }
  }

  getState(): GameState {
    return {
      ...this.state,
      bonusTarget: { ...this.state.bonusTarget },
      upgrades: this.state.upgrades.map((entry) => ({ ...entry })),
      pendingEvents: this.state.pendingEvents.map((entry) => ({ ...entry, data: entry.data ? { ...entry.data } : undefined })),
      stats: { ...this.state.stats },
      scoreBreakdown: { ...this.state.scoreBreakdown },
      command: {
        ...this.state.command,
        cooldownMs: { ...this.state.command.cooldownMs },
        used: { ...this.state.command.used }
      },
      fx: { ...this.state.fx }
    };
  }

  consumeSnapshot(): string {
    const payload = {
      mode: this.state.mode,
      phase: this.state.phase,
      coordinateSystem: "origin at top-left, +x right, +y down",
      score: this.state.score,
      candies: Number(this.state.candies.toFixed(2)),
      candiesPerSecond: Number(this.state.candiesPerSecond.toFixed(2)),
      candiesPerClick: Number(this.state.candiesPerClick.toFixed(2)),
      multiplier: Number(this.state.multiplier.toFixed(2)),
      streak: Number(this.state.streak.toFixed(2)),
      heat: Number(this.state.heat.toFixed(3)),
      recoveryMs: Math.round(this.state.recoveryMs),
      blueSlowMs: Math.round(this.state.blueSlowMs),
      redBoostMs: Math.round(this.state.redBoostMs),
      commandBoostMs: Math.round(this.state.commandBoostMs),
      syncShield: this.state.syncShield,
      warningActive: this.state.warningActive,
      timeLeftMs: Math.round(this.state.timeLeftMs),
      nextSpawnMs: Math.round(this.state.nextSpawnMs),
      bonusTarget: {
        active: this.state.bonusTarget.active,
        x: Number(this.state.bonusTarget.x.toFixed(2)),
        y: Number(this.state.bonusTarget.y.toFixed(2)),
        vy: Number(this.state.bonusTarget.vy.toFixed(2)),
        cycle: this.state.bonusTarget.cycle,
        type: this.state.bonusTarget.type
      },
      stats: { ...this.state.stats },
      scoreBreakdown: {
        manual: Number(this.state.scoreBreakdown.manual.toFixed(2)),
        passive: Number(this.state.scoreBreakdown.passive.toFixed(2)),
        bonus: Number(this.state.scoreBreakdown.bonus.toFixed(2)),
        command: Number(this.state.scoreBreakdown.command.toFixed(2))
      },
      command: {
        buffer: this.state.command.buffer,
        lastSubmitted: this.state.command.lastSubmitted,
        lastResult: this.state.command.lastResult,
        cooldownMs: { ...this.state.command.cooldownMs }
      },
      theme: this.state.theme,
      seed: this.state.seed,
      elapsedMs: Math.round(this.state.elapsedMs),
      pendingEvents: this.state.pendingEvents.map((entry) => ({ ...entry, data: entry.data ? { ...entry.data } : undefined }))
    };
    this.state.pendingEvents = [];
    return JSON.stringify(payload);
  }

  getCommandFeedbackMs(): number {
    return COMMAND_FEEDBACK_MS;
  }
}
