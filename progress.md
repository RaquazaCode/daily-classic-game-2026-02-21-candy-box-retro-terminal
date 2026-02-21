Original prompt: Implement the 2026-02-21 Daily Classic Game Reliability + Today Run Plan.

## Progress
- Created new daily folder scaffold at `games/2026-02-21-candy-box-retro-terminal`.
- Implemented deterministic Candy Box MVP with retro terminal visuals.
- Added fixed-step loop, seeded RNG, manual collect, passive generation, upgrades, and bonus catch/miss collision logic.
- Exposed automation hooks `window.advanceTime(ms)` and `window.render_game_to_text()`.
- Added self-check and Playwright capture scripts with scripted action payload.
- Verified gameplay loop via scripted capture and generated GIF clips from latest screenshots.
- Published standalone repo and merged feature PR:
- Repo: `https://github.com/RaquazaCode/daily-classic-game-2026-02-21-candy-box-retro-terminal`
- PR: `https://github.com/RaquazaCode/daily-classic-game-2026-02-21-candy-box-retro-terminal/pull/1`
- Merge commit: `6cde99e57a240ceafb3740245f6f25bf9fc183d5`
- Ran post-run hardening (auto -> solo_fast_lane) and verified branch protection.

## Outstanding
- No blockers for this run.
- Optional follow-up: add audio loop + keyboard upgrade shortcuts from backlog.
