Original prompt: Implement Candy Box Retro Terminal v2.1 plan (prestige + clear playfield + difficulty + repo docs).

## Progress
- Created feature branch: `codex/2026-02-21-candy-box-v2.1-prestige-difficulty`.
- Opened draft PR: `https://github.com/RaquazaCode/daily-classic-game-2026-02-21-candy-box-retro-terminal/pull/4`.
- Implemented v2.1 gameplay and UI changes:
- Added difficulty modes (`easy`, `medium`, `hard`) with runtimes 300s/240s/180s.
- Added mechanical + economy scaling per difficulty profile.
- Added persistent prestige chips and 6 permanent upgrades.
- Added localStorage persistence with safe fallback and reset path.
- Moved collect/command/upgrade/prestige UI to slide-out side docks.
- Kept canvas as gameplay-only lane rendering (no in-canvas blocking panels).
- Expanded snapshot contract (`difficulty`, `runDurationMs`, `meta`, `chipsEarnedThisRun`, `playfieldRect`, `uiPanelsOpen`).
- Added deterministic scripted-mode control (`scripted_demo=1` disables realtime loop and meta persistence).
- Refreshed deterministic Playwright actions and capture artifacts.

## Verification
- `pnpm test` (pass)
- `pnpm build` (pass)
- `WEB_GAME_URL="http://127.0.0.1:4173/?scripted_demo=1" node scripts/capture_playwright.mjs` (pass)
- Determinism check: two scripted captures produced identical `state-*.json` hashes.

## Remaining
- Set GitHub About description.
- Mark PR ready, merge with merge commit, sync local `main`.
