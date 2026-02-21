import "./style.css";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./constants";
import { CandyBoxGame } from "./game";
import { wireInput } from "./input";
import { renderGame } from "./render";

declare global {
  interface Window {
    advanceTime: (ms: number) => void;
    render_game_to_text: () => string;
  }
}

const canvas = document.querySelector<HTMLCanvasElement>("#game");
if (!canvas) {
  throw new Error("Missing #game canvas");
}
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const context = canvas.getContext("2d");
if (!context) {
  throw new Error("Canvas 2D context unavailable");
}
const ctx = context;

const game = new CandyBoxGame("2026-02-21-candy-box-retro-terminal");
wireInput(canvas, game);

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

function frame(ts: number): void {
  const delta = Math.min(200, ts - previousTs);
  previousTs = ts;
  step(delta);
  renderGame(ctx, game.getState());
  requestAnimationFrame(frame);
}

window.advanceTime = (ms: number) => {
  const total = Math.max(0, ms);
  const loops = Math.max(1, Math.round(total / FIXED_STEP_MS));
  for (let i = 0; i < loops; i += 1) {
    game.update(FIXED_STEP_MS);
  }
  renderGame(ctx, game.getState());
};

window.render_game_to_text = () => game.consumeSnapshot();

const params = new URLSearchParams(window.location.search);
if (params.get("scripted_demo") === "1") {
  game.start();
}

renderGame(ctx, game.getState());
requestAnimationFrame(frame);
