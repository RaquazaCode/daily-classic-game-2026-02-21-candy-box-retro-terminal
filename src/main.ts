import "./style.css";
import { CANVAS_HEIGHT, CANVAS_WIDTH, DEFAULT_DIFFICULTY_ID, META_STORAGE_KEY, THEMES } from "./constants";
import { CandyBoxGame } from "./game";
import { wireInput } from "./input";
import { renderGame } from "./render";
import type { DifficultyId, MetaState, PrestigeUpgradeId } from "./types";

declare global {
  interface Window {
    advanceTime: (ms: number) => void;
    render_game_to_text: () => string;
  }
}

function q<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) {
    throw new Error(`Missing ${selector}`);
  }
  return found;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

const params = new URLSearchParams(window.location.search);
const scriptedDemo = params.get("scripted_demo") === "1";
const resetMetaFromUrl = params.get("meta_reset") === "1";
const scriptedRealtime = params.get("scripted_realtime") === "1";
const metaMode = scriptedDemo ? "disabled" : "enabled";

if (resetMetaFromUrl) {
  try {
    localStorage.removeItem(META_STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}

function safeLoadMeta(): MetaState | undefined {
  if (metaMode === "disabled") {
    return undefined;
  }

  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return undefined;
    }
    return parsed as MetaState;
  } catch {
    return undefined;
  }
}

const difficultyFromUrl = params.get("difficulty");
const initialDifficulty =
  difficultyFromUrl === "easy" || difficultyFromUrl === "medium" || difficultyFromUrl === "hard"
    ? (difficultyFromUrl as DifficultyId)
    : DEFAULT_DIFFICULTY_ID;

const game = new CandyBoxGame("2026-02-21-candy-box-retro-terminal", {
  difficulty: initialDifficulty,
  meta: safeLoadMeta(),
  metaMode
});

const appShell = q<HTMLDivElement>("#app-shell");
const canvas = q<HTMLCanvasElement>("#game");
const leftPanel = q<HTMLElement>("#left-panel");
const rightPanel = q<HTMLElement>("#right-panel");
const toggleLeftBtn = q<HTMLButtonElement>("#toggle-left");
const toggleRightBtn = q<HTMLButtonElement>("#toggle-right");
const startBtn = q<HTMLButtonElement>("#start-btn");
const collectBtn = q<HTMLButtonElement>("#collect-btn");
const statsPanel = q<HTMLDivElement>("#stats-panel");
const commandInput = q<HTMLInputElement>("#command-input");
const commandSubmitBtn = q<HTMLButtonElement>("#command-submit");
const commandFeedback = q<HTMLDivElement>("#command-feedback");
const difficultySelect = q<HTMLSelectElement>("#difficulty-select");
const themeSelect = q<HTMLSelectElement>("#theme-select");
const upgradeList = q<HTMLDivElement>("#upgrade-list");
const metaSummary = q<HTMLDivElement>("#meta-summary");
const prestigeList = q<HTMLDivElement>("#prestige-list");
const metaResetBtn = q<HTMLButtonElement>("#meta-reset");

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const context = canvas.getContext("2d");
if (!context) {
  throw new Error("Canvas 2D context unavailable");
}
const ctx = context;

let panelsOpen = {
  left: false,
  right: false
};

function applyPanels(): void {
  leftPanel.classList.toggle("dock-collapsed", !panelsOpen.left);
  rightPanel.classList.toggle("dock-collapsed", !panelsOpen.right);
  appShell.classList.toggle("has-left-open", panelsOpen.left);
  appShell.classList.toggle("has-right-open", panelsOpen.right);
  game.setUiPanelsOpen(panelsOpen);
}

function toggleLeftPanel(): void {
  panelsOpen = { ...panelsOpen, left: !panelsOpen.left };
  applyPanels();
}

function toggleRightPanel(): void {
  panelsOpen = { ...panelsOpen, right: !panelsOpen.right };
  applyPanels();
}

function setDifficultyOptions(): void {
  const profiles = game.getDifficultyProfiles();
  difficultySelect.innerHTML = profiles
    .map((profile) => `<option value="${profile.id}">${profile.label} (${Math.round(profile.runDurationMs / 1000)}s)</option>`)
    .join("");
}

function setThemeOptions(): void {
  themeSelect.innerHTML = THEMES.map((theme) => `<option value="${theme.id}">${theme.name}</option>`).join("");
}

setDifficultyOptions();
setThemeOptions();
applyPanels();

window.addEventListener(
  "keydown",
  (event) => {
    if (isEditableTarget(event.target)) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "q") {
      event.preventDefault();
      event.stopPropagation();
      toggleLeftPanel();
      return;
    }
    if (key === "e") {
      event.preventDefault();
      event.stopPropagation();
      toggleRightPanel();
    }
  },
  { capture: true }
);

wireInput(canvas, game);

toggleLeftBtn.addEventListener("click", () => {
  toggleLeftPanel();
});

toggleRightBtn.addEventListener("click", () => {
  toggleRightPanel();
});

startBtn.addEventListener("click", () => {
  game.start();
});

collectBtn.addEventListener("click", () => {
  game.collect();
});

commandInput.addEventListener("input", () => {
  game.setCommandBuffer(commandInput.value);
});

commandSubmitBtn.addEventListener("click", () => {
  game.submitCommandText(commandInput.value);
  commandInput.value = "";
  game.setCommandBuffer("");
});

commandInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    game.submitCommandText(commandInput.value);
    commandInput.value = "";
    game.setCommandBuffer("");
  }
});

difficultySelect.addEventListener("change", () => {
  const value = difficultySelect.value as DifficultyId;
  if (value === "easy" || value === "medium" || value === "hard") {
    game.setDifficulty(value);
  }
});

themeSelect.addEventListener("change", () => {
  const idx = THEMES.findIndex((theme) => theme.id === themeSelect.value);
  if (idx >= 0) {
    game.setThemeByIndex(idx);
  }
});

upgradeList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const button = target.closest<HTMLButtonElement>("button[data-upgrade-id]");
  if (!button) {
    return;
  }
  const id = button.dataset.upgradeId;
  if (id) {
    game.purchaseUpgrade(id);
  }
});

prestigeList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const button = target.closest<HTMLButtonElement>("button[data-prestige-id]");
  if (!button) {
    return;
  }
  const id = button.dataset.prestigeId as PrestigeUpgradeId | undefined;
  if (!id) {
    return;
  }
  game.buyPrestigeUpgrade(id);
});

metaResetBtn.addEventListener("click", () => {
  game.resetMeta();
});

function renderLeftUi(): void {
  const state = game.getState();
  statsPanel.innerHTML = [
    `<div class="meta-line">Mode: ${state.mode}</div>`,
    `<div class="meta-line">Difficulty: ${state.difficulty.toUpperCase()} (${Math.round(state.runDurationMs / 1000)}s)</div>`,
    `<div class="meta-line">Score: ${state.score}</div>`,
    `<div class="meta-line">Candies: ${state.candies.toFixed(2)}</div>`,
    `<div class="meta-line">CPS/CPC: ${state.candiesPerSecond.toFixed(2)} / ${state.candiesPerClick.toFixed(2)}</div>`,
    `<div class="meta-line">Multiplier: x${state.multiplier.toFixed(2)}</div>`,
    `<div class="meta-line">Streak/Heat: ${state.streak.toFixed(1)} / ${(state.heat * 100).toFixed(0)}%</div>`,
    `<div class="meta-line">Time Left: ${(state.timeLeftMs / 1000).toFixed(1)}s</div>`,
    `<div class="meta-line">Bonus ETA: ${(state.nextSpawnMs / 1000).toFixed(1)}s</div>`
  ].join("");

  const status =
    state.command.lastResult === "ok"
      ? "OK"
      : state.command.lastResult === "cooldown"
        ? "COOLDOWN"
        : state.command.lastResult === "error"
          ? "ERR"
          : "--";
  commandFeedback.textContent = `LAST ${state.command.lastSubmitted || "--"} ${status} | B ${Math.ceil(state.command.cooldownMs.boost / 1000)} S ${Math.ceil(state.command.cooldownMs.sync / 1000)} D ${Math.ceil(state.command.cooldownMs.dump / 1000)}`;

  startBtn.disabled = state.mode === "playing";
  collectBtn.disabled = state.mode !== "playing";
  commandInput.disabled = state.mode !== "playing";
  commandSubmitBtn.disabled = state.mode !== "playing";
}

function renderRightUi(): void {
  const state = game.getState();
  const upgrades = game.getUpgradeCostInfo();
  upgradeList.innerHTML = upgrades
    .map((item) => {
      const disabled = item.purchased || !item.canAfford || state.mode !== "playing";
      const subline = item.purchased ? "Purchased" : item.canAfford ? `Cost ${item.cost}` : `Cost ${item.cost} | SHORT ${item.shortBy}`;
      return `<button type="button" data-upgrade-id="${item.id}" ${disabled ? "disabled" : ""}><strong>${item.label}</strong><br/>${subline}<br/>${item.effects.join(" | ")}</button>`;
    })
    .join("");

  metaSummary.textContent = `Chips ${state.meta.chips} | Lifetime ${state.meta.lifetimeChips} | Run +${state.chipsEarnedThisRun}${metaMode === "disabled" ? " (meta disabled)" : ""}`;

  const prestige = game.getMetaUpgradeInfo();
  prestigeList.innerHTML = prestige
    .map((item) => {
      const disabled = !item.canAfford || state.mode === "playing" || metaMode === "disabled" || item.nextCost == null;
      const next = item.nextCost == null ? "MAX" : `Next ${item.nextCost}`;
      return `<button type="button" data-prestige-id="${item.id}" ${disabled ? "disabled" : ""}><strong>${item.label}</strong><br/>Rank ${item.rank}/${item.maxRank} | ${next}<br/>${item.description}</button>`;
    })
    .join("");

  metaResetBtn.disabled = metaMode === "disabled";
}

let lastMetaSerialized = "";

function persistMetaIfChanged(): void {
  if (metaMode === "disabled") {
    return;
  }
  try {
    const serialized = JSON.stringify(game.getMetaState());
    if (serialized !== lastMetaSerialized) {
      localStorage.setItem(META_STORAGE_KEY, serialized);
      lastMetaSerialized = serialized;
    }
  } catch {
    // ignore persistence failures
  }
}

const FIXED_STEP_MS = 1000 / 60;
let accumulatorMs = 0;
let previousTs = performance.now();

function step(ms: number): void {
  accumulatorMs += ms;
  while (accumulatorMs >= FIXED_STEP_MS) {
    game.update(FIXED_STEP_MS);
    accumulatorMs -= FIXED_STEP_MS;
  }
}

function syncSelectors(): void {
  const state = game.getState();
  if (difficultySelect.value !== state.difficulty) {
    difficultySelect.value = state.difficulty;
  }
  if (themeSelect.value !== state.theme) {
    themeSelect.value = state.theme;
  }
}

function frame(ts: number): void {
  const delta = Math.min(200, ts - previousTs);
  previousTs = ts;

  step(delta);
  renderGame(ctx, game.getState());
  renderLeftUi();
  renderRightUi();
  syncSelectors();
  persistMetaIfChanged();

  requestAnimationFrame(frame);
}

window.advanceTime = (ms: number) => {
  const total = Math.max(0, ms);
  const loops = Math.max(1, Math.round(total / FIXED_STEP_MS));
  for (let i = 0; i < loops; i += 1) {
    game.update(FIXED_STEP_MS);
  }
  renderGame(ctx, game.getState());
  renderLeftUi();
  renderRightUi();
  syncSelectors();
  persistMetaIfChanged();
};

window.render_game_to_text = () => game.consumeSnapshot();

if (scriptedDemo) {
  game.start();
}

renderGame(ctx, game.getState());
renderLeftUi();
renderRightUi();
syncSelectors();
persistMetaIfChanged();

if (!scriptedDemo || scriptedRealtime) {
  requestAnimationFrame(frame);
}
