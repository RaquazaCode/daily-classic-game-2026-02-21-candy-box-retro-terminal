# Candy Box Retro Terminal - Design

## Goal
Deliver an unattended-safe Candy Box inspired idle clicker with deterministic simulation and collision-based bonus catch mechanic.

## Architecture
- `src/game.ts` is simulation authority and state machine.
- `src/render.ts` draws retro terminal visuals on a single canvas.
- `src/input.ts` maps pointer/keyboard controls to deterministic actions.
- `src/main.ts` exposes browser hooks and fixed-step loop.

## Determinism
- Seeded RNG from stable run slug.
- Fixed 60 Hz simulation stepping.
- Controlled bonus spawn cycle:
- first cycle guaranteed central hit lane.
- second cycle offset to guarantee miss when catcher is moved left in scripted demo.

## Mechanics
- Manual collection button increases candy and score.
- Passive generation via `candiesPerSecond`.
- Upgrade cards increase cps/cpc.
- Falling bonus candy + catcher collision modifies multiplier.
- Miss resets multiplier.

## Hook Contract
`window.render_game_to_text()` JSON keys:
- `mode`
- `score`
- `candies`
- `candiesPerSecond`
- `candiesPerClick`
- `multiplier`
- `bonusTarget`
- `seed`
- `elapsedMs`
- `pendingEvents`
