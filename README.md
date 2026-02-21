# daily-classic-game-2026-02-21-candy-box-retro-terminal

Retro terminal clicker run with deterministic 120s phases, streak/heat risk loop, bonus variants, command console, and diagnostics end screen.

## Quick Start
```bash
pnpm install
pnpm dev
pnpm test
pnpm build
```

## Controls
- Mouse/touch drag or `ArrowLeft`/`ArrowRight`/`A`/`D`: move catcher.
- Click `COLLECT` or press `Space`: manual collect.
- Type commands then press `Enter`: `BOOST`, `SYNC`, `DUMP`.
- `1`/`2`/`3`: theme toggle (Classic Green / Amber / Blue Vector).
- `P`: pause.
- `R`: reset run.

## Run Flow
- `0-10s` boot phase with onboarding hints.
- `10-60s` core phase.
- `60-90s` overclock phase.
- `90-120s` shutdown phase with urgency pulse.

## Deterministic Mechanics
- Fixed-step loop (`60Hz`) and seeded RNG.
- Bonus variants:
- Orange: standard multiplier progression.
- Blue: temporary slow-fall safety window.
- Red: temporary CPS boost.
- Miss handling includes recovery debuff; `SYNC` shield can absorb a miss.

## Browser Hooks
- `window.advanceTime(ms)`
- `window.render_game_to_text()`

Snapshot payload includes:
- `mode`, `phase`, `score`, `candies`, `candiesPerSecond`, `candiesPerClick`
- `multiplier`, `streak`, `heat`, `recoveryMs`, `warningActive`
- `timeLeftMs`, `nextSpawnMs`, `bonusTarget.type`
- `stats`, `scoreBreakdown`, `command`, `theme`, `pendingEvents`

## Verification
```bash
pnpm test
pnpm build
WEB_GAME_URL="http://127.0.0.1:4173/?scripted_demo=1" node scripts/capture_playwright.mjs
```

Evidence highlights:
- `playwright/main-actions/state-2.json`: passive growth + `bonus_hit`.
- `playwright/main-actions/state-5.json`: `command_success` + `bonus_miss_reset`.
- `playwright/main-actions/state-7.json`: deterministic blue bonus spawn.
