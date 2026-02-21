Original prompt: Implement the 2026-02-21 Daily Classic Game Reliability + Today Run Plan.

## Progress
- Created new daily folder scaffold at `games/2026-02-21-candy-box-retro-terminal`.
- Implemented deterministic Candy Box MVP with retro terminal visuals.
- Added fixed-step loop, seeded RNG, manual collect, passive generation, upgrades, and bonus catch/miss collision logic.
- Exposed automation hooks `window.advanceTime(ms)` and `window.render_game_to_text()`.
- Added self-check and Playwright capture scripts with scripted action payload.

## Outstanding
- Run pnpm install/test/build and Playwright capture.
- Generate GIF captures from screenshots.
- Initialize repo, commit, publish, PR/merge, hardening.
- Update automation records and validate catalog.
