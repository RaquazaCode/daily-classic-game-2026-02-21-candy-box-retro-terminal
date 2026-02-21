import { CANVAS_HEIGHT, CANVAS_WIDTH, CANDY_BUTTON, CATCHER_HEIGHT, CATCHER_Y, START_BUTTON, TITLE_TEXT, UPGRADE_BUTTONS } from "./constants";
import type { GameState } from "./types";

function drawPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = "#031207";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#1eff6b";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  ratio: number,
  fill: string,
  track = "#062413"
): void {
  ctx.fillStyle = track;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, Math.max(0, Math.min(1, ratio)) * w, h);
  ctx.strokeStyle = "#1eff6b";
  ctx.strokeRect(x, y, w, h);
}

function drawUpgradeCard(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.font = "16px monospace";
  for (const upgrade of UPGRADE_BUTTONS) {
    const slot = state.upgrades.find((entry) => entry.id === upgrade.id);
    const purchased = Boolean(slot?.purchased);
    const canAfford = state.candies >= upgrade.cost;
    ctx.fillStyle = purchased ? "#17391f" : canAfford ? "#0b1e12" : "#07150d";
    ctx.fillRect(upgrade.x, upgrade.y, upgrade.w, upgrade.h);
    ctx.strokeStyle = purchased ? "#53ff9a" : canAfford ? "#1eff6b" : "#2b6a42";
    ctx.strokeRect(upgrade.x, upgrade.y, upgrade.w, upgrade.h);
    ctx.fillStyle = purchased ? "#53ff9a" : canAfford ? "#d8ffd6" : "#8bb79a";
    ctx.fillText(upgrade.label, upgrade.x + 12, upgrade.y + 28);
    ctx.fillText(purchased ? "PURCHASED" : `Cost ${upgrade.cost} candy`, upgrade.x + 12, upgrade.y + 54);
    if (!purchased) {
      const effects = [];
      if (upgrade.cps > 0) effects.push(`+${upgrade.cps.toFixed(1)} cps`);
      if (upgrade.cpc > 0) effects.push(`+${upgrade.cpc.toFixed(1)} cpc`);
      if (upgrade.id === "narrow_mode") effects.push("x2 bonus | narrow");
      ctx.fillText(effects.join(" | "), upgrade.x + 12, upgrade.y + 76);
      if (!canAfford) {
        const shortBy = Math.ceil(upgrade.cost - state.candies);
        ctx.fillStyle = "#72bf8f";
        ctx.fillText(`SHORT ${shortBy}`, upgrade.x + 150, upgrade.y + 54);
      }
    }
  }
}

function drawCommandPanel(ctx: CanvasRenderingContext2D, state: GameState): void {
  const x = 30;
  const y = 496;
  const w = 230;
  const h = 96;
  drawPanel(ctx, x, y, w, h);
  ctx.fillStyle = "#d8ffd6";
  ctx.font = "14px monospace";
  ctx.fillText("COMMAND", x + 10, y + 22);
  const status =
    state.command.lastResult === "ok"
      ? "OK"
      : state.command.lastResult === "cooldown"
        ? "COOLDOWN"
        : state.command.lastResult === "error"
          ? "ERR"
          : "--";
  ctx.fillText(`LAST ${state.command.lastSubmitted || "--"} ${status}`, x + 10, y + 42);
  ctx.fillText(`> ${(state.command.buffer || "").toUpperCase()}_`, x + 10, y + 62);
  ctx.fillText(
    `B ${Math.ceil(state.command.cooldownMs.boost / 1000)} S ${Math.ceil(state.command.cooldownMs.sync / 1000)} D ${Math.ceil(state.command.cooldownMs.dump / 1000)}`,
    x + 10,
    y + 82
  );
}

function drawBootSequence(ctx: CanvasRenderingContext2D, state: GameState): void {
  const bootLines = [
    "MOUNTING_STORAGE ... OK",
    "INITIALIZING_CANDY_KERNEL ... OK",
    "SYNCING_CATCHER_DRIVERS ... OK",
    "READY"
  ];
  const visibleChars = Math.floor(state.bootTextMs / 28);
  drawPanel(ctx, 180, 150, 600, 320);
  ctx.fillStyle = "#c8ffd0";
  ctx.font = "30px monospace";
  ctx.fillText("BOOTING CANDY OS v2.0", 220, 205);
  ctx.font = "18px monospace";
  let cursor = 0;
  for (let i = 0; i < bootLines.length; i += 1) {
    const line = bootLines[i];
    const shown = Math.max(0, Math.min(line.length, visibleChars - cursor));
    if (shown > 0) {
      ctx.fillText(line.slice(0, shown), 220, 250 + i * 34);
    }
    cursor += line.length + 4;
  }
  ctx.fillStyle = "#8be8a0";
  ctx.font = "20px monospace";
  ctx.fillText("Press ENTER or START RUN", 280, 430);
}

function drawCrtOverlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.14)";
    ctx.fillRect(0, y, CANVAS_WIDTH, 1);
  }

  const flicker = 0.96 + (Math.sin((state.elapsedMs + state.seed) * 0.018) * 0.5 + 0.5) * 0.05;
  ctx.fillStyle = `rgba(0, 24, 8, ${(1 - flicker).toFixed(3)})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "rgba(0, 255, 120, 0.03)";
  for (let i = 0; i < 160; i += 1) {
    const x = (i * 57 + state.tick * 11 + state.seed) % CANVAS_WIDTH;
    const y = (i * 29 + state.tick * 7 + state.seed) % CANVAS_HEIGHT;
    ctx.fillRect(x, y, 2, 2);
  }
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  const shakeMagnitude = state.fx.shakeMs > 0 ? Math.min(5, 1 + state.fx.shakeMs / 40) : 0;
  const shakeX = shakeMagnitude > 0 ? Math.sin(state.elapsedMs * 0.3) * shakeMagnitude : 0;
  const shakeY = shakeMagnitude > 0 ? Math.cos(state.elapsedMs * 0.27) * shakeMagnitude : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#020905";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.strokeStyle = "#0e4822";
  ctx.lineWidth = 1;
  for (let i = 0; i <= CANVAS_WIDTH; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let i = 0; i <= CANVAS_HEIGHT; i += 24) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(CANVAS_WIDTH, i);
    ctx.stroke();
  }

  ctx.fillStyle = "#a8ffb0";
  ctx.font = "24px monospace";
  ctx.shadowColor = "rgba(0, 255, 140, 0.45)";
  ctx.shadowBlur = 4;
  ctx.fillText(TITLE_TEXT, 30, 44);
  ctx.shadowBlur = 0;

  ctx.font = "20px monospace";
  ctx.fillStyle = "#d8ffd6";
  ctx.fillText(`SCORE ${state.score}`, 30, 90);
  ctx.fillText(`CANDY ${state.candies.toFixed(1)}`, 30, 124);
  ctx.fillText(`CPS ${state.candiesPerSecond.toFixed(2)}`, 30, 158);
  ctx.fillText(`CPC ${state.candiesPerClick.toFixed(2)}`, 30, 192);
  ctx.fillText(`MULTI x${state.multiplier.toFixed(2)}`, 30, 226);

  ctx.font = "16px monospace";
  ctx.fillText(`PHASE ${state.phase.toUpperCase()}`, 30, 252);
  ctx.fillText(`STREAK ${state.streak.toFixed(1)} | HEAT ${(state.heat * 100).toFixed(0)}%`, 30, 274);

  ctx.font = "14px monospace";
  ctx.fillText(`TIME ${Math.ceil(state.timeLeftMs / 1000)}s`, 300, 84);
  drawBar(ctx, 300, 92, 240, 12, state.timeLeftMs / 120000, state.timeLeftMs < 30000 ? "#ff5555" : "#1eff6b");
  ctx.fillText(`BONUS ETA ${(state.nextSpawnMs / 1000).toFixed(1)}s`, 300, 120);
  drawBar(
    ctx,
    300,
    128,
    240,
    12,
    (3000 - Math.min(3000, state.nextSpawnMs)) / 3000,
    state.warningActive ? "#ff9955" : "#32ffaa"
  );
  ctx.fillText(`SYNC SHIELD ${state.syncShield}`, 300, 154);
  drawBar(ctx, 300, 162, 240, 10, state.streak / 5, "#7aff9f");
  drawBar(ctx, 300, 178, 240, 10, state.heat, "#48d0ff");

  drawPanel(ctx, CANDY_BUTTON.x, CANDY_BUTTON.y, CANDY_BUTTON.w, CANDY_BUTTON.h);
  ctx.fillStyle = "#1eff6b";
  ctx.fillRect(CANDY_BUTTON.x + 120, CANDY_BUTTON.y + 26, 160, 88);
  ctx.fillStyle = "#02120a";
  ctx.font = "26px monospace";
  ctx.fillText("COLLECT", CANDY_BUTTON.x + 132, CANDY_BUTTON.y + 78);

  ctx.fillStyle = "#1eff6b";
  ctx.fillRect(state.catcherX - state.catcherWidth / 2, CATCHER_Y, state.catcherWidth, CATCHER_HEIGHT);

  if (state.bonusTarget.active) {
    ctx.fillStyle = state.bonusTarget.type === "blue" ? "#4dbdff" : state.bonusTarget.type === "red" ? "#ff5959" : "#ffa63d";
    ctx.beginPath();
    ctx.arc(state.bonusTarget.x, state.bonusTarget.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff5d6";
    ctx.stroke();
  }

  if (state.fx.catchFlashMs > 0) {
    const burstCount = 12;
    for (let i = 0; i < burstCount; i += 1) {
      const angle = (Math.PI * 2 * i) / burstCount;
      const radius = 12 + (state.fx.catchFlashMs / 110) * 24;
      ctx.fillStyle = "rgba(48, 255, 164, 0.65)";
      ctx.fillRect(
        state.catcherX + Math.cos(angle) * radius,
        CATCHER_Y - 20 + Math.sin(angle) * radius,
        3,
        3
      );
    }
  }

  drawUpgradeCard(ctx, state);
  drawCommandPanel(ctx, state);

  ctx.font = "14px monospace";
  ctx.fillStyle = "#8be8a0";
  ctx.fillText(state.tutorialHint, 30, 610);
  ctx.fillText("P pause/resume | R reset run | ENTER submit command", 520, 610);

  if (state.mode === "title") {
    drawBootSequence(ctx, state);
    drawPanel(ctx, START_BUTTON.x, START_BUTTON.y, START_BUTTON.w, START_BUTTON.h);
    ctx.fillStyle = "#c8ffd0";
    ctx.font = "30px monospace";
    ctx.fillText("START RUN", START_BUTTON.x + 74, START_BUTTON.y + 47);
  } else if (state.mode === "paused") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#d8ffd6";
    ctx.font = "34px monospace";
    ctx.fillText("PAUSED", 390, 320);
  } else if (state.mode === "game_over") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = "#d8ffd6";
    ctx.font = "34px monospace";
    ctx.fillText("SESSION COMPLETE", 295, 310);
    ctx.font = "22px monospace";
    ctx.fillText("Press R to restart", 370, 350);
  }

  if (state.timeLeftMs <= 30000 && state.mode === "playing") {
    const pulse = 0.2 + (Math.sin(state.elapsedMs * 0.02) * 0.5 + 0.5) * 0.25;
    ctx.fillStyle = `rgba(255, 80, 80, ${pulse.toFixed(3)})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 8);
    ctx.fillRect(0, CANVAS_HEIGHT - 8, CANVAS_WIDTH, 8);
  }

  if (state.fx.purchaseFlashMs > 0) {
    const alpha = Math.min(0.25, state.fx.purchaseFlashMs / 720);
    ctx.fillStyle = `rgba(0, 255, 120, ${alpha.toFixed(3)})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  if (state.fx.missFlashMs > 0) {
    const alpha = Math.min(0.35, state.fx.missFlashMs / 520);
    ctx.fillStyle = `rgba(255, 40, 40, ${alpha.toFixed(3)})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  drawCrtOverlay(ctx, state);
  ctx.restore();
}
