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
- [x] M2.1 Tune economy v2 formulas against long-run targets.
- [x] M2.2 Push median run from 7.75h into 8h+ target band.
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
- 2026-04-15: M2.2 achieved via late-game computronium pacing tuning; harness now reports median 8.22h with 10/10 runs in target band.

## Latest Balance Snapshot (Harness)
- Command: `npm run balance:sim`
- Seeds: 10 deterministic runs
- Result: 10/10 completed, median 8.22h, average 8.21h
- Target coverage: 10/10 runs in 8h-12h band
- Stability: no matrix collapses and no detection events in selected strategy profile
- Next action: expand narrative/visual depth while preserving calibrated pacing envelope

## Definition of Done (v1 reboot)
- Simulation isolated in worker modules with strict TypeScript types.
- Core loops (economy/war/matrix/messages/tutorial) all rebuilt and integrated.
- FR-first narrative content externalized from engine code.
- Desktop QA complete with no critical progression blockers.
- Run pacing validated in target range (8h to 12h) with balancing notes recorded.

Dernier reponse :
Je vais faire un micro-tuning de la phase Matrix (seuil d’entrée) puis relancer le harness pour viser la médiane à 8h+ sans casser la stabilité.

Le test montre que 130B rend la run instable; je reviens sur le seuil stable et je ralentis légèrement la progression Matrix pour gratter du temps sans retomber dans les stalls.

Je vais toucher le vrai goulot d’étranglement (génération de Computronium) pour rallonger la fin de run d’environ 10-20 minutes sans casser les phases précédentes.

Le tuning est maintenant dans la cible; je mets à jour le tracker/README avec le nouveau snapshot (8.22h médiane) puis je fais un passage final build/lint.

Calibration atteint et docs mises à jour; je fais le check final qualité (build/lint/erreurs IDE) puis je te rends un état clair pour la suite.

Je clôture le suivi de ce lot en marquant le tuning pacing comme terminé dans la todo active.

Created 5 todos

La suite est faite, et la calibration pacing est maintenant dans la cible.

Pacing long-run atteint via tuning late-game sur la génération Computronium dans economy.ts.
Ajustements de stabilité conservés sur War/Heat dans war.ts.
Réglages Matrix gardés cohérents dans matrix.ts et seuil de phase stable dans phases.ts.
Tracker et doc mis à jour avec les nouveaux résultats dans REFONTE_TRACKER.md et README.md.
Résultat harness actuel (npm run balance:sim):

10/10 runs terminées
moyenne 8.21h
médiane 8.22h
10/10 dans la bande 8h-12h
pas de collapses matrix ni événements detection sur ce profil
Validation:

build OK
lint OK
erreurs IDE: aucune
Le preview reboot est toujours disponible sur http://127.0.0.1:4173/

Je peux maintenant enchaîner sur M3/M4 (lisibilité War + Matrix côté UI).
Ou passer sur M5 (messages narratifs à conséquences) pendant que la base pacing reste figée.