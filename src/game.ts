import {
  BASE_CANDIES_PER_CLICK,
  BASE_CANDIES_PER_SECOND,
  BASE_CATCHER_WIDTH,
  BASE_COMMAND_COOLDOWN_MS,
  BASE_MULTIPLIER,
  BOOT_PHASE_MS,
  BONUS_BLUE_SLOW_MS,
  BONUS_BLUE_SLOW_MULT,
  BONUS_HEAT_SPEEDUP,
  BONUS_RED_BOOST_MS,
  BONUS_RED_CPS_MULT,
  BONUS_WARNING_MS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CATCHER_HEIGHT,
  CATCHER_Y,
  COMMAND_BOOST_CLICK_MULT,
  COMMAND_BOOST_MS,
  COMMAND_FEEDBACK_MS,
  DEFAULT_DIFFICULTY_ID,
  DEFAULT_META_STATE,
  DIFFICULTY_PROFILES,
  HEAT_DECAY_PER_SEC,
  HEAT_MODE_CPS_MULT,
  HEAT_MODE_THRESHOLD,
  HEAT_ON_CATCH,
  MAX_MULTIPLIER,
  MAX_PENDING_EVENTS,
  PLAYFIELD_RECT,
  PRESTIGE_UPGRADE_SPECS,
  STREAK_STEP,
  THEMES,
  TITLE_TEXT,
  UPGRADE_SPECS
} from "./constants";
import { makeRng, seedFromText, type RNG } from "./rng";
import type {
  BonusType,
  CommandId,
  DifficultyId,
  DifficultyProfile,
  GameConstructorOptions,
  GamePhase,
  GameState,
  MetaState,
  MetaUpgradeInfo,
  PendingEvent,
  PrestigeUpgradeId,
  PrestigeUpgradeSpec,
  UpgradeCostInfo,
  UpgradeSpec,
  UiPanelsOpen
} from "./types";

const MISS_RECOVERY_CPS_MULT = 0.5;
const META_DISABLED_META: MetaState = {
  version: 1,
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampInt(value: number, min: number, max: number): number {
  return Math.floor(clamp(value, min, max));
}

function cloneMeta(meta: MetaState): MetaState {
  return {
    version: meta.version,
    chips: meta.chips,
    lifetimeChips: meta.lifetimeChips,
    upgrades: { ...meta.upgrades }
  };
}

function normalizeMeta(input?: MetaState): MetaState {
  const fallback = cloneMeta(DEFAULT_META_STATE);
  if (!input || typeof input !== "object") {
    return fallback;
  }
  const source = input as MetaState;
  const next: MetaState = {
    version: typeof source.version === "number" ? source.version : fallback.version,
    chips: typeof source.chips === "number" ? Math.max(0, Math.floor(source.chips)) : fallback.chips,
    lifetimeChips:
      typeof source.lifetimeChips === "number" ? Math.max(0, Math.floor(source.lifetimeChips)) : fallback.lifetimeChips,
    upgrades: { ...fallback.upgrades }
  };

  if (source.upgrades && typeof source.upgrades === "object") {
    for (const spec of PRESTIGE_UPGRADE_SPECS) {
      const raw = (source.upgrades as Record<string, unknown>)[spec.id];
      if (typeof raw === "number") {
        next.upgrades[spec.id] = clampInt(raw, 0, spec.maxRank);
      }
    }
  }

  return next;
}

function profileFor(difficulty: DifficultyId): DifficultyProfile {
  return DIFFICULTY_PROFILES.find((item) => item.id === difficulty) ?? DIFFICULTY_PROFILES[1];
}

function phaseForElapsed(elapsedMs: number, runDurationMs: number): GamePhase {
  if (elapsedMs < BOOT_PHASE_MS) {
    return "boot";
  }
  if (elapsedMs < runDurationMs * 0.55) {
    return "core";
  }
  if (elapsedMs < runDurationMs * 0.8) {
    return "overclock";
  }
  return "shutdown";
}

function clonePanels(panels: UiPanelsOpen): UiPanelsOpen {
  return { left: panels.left, right: panels.right };
}

function makeInitialState(seed: number, profile: DifficultyProfile, meta: MetaState): GameState {
  const manualRank = meta.upgrades.manual_core;
  const passiveRank = meta.upgrades.passive_core;
  const railsRank = meta.upgrades.catcher_rails;
  const commandBusRank = meta.upgrades.command_bus;

  const baseCpc = BASE_CANDIES_PER_CLICK * profile.baseRateMult + manualRank * 0.15;
  const baseCps = BASE_CANDIES_PER_SECOND * profile.baseRateMult + passiveRank * 0.12;
  const baseCatcherWidth = BASE_CATCHER_WIDTH + railsRank * 8;

  return {
    mode: "title",
    phase: "boot",
    difficulty: profile.id,
    runDurationMs: profile.runDurationMs,
    seed,
    tick: 0,
    elapsedMs: 0,
    timeLeftMs: profile.runDurationMs,
    score: 0,
    candies: 0,
    candiesPerSecond: Number(baseCps.toFixed(3)),
    candiesPerClick: Number(baseCpc.toFixed(3)),
    multiplier: BASE_MULTIPLIER,
    streak: 0,
    heat: 0,
    spawnCooldownMs: profile.spawnIntervalMs,
    nextSpawnMs: profile.spawnIntervalMs,
    warningActive: false,
    recoveryMs: 0,
    blueSlowMs: 0,
    redBoostMs: 0,
    commandBoostMs: 0,
    syncShield: commandBusRank >= 3 ? 1 : 0,
    bonusTarget: {
      active: false,
      x: CANVAS_WIDTH * 0.5,
      y: -24,
      vy: profile.bonusFallSpeed,
      cycle: 0,
      type: "orange"
    },
    catcherX: CANVAS_WIDTH * 0.5,
    catcherWidth: baseCatcherWidth,
    theme: THEMES[0].id,
    pausedReason: "",
    bootTextMs: 0,
    tutorialHint: "Catch falling bonuses to build streak. Miss = reset.",
    pendingEvents: [],
    upgrades: UPGRADE_SPECS.map((u) => ({ id: u.id, purchased: false })),
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
      purchaseFlashMs: 0
    },
    chipsEarnedThisRun: 0,
    playfieldRect: { ...PLAYFIELD_RECT },
    uiPanelsOpen: {
      left: false,
      right: false
    },
    meta: cloneMeta(meta)
  };
}

function getSpecById(upgradeId: string): UpgradeSpec | undefined {
  return UPGRADE_SPECS.find((item) => item.id === upgradeId);
}

function getPrestigeSpecById(id: PrestigeUpgradeId): PrestigeUpgradeSpec {
  const spec = PRESTIGE_UPGRADE_SPECS.find((item) => item.id === id);
  if (!spec) {
    throw new Error(`Unknown prestige id: ${id}`);
  }
  return spec;
}

function pushEvent(state: GameState, event: PendingEvent): void {
  state.pendingEvents.push(event);
  if (state.pendingEvents.length > MAX_PENDING_EVENTS) {
    state.pendingEvents = state.pendingEvents.slice(-MAX_PENDING_EVENTS);
  }
}

function isUpgradePurchased(state: GameState, upgradeId: string): boolean {
  return Boolean(state.upgrades.find((entry) => entry.id === upgradeId)?.purchased);
}

function getHeatGainPerCatch(meta: MetaState): number {
  const sinkRank = meta.upgrades.heat_sink;
  return Math.max(0.02, HEAT_ON_CATCH * (1 - sinkRank * 0.08));
}

function getRecoveryDurationMs(profile: DifficultyProfile, meta: MetaState): number {
  const patchRank = meta.upgrades.recovery_patch;
  return Math.max(300, Math.round(profile.missRecoveryMs * (1 - patchRank * 0.1)));
}

function getCommandCooldownMs(commandId: CommandId, meta: MetaState): number {
  const busRank = meta.upgrades.command_bus;
  const cooldownMult = Math.max(0.2, 1 - busRank * 0.12);
  return Math.round(BASE_COMMAND_COOLDOWN_MS[commandId] * cooldownMult);
}

function getUpgradeCost(spec: UpgradeSpec, profile: DifficultyProfile): number {
  return Math.max(1, Math.round(spec.baseCost * profile.upgradeCostMult));
}

function currentSpawnIntervalMs(state: GameState, profile: DifficultyProfile): number {
  let phaseMult = 1;
  if (state.phase === "overclock") {
    phaseMult = 0.85;
  } else if (state.phase === "shutdown") {
    phaseMult = 0.72;
  }
  const heatMult = Math.max(0.5, 1 - state.heat * 0.22);
  return Math.max(900, Math.round(profile.spawnIntervalMs * phaseMult * heatMult));
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

function chipsEarnedForRun(state: GameState, profile: DifficultyProfile): number {
  const base = Math.floor(state.score / 900 + state.stats.catches / 6 + state.stats.bestStreak / 2);
  return Math.max(1, Math.floor(base * profile.chipMult));
}

function runManualCollect(state: GameState): void {
  const clickBoost = state.commandBoostMs > 0 ? COMMAND_BOOST_CLICK_MULT : 1;
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
      gain: Number(gain.toFixed(3))
    }
  });
}

export class CandyBoxGame {
  private readonly seed: number;
  private readonly rng: RNG;
  private readonly metaMode: "enabled" | "disabled";
  private state: GameState;
  private difficultyProfile: DifficultyProfile;

  constructor(seedText: string, options: GameConstructorOptions = {}) {
    this.seed = seedFromText(seedText);
    this.rng = makeRng(this.seed);
    this.metaMode = options.metaMode ?? "enabled";
    const difficulty = options.difficulty ?? DEFAULT_DIFFICULTY_ID;
    this.difficultyProfile = profileFor(difficulty);
    const normalizedMeta = this.metaMode === "disabled" ? cloneMeta(META_DISABLED_META) : normalizeMeta(options.meta);
    this.state = makeInitialState(this.seed, this.difficultyProfile, normalizedMeta);
  }

  private resetRun(): void {
    const meta = this.metaMode === "disabled" ? cloneMeta(META_DISABLED_META) : cloneMeta(this.state.meta);
    const oldTheme = this.state.theme;
    const panels = clonePanels(this.state.uiPanelsOpen);
    this.state = makeInitialState(this.seed, this.difficultyProfile, meta);
    this.state.theme = oldTheme;
    this.state.uiPanelsOpen = panels;
    pushEvent(this.state, {
      type: "run_reset",
      tick: this.state.tick,
      data: {
        difficulty: this.state.difficulty
      }
    });
  }

  private handleMissPenalty(reason: string, bonusType: BonusType): void {
    if (this.state.syncShield > 0) {
      this.state.syncShield -= 1;
      pushEvent(this.state, {
        type: "sync_shield_used",
        tick: this.state.tick,
        data: {
          reason,
          bonusType,
          shieldsLeft: this.state.syncShield
        }
      });
      return;
    }

    this.state.multiplier = BASE_MULTIPLIER;
    this.state.streak = 0;
    this.state.recoveryMs = getRecoveryDurationMs(this.difficultyProfile, this.state.meta);
    this.state.fx.missFlashMs = 180;
    this.state.fx.shakeMs = 120;
    this.state.stats.misses += 1;
    pushEvent(this.state, {
      type: "bonus_miss_reset",
      tick: this.state.tick,
      data: { reason, bonusType }
    });
  }

  private spawnBonusTarget(): void {
    const cycle = this.state.bonusTarget.cycle;
    let x = CANVAS_WIDTH * 0.5;
    if (cycle === 1) {
      x = CANVAS_WIDTH * 0.84;
    }
    if (cycle > 1) {
      x = 80 + this.rng.next() * (CANVAS_WIDTH - 160);
    }

    this.state.bonusTarget.active = true;
    this.state.bonusTarget.x = x;
    this.state.bonusTarget.y = -24;
    this.state.bonusTarget.vy = this.difficultyProfile.bonusFallSpeed;
    this.state.bonusTarget.cycle += 1;
    this.state.bonusTarget.type = cycleBonusType(this.state.bonusTarget.cycle, this.rng);

    const nextInterval = currentSpawnIntervalMs(this.state, this.difficultyProfile);
    this.state.spawnCooldownMs = nextInterval;
    this.state.nextSpawnMs = nextInterval;
    this.state.warningActive = false;

    pushEvent(this.state, {
      type: "bonus_spawn",
      tick: this.state.tick,
      data: {
        cycle: this.state.bonusTarget.cycle,
        bonusType: this.state.bonusTarget.type
      }
    });
  }

  private resolveCatch(): void {
    const catcherLeft = this.state.catcherX - this.state.catcherWidth / 2;
    const catcherRight = this.state.catcherX + this.state.catcherWidth / 2;
    const target = this.state.bonusTarget;
    const caught = target.x >= catcherLeft && target.x <= catcherRight;

    if (caught) {
      this.state.streak = Number((this.state.streak + STREAK_STEP).toFixed(2));
      this.state.multiplier = Math.min(MAX_MULTIPLIER, Number((this.state.multiplier + STREAK_STEP).toFixed(2)));
      this.state.heat = Math.min(1, Number((this.state.heat + getHeatGainPerCatch(this.state.meta)).toFixed(4)));
      this.state.stats.bestStreak = Math.max(this.state.stats.bestStreak, this.state.streak);

      const narrowModeBoost = isUpgradePurchased(this.state, "narrow_mode") ? 2 : 1;
      const bonusPoints = Math.round(20 * this.state.multiplier * narrowModeBoost);
      this.state.score += bonusPoints;
      this.state.candies += bonusPoints * 0.2;
      this.state.scoreBreakdown.bonus += bonusPoints;
      this.state.stats.catches += 1;
      this.state.fx.catchFlashMs = 110;
      this.state.fx.shakeMs = Math.max(this.state.fx.shakeMs, 90);

      pushEvent(this.state, {
        type: "bonus_hit",
        tick: this.state.tick,
        data: {
          multi: Number(this.state.multiplier.toFixed(2)),
          bonusType: target.type
        }
      });

      if (target.type === "blue") {
        this.state.blueSlowMs = BONUS_BLUE_SLOW_MS;
        pushEvent(this.state, {
          type: "bonus_effect_blue",
          tick: this.state.tick,
          data: { ms: BONUS_BLUE_SLOW_MS }
        });
      }

      if (target.type === "red") {
        this.state.redBoostMs = BONUS_RED_BOOST_MS;
        pushEvent(this.state, {
          type: "bonus_effect_red",
          tick: this.state.tick,
          data: { ms: BONUS_RED_BOOST_MS }
        });
      }
    } else {
      this.handleMissPenalty("missed_lane", target.type);
    }

    target.active = false;
    target.y = -24;
    const nextInterval = currentSpawnIntervalMs(this.state, this.difficultyProfile);
    this.state.spawnCooldownMs = nextInterval;
    this.state.nextSpawnMs = nextInterval;
  }

  private purchaseUpgradeInternal(upgradeId: string): boolean {
    const spec = getSpecById(upgradeId);
    if (!spec) {
      return false;
    }

    const slot = this.state.upgrades.find((entry) => entry.id === upgradeId);
    if (!slot || slot.purchased) {
      return false;
    }

    const cost = getUpgradeCost(spec, this.difficultyProfile);
    if (this.state.candies < cost) {
      pushEvent(this.state, {
        type: "upgrade_blocked",
        tick: this.state.tick,
        data: {
          upgrade: spec.id,
          cost,
          candies: Number(this.state.candies.toFixed(2))
        }
      });
      return false;
    }

    this.state.candies -= cost;
    this.state.candiesPerSecond += spec.cps * this.difficultyProfile.baseRateMult;
    this.state.candiesPerClick += spec.cpc * this.difficultyProfile.baseRateMult;
    slot.purchased = true;

    if (spec.catcherWidthScale) {
      const metaBaseWidth = BASE_CATCHER_WIDTH + this.state.meta.upgrades.catcher_rails * 8;
      this.state.catcherWidth = Math.max(48, Math.round(metaBaseWidth * spec.catcherWidthScale));
      pushEvent(this.state, {
        type: "risk_toggle",
        tick: this.state.tick,
        data: {
          upgrade: spec.id,
          catcherWidth: this.state.catcherWidth
        }
      });
    }

    this.state.fx.purchaseFlashMs = 180;
    pushEvent(this.state, {
      type: "upgrade_bought",
      tick: this.state.tick,
      data: {
        upgrade: spec.id,
        cost
      }
    });
    return true;
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

    const cmd = command as CommandId;
    const known = cmd === "boost" || cmd === "sync" || cmd === "dump";
    if (!known) {
      this.state.command.lastResult = "error";
      pushEvent(this.state, {
        type: "command_error",
        tick: this.state.tick,
        data: { cmd: command }
      });
      return;
    }

    if (this.state.command.cooldownMs[cmd] > 0) {
      this.state.command.lastResult = "cooldown";
      pushEvent(this.state, {
        type: "command_cooldown",
        tick: this.state.tick,
        data: {
          cmd,
          remainingMs: Math.round(this.state.command.cooldownMs[cmd])
        }
      });
      return;
    }

    if (cmd === "boost") {
      this.state.commandBoostMs = COMMAND_BOOST_MS;
    } else if (cmd === "sync") {
      this.state.syncShield = Math.min(3, this.state.syncShield + 1);
      this.state.recoveryMs = 0;
    } else if (cmd === "dump") {
      const payout = Math.max(
        0,
        Math.round((this.state.candies * 0.15 + this.state.heat * 40) * this.state.multiplier)
      );
      this.state.score += payout;
      this.state.scoreBreakdown.command += payout;
    }

    this.state.command.cooldownMs[cmd] = getCommandCooldownMs(cmd, this.state.meta);
    this.state.command.used[cmd] += 1;
    this.state.command.lastResult = "ok";

    pushEvent(this.state, {
      type: "command_success",
      tick: this.state.tick,
      data: { cmd }
    });
  }

  private applyTutorialHint(): void {
    if (this.state.elapsedMs < BOOT_PHASE_MS) {
      this.state.tutorialHint = "Move catcher with mouse/touch or arrows. Press Space to COLLECT.";
    } else if (this.state.elapsedMs < 30000) {
      this.state.tutorialHint = "Catch bonus candies to build streak. Miss resets multiplier.";
    } else {
      this.state.tutorialHint = "Use BOOST, SYNC, DUMP commands. Spend chips between runs.";
    }
  }

  private finalizeRunIfNeeded(): void {
    if (this.state.elapsedMs < this.state.runDurationMs || this.state.mode === "game_over") {
      return;
    }

    this.state.mode = "game_over";
    this.state.timeLeftMs = 0;
    this.state.tutorialHint = "TERMINAL SHUTDOWN - spend chips and start another run.";

    const chips = chipsEarnedForRun(this.state, this.difficultyProfile);
    this.state.chipsEarnedThisRun = chips;
    if (this.metaMode === "enabled") {
      this.state.meta.chips += chips;
      this.state.meta.lifetimeChips += chips;
    }

    pushEvent(this.state, {
      type: "chips_awarded",
      tick: this.state.tick,
      data: {
        chips,
        total: this.state.meta.chips
      }
    });

    pushEvent(this.state, {
      type: "game_over_time_cap",
      tick: this.state.tick,
      data: {
        runDurationMs: this.state.runDurationMs,
        difficulty: this.state.difficulty
      }
    });
  }

  start(): void {
    if (this.state.mode === "title") {
      this.state.mode = "playing";
      pushEvent(this.state, {
        type: "run_started",
        tick: this.state.tick,
        data: {
          difficulty: this.state.difficulty,
          runDurationMs: this.state.runDurationMs
        }
      });
    }
  }

  reset(): void {
    this.resetRun();
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

  setUiPanelsOpen(panels: UiPanelsOpen): void {
    this.state.uiPanelsOpen = clonePanels(panels);
  }

  setThemeByIndex(index: number): void {
    const theme = THEMES[index];
    if (!theme) {
      return;
    }
    this.state.theme = theme.id;
    pushEvent(this.state, {
      type: "theme_change",
      tick: this.state.tick,
      data: { theme: theme.id }
    });
  }

  setDifficulty(difficulty: DifficultyId): void {
    const profile = profileFor(difficulty);
    this.difficultyProfile = profile;
    const meta = this.metaMode === "disabled" ? cloneMeta(META_DISABLED_META) : cloneMeta(this.state.meta);
    const oldTheme = this.state.theme;
    const oldPanels = clonePanels(this.state.uiPanelsOpen);
    this.state = makeInitialState(this.seed, profile, meta);
    this.state.theme = oldTheme;
    this.state.uiPanelsOpen = oldPanels;

    pushEvent(this.state, {
      type: "difficulty_change",
      tick: this.state.tick,
      data: {
        difficulty,
        runDurationMs: profile.runDurationMs
      }
    });
  }

  getDifficultyProfiles(): DifficultyProfile[] {
    return DIFFICULTY_PROFILES.map((item) => ({ ...item }));
  }

  getUpgradeCostInfo(): UpgradeCostInfo[] {
    return UPGRADE_SPECS.map((spec) => {
      const slot = this.state.upgrades.find((entry) => entry.id === spec.id);
      const purchased = Boolean(slot?.purchased);
      const cost = getUpgradeCost(spec, this.difficultyProfile);
      const canAfford = this.state.candies >= cost;
      const effects: string[] = [];
      if (spec.cps > 0) {
        effects.push(`+${(spec.cps * this.difficultyProfile.baseRateMult).toFixed(2)} cps`);
      }
      if (spec.cpc > 0) {
        effects.push(`+${(spec.cpc * this.difficultyProfile.baseRateMult).toFixed(2)} cpc`);
      }
      if (spec.bonusValueMult) {
        effects.push(`x${spec.bonusValueMult.toFixed(1)} bonus`);
      }
      if (spec.catcherWidthScale) {
        effects.push("narrow catcher");
      }
      return {
        id: spec.id,
        label: spec.label,
        cost,
        purchased,
        canAfford,
        shortBy: purchased ? 0 : Math.max(0, Math.ceil(cost - this.state.candies)),
        effects
      };
    });
  }

  purchaseUpgrade(upgradeId: string): boolean {
    if (this.state.mode !== "playing") {
      return false;
    }
    return this.purchaseUpgradeInternal(upgradeId);
  }

  getMetaUpgradeInfo(): MetaUpgradeInfo[] {
    return PRESTIGE_UPGRADE_SPECS.map((spec) => {
      const rank = this.state.meta.upgrades[spec.id];
      const nextCost = rank >= spec.maxRank ? null : spec.costs[rank];
      return {
        id: spec.id,
        label: spec.label,
        rank,
        maxRank: spec.maxRank,
        nextCost,
        description: spec.description,
        canAfford: nextCost == null ? false : this.state.meta.chips >= nextCost
      };
    });
  }

  buyPrestigeUpgrade(id: PrestigeUpgradeId): boolean {
    if (this.metaMode === "disabled") {
      return false;
    }

    if (this.state.mode === "playing") {
      pushEvent(this.state, {
        type: "prestige_blocked",
        tick: this.state.tick,
        data: { reason: "run_active", id }
      });
      return false;
    }

    const spec = getPrestigeSpecById(id);
    const rank = this.state.meta.upgrades[id];
    if (rank >= spec.maxRank) {
      return false;
    }

    const cost = spec.costs[rank];
    if (this.state.meta.chips < cost) {
      return false;
    }

    this.state.meta.chips -= cost;
    this.state.meta.upgrades[id] = rank + 1;

    pushEvent(this.state, {
      type: "prestige_upgrade_bought",
      tick: this.state.tick,
      data: {
        id,
        rank: this.state.meta.upgrades[id],
        cost
      }
    });

    this.resetRun();
    return true;
  }

  resetMeta(): void {
    if (this.metaMode === "disabled") {
      return;
    }
    this.state.meta = cloneMeta(DEFAULT_META_STATE);
    pushEvent(this.state, {
      type: "meta_reset",
      tick: this.state.tick
    });
    this.resetRun();
  }

  setCommandBuffer(value: string): void {
    this.state.command.buffer = value.trim().toLowerCase().slice(-14);
  }

  submitCommandText(value?: string): void {
    if (value != null) {
      this.state.command.buffer = value.trim().toLowerCase().slice(-14);
    }
    if (this.state.mode !== "playing") {
      return;
    }
    this.submitCommand();
  }

  collect(): void {
    if (this.state.mode !== "playing") {
      return;
    }
    runManualCollect(this.state);
  }

  onPointerMove(x: number): void {
    const left = this.state.playfieldRect.x + 20;
    const right = this.state.playfieldRect.x + this.state.playfieldRect.w - 20;
    this.state.catcherX = clamp(x, left, right);
  }

  onPointerDown(_x: number, _y: number): void {
    // Intentionally no in-canvas UI actions in v2.1.
  }

  onKeyDown(key: string): void {
    const normalized = key.toLowerCase();
    if (this.state.mode === "title" && (normalized === "enter" || normalized === " ")) {
      this.start();
      return;
    }

    if (normalized === "p") {
      this.togglePause();
      return;
    }

    if (normalized === "r") {
      this.reset();
      return;
    }

    if (normalized === "1" || normalized === "2" || normalized === "3") {
      this.setThemeByIndex(Number(normalized) - 1);
      return;
    }

    if (this.state.mode !== "playing") {
      return;
    }

    if (normalized === "arrowleft" || normalized === "a") {
      this.onPointerMove(this.state.catcherX - 28);
      return;
    }
    if (normalized === "arrowright" || normalized === "d") {
      this.onPointerMove(this.state.catcherX + 28);
      return;
    }
    if (normalized === " " || normalized === "space" || normalized === "spacebar") {
      this.collect();
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
    }
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
    this.state.timeLeftMs = Math.max(0, this.state.runDurationMs - this.state.elapsedMs);
    this.state.phase = phaseForElapsed(this.state.elapsedMs, this.state.runDurationMs);
    this.applyTutorialHint();

    for (const commandId of Object.keys(this.state.command.cooldownMs) as CommandId[]) {
      this.state.command.cooldownMs[commandId] = Math.max(0, this.state.command.cooldownMs[commandId] - dtMs);
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
        this.spawnBonusTarget();
      }
    } else {
      let fallSpeed = this.difficultyProfile.bonusFallSpeed * (1 + this.state.heat * BONUS_HEAT_SPEEDUP);
      if (this.state.phase === "overclock") {
        fallSpeed *= 1.16;
      }
      if (this.state.phase === "shutdown") {
        fallSpeed *= 1.24;
      }
      if (this.state.blueSlowMs > 0) {
        fallSpeed *= BONUS_BLUE_SLOW_MULT;
      }

      this.state.bonusTarget.y += fallSpeed * dtSec;
      if (
        this.state.bonusTarget.y + 14 >= CATCHER_Y &&
        this.state.bonusTarget.y - 14 <= CATCHER_Y + CATCHER_HEIGHT
      ) {
        this.resolveCatch();
      } else if (this.state.bonusTarget.y > CANVAS_HEIGHT + 20) {
        this.state.bonusTarget.active = false;
        const nextInterval = currentSpawnIntervalMs(this.state, this.difficultyProfile);
        this.state.spawnCooldownMs = nextInterval;
        this.state.nextSpawnMs = nextInterval;
        this.state.warningActive = false;
        this.handleMissPenalty("fell_out", this.state.bonusTarget.type);
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

    const passiveGain = this.state.candiesPerSecond * cpsMult * dtSec;
    this.state.candies += passiveGain;
    this.state.scoreBreakdown.passive += passiveGain;

    this.finalizeRunIfNeeded();
  }

  getState(): GameState {
    return {
      ...this.state,
      bonusTarget: { ...this.state.bonusTarget },
      playfieldRect: { ...this.state.playfieldRect },
      uiPanelsOpen: clonePanels(this.state.uiPanelsOpen),
      upgrades: this.state.upgrades.map((entry) => ({ ...entry })),
      pendingEvents: this.state.pendingEvents.map((entry) => ({ ...entry, data: entry.data ? { ...entry.data } : undefined })),
      stats: { ...this.state.stats },
      scoreBreakdown: { ...this.state.scoreBreakdown },
      command: {
        ...this.state.command,
        cooldownMs: { ...this.state.command.cooldownMs },
        used: { ...this.state.command.used }
      },
      fx: { ...this.state.fx },
      meta: cloneMeta(this.state.meta)
    };
  }

  getMetaState(): MetaState {
    return cloneMeta(this.state.meta);
  }

  consumeSnapshot(): string {
    const payload = {
      mode: this.state.mode,
      phase: this.state.phase,
      difficulty: this.state.difficulty,
      runDurationMs: this.state.runDurationMs,
      coordinateSystem: "origin at top-left, +x right, +y down",
      title: TITLE_TEXT,
      score: this.state.score,
      candies: Number(this.state.candies.toFixed(2)),
      candiesPerSecond: Number(this.state.candiesPerSecond.toFixed(3)),
      candiesPerClick: Number(this.state.candiesPerClick.toFixed(3)),
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
      chipsEarnedThisRun: this.state.chipsEarnedThisRun,
      meta: cloneMeta(this.state.meta),
      theme: this.state.theme,
      seed: this.state.seed,
      elapsedMs: Math.round(this.state.elapsedMs),
      playfieldRect: { ...this.state.playfieldRect },
      uiPanelsOpen: clonePanels(this.state.uiPanelsOpen),
      pendingEvents: this.state.pendingEvents.map((entry) => ({ ...entry, data: entry.data ? { ...entry.data } : undefined }))
    };

    this.state.pendingEvents = [];
    return JSON.stringify(payload);
  }
}
