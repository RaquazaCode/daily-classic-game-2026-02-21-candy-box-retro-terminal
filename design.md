# Candy Box Retro Terminal - V2.1 Design

## Goal
Deliver a deterministic v2.1 update that adds persistent prestige progression, selectable difficulty profiles, and unobstructed gameplay lanes by relocating gameplay controls to side docks.

## Architecture
- `src/game.ts`: deterministic simulation + difficulty + prestige authority.
- `src/render.ts`: gameplay-only canvas render (no menu/upgrade panels inside lane space).
- `src/main.ts`: DOM dock UI, localStorage persistence bridge, and runtime orchestration.
- `src/input.ts`: pointer/touch movement and non-editable keyboard routing.

## Core Rules
- Fixed-step simulation (`60Hz`) remains authoritative.
- Seeded RNG only from `src/rng.ts`.
- Scripted mode (`scripted_demo=1`) disables realtime stepping and disables meta persistence for reproducible snapshots.
- Browser hooks remain stable:
- `window.advanceTime(ms)`
- `window.render_game_to_text()`

## Systems Added in V2.1
- Difficulty profiles with separate runtime, spawn, fall-speed, recovery, economy, and chip scaling.
- Prestige chips + 6 permanent upgrades persisted with localStorage key `candy_box_retro_terminal_v2_meta`.
- Side docks (left: run/command, right: upgrades/prestige) toggled by `Q/E`, collapsed by default.
- Playfield stays clear: only catcher, candies, in-world effects, and compact telemetry in canvas.

## Snapshot Contract Additions
`window.render_game_to_text()` now includes:
- `difficulty`, `runDurationMs`
- `meta`
- `chipsEarnedThisRun`
- `playfieldRect`
- `uiPanelsOpen`
