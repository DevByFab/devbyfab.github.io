# Infinite BotNet Reboot Tracker

## Product Decisions Locked
- Scope: Big-bang rebuild (no incremental patching of legacy game).
- Priority: economy, war/heat, matrix clarity, messages/lore, visuals/motion, tutorial.
- Stack: Modern build tooling + TypeScript-first architecture.
- Runtime target: deep roadmap 12h to 20h full run (current baseline calibration remains 8h to 12h).
- Save compatibility: not required with legacy save format.
- Art direction: phase-evolving look (desktop-first).
- Language priority: French first.
- Delivery style: quality-first.

## Milestones

| ID | Milestone | Owner | Status | Notes |
| --- | --- | --- | --- | --- |
| M0 | Reboot workspace + tracker | Copilot | DONE | New Vite React TS app created in `games/infinite-botnet-reboot`. |
| M1 | Domain contract and worker bridge | Copilot | DONE | Typed protocol, worker loop, snapshots, React bridge implemented. |
| M2 | Economy v2 simulation | Copilot | DONE | Late-game pacing calibrated with harness to target band while keeping run stability. |
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
- [x] M1.4 Harden startup reliability (Vite base path + explicit worker boot errors).
- [x] M1.5 Replace tabbed shell with compact dashboard-first layout (console integrated, settings hub, no page scroll desktop).
- [x] M1.6 Add phase requirement gates + progression counters + first strict upgrade chain engine.
- [x] M1.7 Enforce P0-P5 staged discovery (exploit cooldown pacing, phased message rewards, progressive upgrade reveal).
- [x] M1.8 UX iteration pass: hide visual phase progression, compact console/upgrades, guided tutorial replay, and FR i18n extraction for reboot UI.
- [x] M1.9 IA/DA realignment pass: dashboard narrowed to Core Ops + Upgrades + Console, systems split into dedicated tabs, tutorial inter-tab routing, and medium-dim spotlight readability.
- [x] M2.1 Tune economy v2 formulas against long-run targets.
- [x] M2.2 Push median run from 7.75h into 8h+ target band.
- [ ] M3.1 Calibrate war reward-risk profile and pressure curve.
- [ ] M4.1 Calibrate matrix stability and collapse cadence.
- [ ] M5.1 Extend narrative templates with consequence branching.
- [ ] M6.1 Add dedicated war and matrix visual layers.
- [x] M6.2 Integrate ambient + gameplay audio cues (UI/events/stingers) with settings mix.
- [x] M6.3 Upgrade P0 lore cinematic runtime (scene transitions, blur depth, read pacing gate, keyboard controls, bridge).

### Next Up
- [ ] M2.3 Recalibrate pacing envelope from 8h-12h baseline to 12h-20h deep target.
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
- 2026-04-15: M2.2 achieved via late-game computronium pacing tuning; harness now reports median 8.22h with 10/10 runs in target band.
- 2026-04-15: Startup hardening pass shipped (production base path strategy + worker boot timeout/error surfacing + local launch guidance in README).
- 2026-04-15: Deep architecture implementation started: tab navigation shell, phase multi-criteria gate requirements, progression counters, and strict upgrade purchase chains wired in worker + UI.
- 2026-04-15: Gameplay reset sprint started: dashboard-first compact UI, settings modal with channel volumes, first-launch lore/tutorial overlays, phase-gated system visibility, exploit cooldown pacing, and phase-gated message reward taxonomy.
- 2026-04-15: Follow-up UX implementation completed: visual phase block hidden, CLI/upgrades footprint reduced, top-right tutorial replay added, Settings replay for lore/tutorial added, full guided section-by-section tutorial spotlight implemented, and reboot text extracted to i18n/fr.json.
- 2026-04-15: IA/DA refactor shipped: one-tab-per-system navigation, resources always visible, dashboard scope reduced to Scan/Exploit/CLI + Upgrades, and tutorial spotlight contrast adjusted to medium dimming.
- 2026-04-15: Audio integration pass completed: ambient loop + manifest-driven UI/event/stinger cues wired in React, with channel mixer settings persisted and cue routing cleaned to avoid duplicate warning beeps.
- 2026-04-15: Lore cinematic P0 implementation started: manual 5-scene overlay flow, FR narrative rewrite, cinematic CSS staging, dedicated BotNet discovery stinger cue, and canonical blueprint created in `docs/lore/LORE_AND_CINEMATIC_BLUEPRINT.md`.
- 2026-04-15: Lore cinematic P0 v2 pass shipped: transition state machine, per-scene 2s read gate, lore-only keyboard controls, animated multi-layer blur backdrop, and lore-to-tutorial bridge overlay.
- 2026-04-17: Audio runtime hardening pass shipped: manifest loading now supports primary/fallback candidates with built-in diagnostics, and playback can fall back to bundled asset URLs when runtime paths fail.
- 2026-04-17: Audio settings fallback fixed: partial/corrupted localStorage payloads now preserve default channel mix instead of muting missing channels to 0.
- 2026-04-17: P0 lore flow patched with active transition classes and timed lore-to-tutorial bridge overlay rendering in runtime.
- 2026-04-17: P0 lore pacing updated: removed forced 2s read gate so Next/Continue is immediately clickable while transition/bridge locks remain active.
- 2026-04-17: Cinematic transition architecture started under `src/cinematics/lore/` with per-scene files, a shared Canvas runtime helper layer, and a Scene 1 Canvas visual prototype.
- 2026-04-17: Canvas lore pass expanded to scenes 2-5 using shared drawing helpers and per-scene render files, keeping one-scene-one-file modularity.
- 2026-04-17: Storyboard figurative pass applied to lore scenes 1-2 with reusable canvas primitives (panels, stick figures, props) to improve narrative readability while preserving existing lore transition flow.
- 2026-04-17: P0 micro-boost pass started: added two early upgrades (`econ-exploit-seed` at 10 bots and `econ-cooldown-primer` at 25 bots) while keeping the 45-bot gate unchanged to smooth the first minutes without large architecture changes.
- 2026-04-17: P0 micro-boost validation pack defined for completion (`npm run lint`, `npm run balance:sim`, and manual P0 path check 10 -> 25 -> 45) before locking pacing conclusions.

## Latest Balance Snapshot (Harness)
- Command: `npm run balance:sim`
- Seeds: 10 deterministic runs
- Result: 10/10 completed, median 8.22h, average 8.21h
- Target coverage: 10/10 runs in 8h-12h baseline band (pre-depth recalibration)
- Stability: no matrix collapses and no detection events in selected strategy profile
- Next action: expand systems depth then retune to the 12h-20h deep target envelope

## Definition of Done (v1 reboot)
- Simulation isolated in worker modules with strict TypeScript types.
- Core loops (economy/war/matrix/messages/tutorial) all rebuilt and integrated.
- FR-first narrative content externalized from engine code.
- Desktop QA complete with no critical progression blockers.
- Run pacing validated in target range (8h to 12h) with balancing notes recorded.
