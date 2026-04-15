# Infinite BotNet Reboot - Agent Handoff

Last update: 2026-04-15
Scope: This is the single onboarding document for any coding agent working in `games/infinite-botnet-reboot`.

## 1) Mission and product intent

- Project type: full reboot (not a legacy patch).
- Current app: React + TypeScript + Vite + module Web Worker.
- Gameplay target: deep clicker/management game with strict progression gates.
- Deep pacing target: 12h to 20h total run time.
- Current balance baseline: around 8h to 12h before final deep retune.

## 2) Locked product decisions

- Dashboard-first gameplay.
- Settings in top-right.
- No separate lore page.
- Desktop-first at 1366x768 and 1920x1080.
- No full-page scroll on desktop. Internal panel scroll only.
- Progression structure P0 to P5 with strict feature unlock by phase.
- Endings target: 3 major endings + 1 bad ending (future scope).
- Upgrade depth target: 40 to 60 upgrades with strict prerequisite chains.
- First launch flow: lore cinematic then tutorial (both skippable).
- Contextual mini-tutorial expected when each system unlocks.
- Message reward gating by phase:
- P2: bots/scan utility rewards.
- P3: money/portfolio rewards.
- P4: war-related rewards.
- P5: matrix-related rewards.

## 3) High-level architecture

- UI layer reads snapshots only.
- Worker is source of truth for runtime state and game math.
- UI talks to worker via typed protocol.
- Worker composes domain logic modules (economy, war, matrix, narrative, phases, upgrades).

Runtime flow:
1. `src/hooks/useGameWorker.ts` boots `src/worker/engine.worker.ts`.
2. UI sends typed commands from `src/game/protocol.ts`.
3. Worker dispatches command, runs simulation tick, syncs derived state.
4. Worker sends `READY`, `SNAPSHOT`, `LOG`, `ERROR` messages.
5. UI renders from `src/game/types.ts` snapshot contract.

## 4) Module map (where things are)

### Core UI

- `src/App.tsx`: top-level orchestration (tabs, overlays, command wiring, onboarding flow).
- `src/index.css`: global reboot styles and visual system.
- `src/main.tsx`: app entrypoint.

### UI support modules

- `src/app/constants.ts`: app constants (storage keys, lore timing, turbo options).
- `src/app/storage.ts`: localStorage read/write helpers and audio clamp.
- `src/app/guideLayout.ts`: tutorial spotlight geometry helpers.
- `src/app/upgrades.ts`: UI-side upgrade helper formatting and checks.

### Reusable UI components

- `src/components/ResourceCard.tsx`: resource stat card.

Tabs:
- `src/components/tabs/DashboardTabPanel.tsx`
- `src/components/tabs/CashflowTabPanel.tsx`
- `src/components/tabs/MessagesTabPanel.tsx`
- `src/components/tabs/WarTabPanel.tsx`
- `src/components/tabs/MatrixTabPanel.tsx`

Overlays:
- `src/components/overlays/SettingsOverlay.tsx`
- `src/components/overlays/LoreOverlay.tsx`
- `src/components/overlays/LoreBridgeOverlay.tsx`
- `src/components/overlays/UnlockHintOverlay.tsx`
- `src/components/overlays/GuideOverlay.tsx`

### Shared game contracts

- `src/game/protocol.ts`: UI <-> Worker message protocol and commands.
- `src/game/types.ts`: snapshot interfaces consumed by UI.
- `src/game/format.ts`: number and timing format helpers.

### Hooks

- `src/hooks/useGameWorker.ts`: worker lifecycle, command dispatch, turbo, reset.
- `src/hooks/useAudioManager.ts`: audio manifest-driven cue system and channel mix.
- `src/hooks/useRebootI18n.ts`: FR-first translation helper.

### Content

- `src/content/fr/narrativeCatalog.ts`: FR narrative templates and message content.

### Worker runtime

- `src/worker/engine.worker.ts`: orchestrator worker loop.
- `src/worker/state.ts`: canonical runtime schema + `toSnapshot` serialization.

Engine submodules:
- `src/worker/engine/types.ts`: shared engine helper types.
- `src/worker/engine/commandDispatcher.ts`: command routing and command-side logs.
- `src/worker/engine/simulationStep.ts`: per-tick simulation execution.
- `src/worker/engine/syncDerivedState.ts`: phase/derived recalculation and refresh.

Domain modules:
- `src/worker/domain/economy.ts`
- `src/worker/domain/war.ts`
- `src/worker/domain/matrix.ts`
- `src/worker/domain/narrative.ts`
- `src/worker/domain/phases.ts`
- `src/worker/domain/upgrades.ts`

### Simulation harness

- `src/sim/balanceHarness.ts`: deterministic multi-run pacing simulation.

### Docs and planning

- `README.md`: project setup, runtime notes, command list.
- `REFONTE_TRACKER.md`: milestone status and active sprint board.
- `BALANCE_REFERENCE.md`: balance notes and guidance.
- `docs/LORE_AND_CINEMATIC_BLUEPRINT.md`: canonical P0 lore cinematic design.
- `docs/AGENT_HANDOFF.md`: this document.

## 5) Protocol and state contract rules (do not break)

- `src/worker/state.ts` is canonical state.
- `src/game/types.ts` is UI snapshot contract.
- Any snapshot field change must be updated in the same change:
- worker state field(s) in `src/worker/state.ts`.
- snapshot interface(s) in `src/game/types.ts`.
- `toSnapshot` mapping in `src/worker/state.ts`.

- Commands must remain strictly typed via `src/game/protocol.ts`.
- For a new command, update together:
- protocol union in `src/game/protocol.ts`.
- handler in `src/worker/engine.worker.ts` and/or `src/worker/engine/commandDispatcher.ts`.
- UI dispatch call sites (`src/App.tsx`, hooks/components).

- Keep resources as `bigint` in worker/domain logic.
- Convert to string only at snapshot serialization boundary.

## 6) Current refactor status

Completed:
- App support utilities extracted to `src/app/*`.
- Worker engine split into orchestrator + engine modules.
- Large tab sections extracted to `src/components/tabs/*`.
- Overlay sections extracted to `src/components/overlays/*`.
- App now mostly orchestrates state, handlers, and component composition.

Still in progress at roadmap level:
- War curve calibration (M3).
- Matrix curve calibration (M4).
- Narrative branching depth (M5).
- Tutorial v2 strategic onboarding (M7).
- Deep pacing retune from 8-12h baseline to 12-20h target (M2.3/M8).

## 7) Implementation playbook (quick routing)

If you need to...

- Add or change a gameplay formula:
- edit worker domain files in `src/worker/domain/*`.

- Add a new resource or telemetry field:
- edit `src/worker/state.ts`, `src/game/types.ts`, and snapshot serialization.

- Add a UI action button that triggers gameplay:
- add command type in `src/game/protocol.ts`.
- handle in worker command path (`src/worker/engine/commandDispatcher.ts`).
- wire UI dispatch in `src/App.tsx` or tab component.

- Change lore/tutorial UX:
- overlay components in `src/components/overlays/*`.
- orchestration logic in `src/App.tsx`.
- text in i18n and/or narrative catalog.

- Tune progression gates:
- `src/worker/domain/phases.ts`.
- `src/worker/domain/upgrades.ts` for strict chain/prereq behavior.
- `src/worker/domain/narrative.ts` for reward phase gating.

- Tune balance safely:
- run `npm run balance:sim` and compare completion envelope.

## 8) Validation commands

Run from `games/infinite-botnet-reboot`:

- `npm install`
- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run preview`
- `npm run balance:sim`

Validation policy:
- For pacing-sensitive changes (economy, phases, upgrades, messages, war, matrix, cooldowns/timers): run both `npm run lint` and `npm run balance:sim`.

## 9) Known constraints and conventions

- Keep simulation decisions inside worker/domain. Do not move math into React UI.
- Keep FR-first text path stable. Route UI text through `useRebootI18n`.
- Avoid new dependencies unless clearly required.
- Use Vite runtime (`npm run dev` or `npm run preview`) for real validation.
- Do not validate module worker by opening raw `index.html` directly.

## 10) Short-term execution plan for next agents

1. Stabilize quality gate:
- ensure lint/build/balance commands pass in environment.

2. Finish depth targets:
- grow upgrade graph toward 40 to 60 upgrades while preserving strict prereqs.

3. Recalibrate pacing:
- move from 8-12h baseline to 12-20h deep target using `balance:sim`.

4. Expand strategic onboarding:
- tutorial v2 tied to phase unlocks and player decisions.

5. Increase narrative consequence:
- stronger branch outcomes and setup for 3 major endings + 1 bad ending.

## 11) Canonical references

- `README.md`
- `REFONTE_TRACKER.md`
- `BALANCE_REFERENCE.md`
- `docs/LORE_AND_CINEMATIC_BLUEPRINT.md`
- `src/game/protocol.ts`
- `src/game/types.ts`
- `src/worker/state.ts`

---

If this file and `REFONTE_TRACKER.md` disagree on roadmap state, treat `REFONTE_TRACKER.md` as source of truth for milestone status.
