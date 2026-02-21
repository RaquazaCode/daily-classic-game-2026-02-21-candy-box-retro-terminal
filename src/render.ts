import { CANVAS_HEIGHT, CANVAS_WIDTH, CANDY_BUTTON, CATCHER_HEIGHT, CATCHER_WIDTH, CATCHER_Y, START_BUTTON, TITLE_TEXT, UPGRADE_BUTTONS } from "./constants";
import type { GameState } from "./types";

function drawPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = "#031207";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#1eff6b";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}

function drawUpgradeCard(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.font = "16px monospace";
  for (const upgrade of UPGRADE_BUTTONS) {
    const slot = state.upgrades.find((entry) => entry.id === upgrade.id);
    const purchased = Boolean(slot?.purchased);
    ctx.fillStyle = purchased ? "#17391f" : "#0b1e12";
    ctx.fillRect(upgrade.x, upgrade.y, upgrade.w, upgrade.h);
    ctx.strokeStyle = purchased ? "#53ff9a" : "#1eff6b";
    ctx.strokeRect(upgrade.x, upgrade.y, upgrade.w, upgrade.h);
    ctx.fillStyle = purchased ? "#53ff9a" : "#d8ffd6";
    ctx.fillText(upgrade.label, upgrade.x + 12, upgrade.y + 28);
    ctx.fillText(purchased ? "PURCHASED" : `Cost ${upgrade.cost} candy`, upgrade.x + 12, upgrade.y + 54);
    if (!purchased) {
      const effects = [];
      if (upgrade.cps > 0) effects.push(`+${upgrade.cps.toFixed(1)} cps`);
      if (upgrade.cpc > 0) effects.push(`+${upgrade.cpc.toFixed(1)} cpc`);
      ctx.fillText(effects.join(" | "), upgrade.x + 12, upgrade.y + 76);
    }
  }
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
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
  ctx.fillText(TITLE_TEXT, 30, 44);

  ctx.font = "20px monospace";
  ctx.fillStyle = "#d8ffd6";
  ctx.fillText(`SCORE ${state.score}`, 30, 90);
  ctx.fillText(`CANDY ${state.candies.toFixed(1)}`, 30, 124);
  ctx.fillText(`CPS ${state.candiesPerSecond.toFixed(2)}`, 30, 158);
  ctx.fillText(`CPC ${state.candiesPerClick.toFixed(2)}`, 30, 192);
  ctx.fillText(`MULTI x${state.multiplier.toFixed(2)}`, 30, 226);

  drawPanel(ctx, CANDY_BUTTON.x, CANDY_BUTTON.y, CANDY_BUTTON.w, CANDY_BUTTON.h);
  ctx.fillStyle = "#1eff6b";
  ctx.fillRect(CANDY_BUTTON.x + 120, CANDY_BUTTON.y + 26, 160, 88);
  ctx.fillStyle = "#02120a";
  ctx.font = "26px monospace";
  ctx.fillText("COLLECT", CANDY_BUTTON.x + 132, CANDY_BUTTON.y + 78);

  ctx.fillStyle = "#1eff6b";
  ctx.fillRect(state.catcherX - CATCHER_WIDTH / 2, CATCHER_Y, CATCHER_WIDTH, CATCHER_HEIGHT);

  if (state.bonusTarget.active) {
    ctx.fillStyle = "#ffa63d";
    ctx.beginPath();
    ctx.arc(state.bonusTarget.x, state.bonusTarget.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff5d6";
    ctx.stroke();
  }

  drawUpgradeCard(ctx, state);

  ctx.font = "14px monospace";
  ctx.fillStyle = "#8be8a0";
  ctx.fillText("Move mouse to align catcher. Click COLLECT for manual candy.", 30, 610);
  ctx.fillText("P pause/resume | R reset run", 600, 610);

  if (state.mode === "title") {
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
}
