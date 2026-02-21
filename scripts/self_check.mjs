import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const mainSource = readFileSync(resolve(root, "src/main.ts"), "utf8");
const gameSource = readFileSync(resolve(root, "src/game.ts"), "utf8");
const renderSource = readFileSync(resolve(root, "src/render.ts"), "utf8");
const indexSource = readFileSync(resolve(root, "index.html"), "utf8");
const actions = JSON.parse(readFileSync(resolve(root, "playwright_actions.json"), "utf8"));

function assert(condition, message) {
  if (!condition) {
    console.error(`Self-check failed: ${message}`);
    process.exit(1);
  }
}

assert(mainSource.includes("window.advanceTime"), "window.advanceTime hook missing");
assert(mainSource.includes("window.render_game_to_text"), "window.render_game_to_text hook missing");
assert(mainSource.includes("scripted_demo"), "scripted demo mode missing");
assert(gameSource.includes("bonus_miss_reset"), "bonus miss path missing");
assert(gameSource.includes("bonus_hit"), "bonus hit path missing");
assert(gameSource.includes("command_success"), "command success path missing");
assert(gameSource.includes("theme_change"), "theme toggle path missing");
assert(gameSource.includes("chips_awarded"), "prestige chip award path missing");
assert(gameSource.includes("difficulty_change"), "difficulty change path missing");
assert(gameSource.includes("candiesPerSecond"), "passive generation state missing");
assert(renderSource.includes("drawPlayfieldBoundary"), "playfield boundary rendering missing");
assert(renderSource.includes("BOOTING CANDY OS v2.1"), "boot screen rendering missing");
assert(indexSource.includes("upgrade-list"), "overlay upgrade list missing");
assert(indexSource.includes("prestige-list"), "overlay prestige list missing");
assert(Array.isArray(actions.steps) && actions.steps.length >= 4, "playwright steps missing");

console.log("Self-check passed: candy-box deterministic hooks, v2.1 overlays, difficulty, and prestige paths are present.");
