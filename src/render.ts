import { CANVAS_HEIGHT, CANVAS_WIDTH, CATCHER_HEIGHT, CATCHER_Y, THEMES, TITLE_TEXT } from "./constants";
import type { GameState, ThemeSpec } from "./types";

function getTheme(themeId: GameState["theme"]): ThemeSpec {
  return THEMES.find((theme) => theme.id === themeId) ?? THEMES[0];
}

function drawGrid(ctx: CanvasRenderingContext2D, theme: ThemeSpec): void {
  ctx.strokeStyle = theme.grid;
  ctx.lineWidth = 1;
  for (let x = 0; x <= CANVAS_WIDTH; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
}

function drawTopTelemetry(ctx: CanvasRenderingContext2D, state: GameState, theme: ThemeSpec): void {
  ctx.fillStyle = theme.dim;
  ctx.font = "18px monospace";
  ctx.fillText(`${TITLE_TEXT}`, 24, 30);

  ctx.font = "15px monospace";
  const left = `SC ${state.score} | CD ${state.candies.toFixed(1)} | ST ${state.streak.toFixed(1)} | HX ${(state.heat * 100).toFixed(0)}%`;
  const right = `${state.difficulty.toUpperCase()} | T ${(state.timeLeftMs / 1000).toFixed(0)}s | ETA ${(state.nextSpawnMs / 1000).toFixed(1)}s`;
  ctx.fillText(left, 24, 54);
  ctx.fillText(right, 520, 54);

  if (state.warningActive && state.mode === "playing") {
    const pulse = 0.25 + (Math.sin(state.elapsedMs * 0.02) * 0.5 + 0.5) * 0.2;
    ctx.fillStyle = `rgba(255, 80, 80, ${pulse.toFixed(3)})`;
    ctx.fillRect(0, 62, CANVAS_WIDTH, 6);
  }
}

function drawPlayfieldBoundary(ctx: CanvasRenderingContext2D, state: GameState, theme: ThemeSpec): void {
  const { x, y, w, h } = state.playfieldRect;
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 8, y + 70, w - 16, h - 92);

  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(18, CATCHER_Y + CATCHER_HEIGHT + 5);
  ctx.lineTo(CANVAS_WIDTH - 18, CATCHER_Y + CATCHER_HEIGHT + 5);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawBootSequence(ctx: CanvasRenderingContext2D, state: GameState, theme: ThemeSpec): void {
  const lines = [
    "BOOTING CANDY OS v2.1",
    "LOADING PROFILE ... OK",
    `DIFFICULTY ${state.difficulty.toUpperCase()} ... OK`,
    "READY"
  ];
  const visibleChars = Math.floor(state.bootTextMs / 26);

  ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
  ctx.fillRect(120, 150, 720, 320);
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(120, 150, 720, 320);

  ctx.fillStyle = theme.dim;
  ctx.font = "28px monospace";
  let cursor = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const shown = Math.max(0, Math.min(line.length, visibleChars - cursor));
    if (shown > 0) {
      ctx.fillText(line.slice(0, shown), 170, 225 + i * 52);
    }
    cursor += line.length + 5;
  }

  ctx.font = "20px monospace";
  ctx.fillStyle = theme.bright;
  ctx.fillText("Press ENTER or click Start in left panel", 195, 430);
}

function drawCrtOverlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  for (let y = 0; y < CANVAS_HEIGHT; y += 4) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.13)";
    ctx.fillRect(0, y, CANVAS_WIDTH, 1);
  }

  const flicker = 0.95 + (Math.sin((state.elapsedMs + state.seed) * 0.02) * 0.5 + 0.5) * 0.05;
  ctx.fillStyle = `rgba(0, 24, 8, ${(1 - flicker).toFixed(3)})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "rgba(0, 255, 110, 0.03)";
  for (let i = 0; i < 140; i += 1) {
    const x = (i * 57 + state.tick * 11 + state.seed) % CANVAS_WIDTH;
    const y = (i * 29 + state.tick * 7 + state.seed) % CANVAS_HEIGHT;
    ctx.fillRect(x, y, 2, 2);
  }
}

export function renderGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  const theme = getTheme(state.theme);

  const shakeMagnitude = state.fx.shakeMs > 0 ? Math.min(5, 1 + state.fx.shakeMs / 40) : 0;
  const shakeX = shakeMagnitude > 0 ? Math.sin(state.elapsedMs * 0.3) * shakeMagnitude : 0;
  const shakeY = shakeMagnitude > 0 ? Math.cos(state.elapsedMs * 0.27) * shakeMagnitude : 0;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawGrid(ctx, theme);
  drawPlayfieldBoundary(ctx, state, theme);
  drawTopTelemetry(ctx, state, theme);

  ctx.fillStyle = theme.accent;
  ctx.fillRect(state.catcherX - state.catcherWidth / 2, CATCHER_Y, state.catcherWidth, CATCHER_HEIGHT);

  if (state.bonusTarget.active) {
    ctx.fillStyle = state.bonusTarget.type === "blue" ? "#4dbdff" : state.bonusTarget.type === "red" ? theme.alert : "#ffa63d";
    ctx.beginPath();
    ctx.arc(state.bonusTarget.x, state.bonusTarget.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff5d6";
    ctx.stroke();
  }

  if (state.fx.catchFlashMs > 0) {
    const burstCount = 10;
    for (let i = 0; i < burstCount; i += 1) {
      const angle = (Math.PI * 2 * i) / burstCount;
      const radius = 12 + (state.fx.catchFlashMs / 110) * 22;
      ctx.fillStyle = "rgba(48, 255, 164, 0.65)";
      ctx.fillRect(state.catcherX + Math.cos(angle) * radius, CATCHER_Y - 20 + Math.sin(angle) * radius, 3, 3);
    }
  }

  if (state.mode === "title") {
    drawBootSequence(ctx, state, theme);
  }

  if (state.mode === "paused") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = theme.dim;
    ctx.font = "34px monospace";
    ctx.fillText("PAUSED", 390, 320);
  }

  if (state.mode === "game_over") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.62)";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(140, 110, 680, 410);

    ctx.fillStyle = theme.dim;
    ctx.font = "34px monospace";
    ctx.fillText("TERMINAL SHUTDOWN", 250, 160);
    ctx.font = "18px monospace";
    ctx.fillText(`Score ${state.score} | Candies ${state.candies.toFixed(1)} | Chips +${state.chipsEarnedThisRun}`, 190, 214);
    ctx.fillText(`Catches ${state.stats.catches} | Misses ${state.stats.misses} | Best Streak ${state.stats.bestStreak.toFixed(1)}`, 190, 248);
    ctx.fillText(`Manual ${Math.round(state.scoreBreakdown.manual)} | Passive ${Math.round(state.scoreBreakdown.passive)} | Bonus ${Math.round(state.scoreBreakdown.bonus)} | Cmd ${Math.round(state.scoreBreakdown.command)}`, 190, 282);
    ctx.fillStyle = theme.bright;
    ctx.fillText("Spend chips in the right panel. Press R to restart.", 240, 334);
  }

  if (state.fx.purchaseFlashMs > 0) {
    const alpha = Math.min(0.2, state.fx.purchaseFlashMs / 900);
    ctx.fillStyle = `rgba(0, 255, 120, ${alpha.toFixed(3)})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  if (state.fx.missFlashMs > 0) {
    const alpha = Math.min(0.28, state.fx.missFlashMs / 640);
    ctx.fillStyle = `rgba(255, 40, 40, ${alpha.toFixed(3)})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  drawCrtOverlay(ctx, state);

  ctx.restore();
}
