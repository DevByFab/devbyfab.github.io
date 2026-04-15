# Infinite BotNet Reboot

Reboot desktop-first de The Infinite BotNet.

Ce dossier contient la nouvelle base technique React + TypeScript + Web Worker pour reconstruire les boucles de simulation (economie, war/heat, matrix, messages narratifs FR-first) sans modifier le prototype legacy.

## Current Status

- Worker simulation architecture in place with typed protocol.
- Domain modules in place: economy, war, matrix, narrative, phases.
- Upgrade foundation in place with strict level chains and worker-driven purchase flow.
- New compact dashboard-first control-room UI connected to the worker.
- Staged discovery enforced: systems stay hidden until phase unlock, with exploit cooldown pacing and phase-gated message rewards.
- FR-first narrative catalog externalized from engine code.
- P0 lore cinematic runtime upgraded (manual 5-scene flow, animated transitions, per-scene read pacing gate, keyboard controls, dynamic blur backdrop, discovery stinger, and tutorial bridge overlay).
- Canonical lore reference added in `docs/LORE_AND_CINEMATIC_BLUEPRINT.md`.
- Agent onboarding and handoff reference added in `docs/AGENT_HANDOFF.md`.
- Reboot tracker active: `REFONTE_TRACKER.md`.

## Commands

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
npm run balance:sim
```

## Local Launch (Recommended)

Use Vite for all local test and debug sessions:

```bash
npm install
npm run dev
```

Then open the URL printed by Vite (usually `http://localhost:5173/`).

This reboot uses TypeScript modules plus a dedicated module worker, so opening `index.html` directly with static Live Preview can lead to a blank page.

## Production-Like Validation

```bash
npm run build
npm run preview
```

Production builds default to `/games/infinite-botnet-reboot/` as base path. Override with `VITE_PUBLIC_BASE` if needed.

## Project Structure

```text
src/
  game/
    types.ts            # Shared snapshots and domain contracts
    protocol.ts         # UI <-> Worker message protocol
    format.ts           # Big number and timing format helpers
  hooks/
    useGameWorker.ts    # React bridge for worker lifecycle + commands
  content/
    fr/
      narrativeCatalog.ts  # FR narrative templates (event-driven)
  worker/
    engine.worker.ts    # Main simulation loop and command dispatcher
    state.ts            # Canonical engine state + snapshot serialization
    domain/
      phases.ts         # Phase ladder and progression ratio
      economy.ts        # Economy tick and economy commands
      war.ts            # Heat/war mechanics and tactical commands
      matrix.ts         # Matrix loop (bypass/inject/stabilize/collapse)
      narrative.ts      # Inbox generation + message processing
      upgrades.ts       # Upgrade chains, prerequisites, and effect aggregation
  sim/
    balanceHarness.ts   # Seeded headless pacing harness (multi-run)
```

## Implementation Notes

- Simulation runs in worker ticks and sends typed snapshots to the UI.
- Economy baseline already removes guaranteed infinite conversion loops.
- War and matrix now expose readable costs/cooldowns/probabilities in UI.
- Message system is now event-driven and FR-first by default.
- Balancing harness currently reports median completion around 8.2h (8h-12h baseline band before deep-target retune to 12h-20h).

## Next Work Items

- Preserve pacing envelope while adding richer late-game decisions.
- Expand upgrade trees from foundation toward full 40-60 upgrade target.
- Expand consequence-driven narrative branching and faction voices.
- Add dedicated visual layers for war and matrix timelines.
- Add branch-aware endings (3 major + 1 bad end) tied to player decisions.
- Rebuild tutorial around strategic choices.

