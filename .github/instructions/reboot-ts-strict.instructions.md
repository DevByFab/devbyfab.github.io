---
description: "Use when editing Infinite BotNet Reboot TypeScript or TSX files in src. Enforces strict UI-worker contract, protocol/types alignment, and pacing validation (lint + balance simulation)."
name: "Reboot TS Strict"
applyTo:
  - "games/infinite-botnet-reboot/src/**/*.ts"
  - "games/infinite-botnet-reboot/src/**/*.tsx"
---
# Reboot TS Strict Rules

- Keep simulation logic in worker domain files under src/worker/domain. Do not move game math, cooldown, or progression decisions into React UI or hooks.
- Treat src/worker/state.ts as the canonical runtime schema and src/game/types.ts as the snapshot contract consumed by UI.
- Any snapshot shape change must be updated in the same change set:
  - state fields in src/worker/state.ts
  - exported snapshot interfaces in src/game/types.ts
  - serialization in toSnapshot inside src/worker/state.ts
- Keep UI/worker communication strictly typed through src/game/protocol.ts.
- For any new command, update all three in one pass:
  - command union in src/game/protocol.ts
  - handler branch in src/worker/engine.worker.ts
  - UI dispatch call sites in src/hooks and src/App.tsx
- Keep resources as bigint in worker state and domain logic. Convert to string only at snapshot serialization boundaries.
- Preserve progression gates and prerequisites:
  - phase unlock logic in src/worker/domain/phases/
  - upgrade prerequisite chains in src/worker/domain/upgrades/
  - message reward phase gating in src/worker/domain/narrative.ts
- For pacing-sensitive changes (economy, phases, upgrades, message rewards, war, matrix, cooldowns, or timers), run from games/infinite-botnet-reboot:
  - npm run lint
  - npm run balance:sim
- Balance target for deep progression is 12h to 20h. If simulation outputs drift outside that window, retune before finalizing.
- Do not use any or untyped payload shortcuts between UI and worker. Prefer explicit union members and narrow payload fields.
