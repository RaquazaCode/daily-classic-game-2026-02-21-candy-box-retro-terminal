# Candy Box Retro Terminal - V2 Design

## Goal
Evolve the daily run from deterministic MVP into a full retro-terminal arcade loop while keeping deterministic automation hooks intact.

## Architecture
- `src/game.ts`: deterministic simulation authority and event producer.
- `src/render.ts`: single-canvas renderer with HUD/CRT/feedback layers.
- `src/input.ts`: pointer/touch/keyboard command routing.
- `src/main.ts`: fixed-step loop and browser hooks.

## Determinism Rules
- Seeded RNG only (`src/rng.ts`), no `Math.random` in gameplay.
- Fixed 60Hz sim step for all timers and movement.
- Spawn cycle and bonus type selection are seed-driven and replay-stable.
- Visual overlays derive from state/tick and do not mutate simulation.

## Core Systems
- Phases: `boot` -> `core` -> `overclock` -> `shutdown` (120s cap).
- Risk loop: streak + heat growth on catches, miss recovery debuff.
- Bonus variants: orange / blue / red with deterministic effects.
- Commands: `BOOST`, `SYNC`, `DUMP` with deterministic cooldown timers.
- Upgrades: affordability states + risk upgrade (`narrow_mode`).
- End screen: diagnostic report with score-source table and replay mission.

## Hook Contract
`window.render_game_to_text()` returns JSON with keys:
- `mode`, `phase`, `coordinateSystem`, `score`, `candies`
- `candiesPerSecond`, `candiesPerClick`, `multiplier`, `streak`, `heat`
- `recoveryMs`, `blueSlowMs`, `redBoostMs`, `commandBoostMs`, `syncShield`
- `warningActive`, `timeLeftMs`, `nextSpawnMs`, `bonusTarget`
- `stats`, `scoreBreakdown`, `command`, `theme`, `seed`, `elapsedMs`, `pendingEvents`
