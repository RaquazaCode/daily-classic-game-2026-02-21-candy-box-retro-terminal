# Candy Box Retro Terminal v2.0 Implementation Plan

> **For Implementer:** Optional process aid: use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a major v2 update with deterministic onboarding, risk/reward loop, command system, HUD/CRT polish, and diagnostics end screen.

**Architecture:** Keep fixed-step deterministic sim in `src/game.ts`, single-canvas render in `src/render.ts`, and input routing in `src/input.ts`. Expand snapshot contract without removing existing browser hooks.

**Tech Stack:** TypeScript, Vite, pnpm, Playwright capture harness.

---

## Execution Summary
1. Create feature branch and open draft PR.
2. Add v2 state/types scaffolding and deterministic phase timeline.
3. Implement streak/heat/recovery, bonus variants, and risk upgrade.
4. Expand input for keyboard/touch and terminal commands.
5. Add onboarding and HUD hierarchy.
6. Add CRT feedback effects and theme variants.
7. Add diagnostic end screen.
8. Refresh self-check + scripted Playwright actions + deterministic artifacts.
9. Update docs and merge PR with merge commit (no squash).
