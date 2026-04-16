# PLAN_REORG_TMP

Statut: temporaire (document de pilotage)
Objectif: réorganiser `infinite-botnet-reboot` en modules lisibles, par fonctionnalité, avec petites phases sûres.

## Contraintes de chantier

- Priorité 1: code fonctionnel à chaque étape.
- Pas de grosse phase opaque: on découpe en lots courts et vérifiables.
- On préserve les contrats critiques:
- `src/game/protocol.ts`
- `src/game/types.ts`
- `src/worker/state.ts`
- `src/worker/engine.worker.ts`
- Validation complète demandée après chaque phase:
- diagnostics TypeScript (`get_errors`)
- `npm run lint`
- `npm run build`
- `npm run balance:sim` (quand pacing/gameplay touché)

## Baseline actuelle

- [x] `App.tsx` restauré à une version unique (suppression du doublon fusionné).
- [x] Erreurs App: 0.
- [x] Erreurs `src`: 0.

## Découpage cible (par fonctionnalité)

- `src/app/navigation/*` pour tabs + gating + hints.
- `src/app/onboarding/*` pour lore + guide + intro flow.
- `src/components/tabs/dashboard/*` pour core ops + upgrades + console.
- `src/worker/domain/economy/*` split en rates/tick/commands/helpers.
- `src/worker/domain/narrative/*` split en templates/rewards/generation/commands.

Note: pas de limite rigide en lignes. Cible = fichiers lisibles et cohérents; éviter les monolithes et éviter les micro-fichiers inutiles.

---

## PHASE 1 - Stabilisation et garde-fous

But: verrouiller une base saine avant refactor.

- [x] Nettoyer la casse de `src/App.tsx`.
- [ ] Lancer validation terminal complète (`lint`, `build`).
- [ ] Capturer baseline gameplay courte (smoke manuel: scan/exploit/tabs/overlays).
- [ ] Capturer baseline pacing (`balance:sim`) pour comparaison future.

Sortie attendue:
- Baseline stable, mesurée, référencée.

---

## PHASE 2 - Split App: navigation + config

But: réduire la charge cognitive de `App.tsx`.

- [x] Extraire constantes de navigation et unlock hints dans module dédié.
- [x] Extraire logique activeTab + phase gating dans module/hook dédié.
- [x] Extraire le rendu de la barre d'onglets dashboard vers composant dédié.
- [x] Extraire gestion des hotkeys gameplay (Enter/X) dans hook dédié.
- [x] Extraire logique des audio cues déclenchés par les logs dans hook dédié.
- [x] Extraire les handlers de commandes UI -> worker dans hook dédié.
- [x] Garder `App.tsx` comme composeur.
- [x] Vérifier aucune régression d’accès tabs par phase.

Sortie attendue:
- `App.tsx` allégé sur la partie navigation.

---

## PHASE 3 - Split App: onboarding (lore/guide/intro)

But: isoler la logique onboarding.

- [x] Extraire flow intro (lore -> guide) dans module/hook.
- [x] Extraire callbacks onboarding/settings (start/close/replay/skip/continue) dans hook dédié.
- [x] Extraire timers/keyboard onboarding.
- [x] Extraire la logique spotlight guide (scroll + rect) dans hook dédié.
- [x] Brancher overlays existants sans changer le comportement.
- [x] Vérifier replay lore/tutorial depuis settings.

Sortie attendue:
- onboarding lisible et testable indépendamment.

---

## PHASE 4 - Dashboard tab en sous-modules

But: découper le gros panneau dashboard.

- [x] Séparer `CoreOpsPanel`.
- [x] Séparer `UpgradesPanel`.
- [x] Séparer `ConsolePanel`.
- [x] Garder `DashboardTabPanel` en composition simple.

Sortie attendue:
- composants ciblés par fonctionnalité (plus simple pour modifications locales).

---

## PHASE 5 - Worker economy modulaire

But: clarifier un domaine critique de pacing.

- [x] Créer `economy/helpers.ts`.
- [x] Créer `economy/deriveRates.ts`.
- [x] Créer `economy/tick.ts`.
- [x] Créer `economy/commands.ts`.
- [x] Garder un point d’entrée `economy/index.ts`.

Sortie attendue:
- économie découpée par responsabilité, sans changer les règles gameplay.

---

## PHASE 6 - Worker narrative modulaire

But: rendre messages/lore rewards plus faciles à faire évoluer.

- [x] Créer `narrative/templates.ts`.
- [x] Créer `narrative/rewards.ts`.
- [x] Créer `narrative/generation.ts`.
- [x] Créer `narrative/commands.ts`.
- [x] Garder un point d’entrée `narrative/index.ts`.

Sortie attendue:
- pipeline message clair (sélection -> reward -> génération -> action).

---

## PHASE 7 - Documentation cible

But: 1 entrée claire + sous-docs spécialisés.

- [x] Faire du README racine l’entrée principale (avec redirection explicite docs).
- [x] Structurer `docs/` par thèmes: overview, architecture, gameplay, narrative, tutorial.
- [x] Ajouter "où modifier quoi" (phase, investissement, war, matrix, messages).
- [x] Conserver tracker/handoff comme références transverses.

Sortie attendue:
- agent onboarding immédiat, navigation doc claire.

---

## PHASE 8 - Consolidation finale

But: garantir la stabilité et fermer le chantier.

- [x] Revue imports/chemins + nettoyage doublons résiduels.
- [x] Modulariser le CSS reboot en modules thematiques (`src/styles/*`) avec `src/index.css` en point d'entree.
- [ ] Validation complète finale (bloquee par ENOPRO terminal sur lint/build/balance:sim).
- [ ] Mise à jour de ce fichier (fermeture + état final).

Sortie attendue:
- structure modulaire propre, maintenable, et validée.

---

## Journal de progression

- 2026-04-16: démarrage implémentation, baseline restaurée (`App.tsx` unique, erreurs TS = 0).
- 2026-04-16: extraction de la config navigation/guide/unlock vers `src/app/navigationConfig.ts` et rebranchement de `App.tsx`.
- 2026-04-16: extraction du state d'onglets dashboard vers `src/app/useDashboardTabState.ts` (gating par phase centralisé).
- 2026-04-16: extraction de l'état onboarding (intro + guide) vers `src/app/useOnboardingState.ts`.
- 2026-04-16: extraction des raccourcis clavier gameplay vers `src/app/useGameplayHotkeys.ts`.
- 2026-04-16: extraction spotlight guide vers `src/app/useGuideSpotlight.ts`.
- 2026-04-16: extraction des audio cues sur logs vers `src/app/useAudioLogCues.ts`.
- 2026-04-16: extraction de la logique d'unlock hints par phase vers `src/app/usePhaseUnlockHints.ts` (App allégé, comportement conservé).
- 2026-04-16: extraction des handlers de commandes UI -> worker vers `src/app/useGameActionHandlers.ts` (scan/exploit/cashflow/messages/war/matrix centralisés).
- 2026-04-16: extraction des callbacks onboarding/settings vers `src/app/useOnboardingActions.ts` (guide+lore+settings centralisés, App allégé).
- 2026-04-16: extraction du rendu de navigation des onglets vers `src/components/tabs/DashboardTabsNav.tsx` (App encore plus composeur).
- 2026-04-16: split complet `DashboardTabPanel` en `CoreOpsPanel`, `UpgradesPanel`, `ConsolePanel` sous `src/components/tabs/dashboard/`.
- 2026-04-16: split complet du domaine economy vers `src/worker/domain/economy/` (`helpers`, `deriveRates`, `tick`, `commands`, `index`).
- 2026-04-16: split complet du domaine narrative vers `src/worker/domain/narrative/` (`templates`, `rewards`, `generation`, `commands`, `index`).
- 2026-04-16: phase documentation cible completee (`docs/INDEX.md` thematise, `docs/project/WHERE_TO_EDIT.md`, references handoff/project alignees).
- 2026-04-16: revue imports/chemins post-split worker effectuee (suppression des references monolithiques obsoletees).
- 2026-04-16: extraction read-gate lore vers `src/app/useOnboardingLoreReadGate.ts` (timer min lecture, blocage continue avant delai).
- 2026-04-16: extraction raccourcis clavier onboarding vers `src/app/useOnboardingKeyboardShortcuts.ts` (lore + guide overlays).
- 2026-04-16: replay lore/tutorial revalide via handlers settings + read-gate reinitialise sur `introStep='lore'`.
- 2026-04-16: CSS reboot decompose sous `src/styles/` (foundation/shell/controls/dashboard/overlays/motion/responsive) avec `src/index.css` reduit a des imports.
- 2026-04-16: validations terminal lint/build/balance:sim retentees (run_in_terminal + task runner) mais toujours bloquees par ENOPRO sur le workspace reboot.
