# Infinite BotNet Reboot

Reboot desktop-first de The Infinite BotNet.

Ce dossier contient la nouvelle base technique React + TypeScript + Web Worker pour reconstruire les boucles de simulation (economie, war/heat, matrix, messages narratifs FR-first) sans modifier le prototype legacy.

## Current Status

- Worker simulation architecture in place with typed protocol.
- Domain modules in place: economy, war, matrix, narrative, phases.
- New desktop control-room UI connected to the worker.
- FR-first narrative catalog externalized from engine code.
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
  sim/
    balanceHarness.ts   # Seeded headless pacing harness (multi-run)
```

## Implementation Notes

- Simulation runs in worker ticks and sends typed snapshots to the UI.
- Economy baseline already removes guaranteed infinite conversion loops.
- War and matrix now expose readable costs/cooldowns/probabilities in UI.
- Message system is now event-driven and FR-first by default.
- Balancing harness currently reports median completion around 7.7h (close to 8h floor target).

## Next Work Items

- Calibrate economy pacing toward 8h-12h target run length.
- Expand consequence-driven narrative branching and faction voices.
- Add dedicated visual layers for war and matrix timelines.
- Rebuild tutorial around strategic choices.

