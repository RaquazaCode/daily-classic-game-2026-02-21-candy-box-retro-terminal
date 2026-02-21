Original prompt: Implement Candy Box Retro Terminal v2.0 major update plan with micro logical commits.

## Progress
- Created feature branch: `codex/2026-02-21-candy-box-v2-major-update`.
- Opened draft PR: `https://github.com/RaquazaCode/daily-classic-game-2026-02-21-candy-box-retro-terminal/pull/3`.
- Implemented deterministic v2 systems:
- phase timeline (`boot/core/overclock/shutdown`) with 120s cap
- streak + heat + miss recovery mechanics
- deterministic orange/blue/red bonus variants and effects
- narrow-mode risk upgrade with affordability rendering
- keyboard/touch controls and manual collect hotkeys
- command buffer with `BOOST`, `SYNC`, `DUMP`
- onboarding boot sequence and contextual tutorial hints
- expanded HUD with timer, spawn ETA, streak/heat, urgency pulse
- CRT effects, scanlines/noise/flicker, shake/flash feedback
- theme variants and deterministic theme toggles
- end-screen diagnostic report and mission suggestion
- Updated verification harness and artifacts:
- refreshed `scripts/self_check.mjs`
- updated `playwright_actions.json`
- regenerated `playwright/main-actions/state-*.json` and screenshots

## Verification
- `pnpm test` (pass)
- `pnpm build` (pass)
- `WEB_GAME_URL="http://127.0.0.1:4173/?scripted_demo=1" node scripts/capture_playwright.mjs` (pass)

## Remaining
- Mark PR ready, merge with merge commit, sync local `main`.
