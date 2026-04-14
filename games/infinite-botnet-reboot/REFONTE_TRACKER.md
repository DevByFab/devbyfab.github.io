# Infinite BotNet Reboot Tracker

## Product Decisions Locked
- Scope: Big-bang rebuild (no incremental patching of legacy game).
- Priority: economy, war/heat, matrix clarity, messages/lore, visuals/motion, tutorial.
- Stack: Modern build tooling + TypeScript-first architecture.
- Runtime target: 8h to 12h full run.
- Save compatibility: not required with legacy save format.
- Art direction: phase-evolving look (desktop-first).
- Language priority: French first.
- Delivery style: quality-first.

## Milestones

| ID | Milestone | Owner | Status | Notes |
| --- | --- | --- | --- | --- |
| M0 | Reboot workspace + tracker | Copilot | DONE | New Vite React TS app created in `games/infinite-botnet-reboot`. |
| M1 | Domain contract and worker bridge | Copilot | DONE | Typed protocol, worker loop, snapshots, React bridge implemented. |
| M2 | Economy v2 simulation | Copilot | IN PROGRESS | Initial formulas integrated (maintenance sink, capped yields, no free money loop). |
| M3 | War + heat redesign | Copilot | IN PROGRESS | Tactical formulas and visible success projection integrated. |
| M4 | Matrix redesign | Copilot | IN PROGRESS | Bypass/inject/stabilize/collapse baseline integrated. |
| M5 | Event-driven narrative/messages | Copilot | IN PROGRESS | FR-first narrative catalog + event-driven inbox pipeline integrated. |
| M6 | UX/visual redesign by phase | Copilot | IN PROGRESS | New desktop-first control room UI and motion baseline integrated. |
| M7 | Tutorial v2 | Copilot | TODO | Guided strategic onboarding. |
| M8 | Long-run balancing + QA | Copilot | IN PROGRESS | Headless balancing harness integrated and first calibration pass recorded. |

## Active Sprint Board

### In Progress
- [x] M1.1 Create shared game state types.
- [x] M1.2 Add worker command/event protocol.
- [x] M1.3 Wire React app store to worker snapshots.
- [x] M2.1 Tune economy v2 formulas against long-run targets.
- [ ] M2.2 Push median run from 7.75h into 8h+ target band.
- [ ] M3.1 Calibrate war reward-risk profile and pressure curve.
- [ ] M4.1 Calibrate matrix stability and collapse cadence.
- [ ] M5.1 Extend narrative templates with consequence branching.
- [ ] M6.1 Add dedicated war and matrix visual layers.

### Next Up
- [ ] M7.1 Rebuild tutorial flow around strategic decisions.
- [x] M8.1 Build balancing harness for 8h-12h runs.
- [ ] M8.2 Run desktop QA pass and record blockers.

## Changelog
- 2026-04-15: Reboot repository scaffolded with Vite + React + TypeScript.
- 2026-04-15: Tracker initialized and milestone map locked.
- 2026-04-15: Worker architecture implemented (economy, war, matrix, narrative domains + typed protocol).
- 2026-04-15: New desktop-first reboot UI connected to worker with command panels and terminal logs.
- 2026-04-15: Initial FR narrative catalog externalized from simulation logic.
- 2026-04-15: Added `npm run balance:sim` headless simulation harness with seeded multi-run output and phase-arrival metrics.
- 2026-04-15: Economy and war calibration pass applied (phase-scaled monetization cap, softened maintenance fallback, heat/detection smoothing, matrix unlock gating).
- 2026-04-15: Harness snapshot after calibration: median completion 7.77h, all seeds complete under 14h, next target is to push median into 8h+.

## Latest Balance Snapshot (Harness)
- Command: `npm run balance:sim`
- Seeds: 10 deterministic runs
- Result: 10/10 completed, median 7.77h, average 7.75h
- Target gap: slightly faster than target floor (8h)
- Stability: no matrix collapses and no detection events in selected strategy profile
- Next action: raise endgame friction slightly without reintroducing singularity stalls

## Definition of Done (v1 reboot)
- Simulation isolated in worker modules with strict TypeScript types.
- Core loops (economy/war/matrix/messages/tutorial) all rebuilt and integrated.
- FR-first narrative content externalized from engine code.
- Desktop QA complete with no critical progression blockers.
- Run pacing validated in target range (8h to 12h) with balancing notes recorded.
