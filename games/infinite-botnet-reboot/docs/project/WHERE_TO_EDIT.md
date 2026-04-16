# Where To Edit By System

Guide rapide pour savoir ou modifier chaque systeme sans casser les frontieres UI/Worker.

## Regle de base

- Gameplay, maths, progression et cooldowns vivent dans le worker (`src/worker/domain/*`).
- UI React lit uniquement le snapshot et envoie des commandes typees.
- Toute evolution du snapshot doit etre synchronisee dans:
  - `src/worker/state.ts`
  - `src/game/types.ts`
  - `toSnapshot` dans `src/worker/state.ts`

## Phase progression (P0 -> P5)

- Resolver de phase: `src/worker/domain/phases/`
- Refresh derive + synchronisation tick/command: `src/worker/engine/syncDerivedState.ts`
- Gating UI des onglets: `src/app/useDashboardTabState.ts`, `src/components/tabs/DashboardTabsNav.tsx`

## Investissement / Cashflow

- Tick economie et derive rates: `src/worker/domain/economy/deriveRates.ts`, `src/worker/domain/economy/tick.ts`
- Commandes invest/monetize/cashout: `src/worker/domain/economy/commands.ts`
- UI Cashflow tab: `src/components/tabs/CashflowTabPanel.tsx`

## War / Heat

- Tick et commandes war: `src/worker/domain/war.ts`
- UI War tab: `src/components/tabs/WarTabPanel.tsx`

## Matrix

- Tick et commandes matrix: `src/worker/domain/matrix.ts`
- UI Matrix tab: `src/components/tabs/MatrixTabPanel.tsx`

## Messages / Narrative

- Generation (bucket + cadence + creation): `src/worker/domain/narrative/generation.ts`
- Templates et filtrage de reward par phase: `src/worker/domain/narrative/templates.ts`
- Application des rewards positifs/negatifs: `src/worker/domain/narrative/rewards.ts`
- Commandes process/quarantine: `src/worker/domain/narrative/commands.ts`
- Templates FR: `src/content/fr/narrativeCatalog.ts`
- UI Messages tab: `src/components/tabs/MessagesTabPanel.tsx`

## Upgrades et prerequis

- Definition des chains et prerequis: `src/worker/domain/upgrades/chains.ts`
- Effets gameplay et derivation: `src/worker/domain/upgrades/effects.ts`
- Achat + validation: `src/worker/domain/upgrades/purchase.ts`
- Affichage et formatting UI: `src/app/upgrades.ts`, `src/components/tabs/dashboard/UpgradesPanel.tsx`

## Onboarding / Tutorial

- State onboarding: `src/app/useOnboardingState.ts`
- Actions lore/tutorial/settings: `src/app/useOnboardingActions.ts`
- Spotlight guide: `src/app/useGuideSpotlight.ts`
- Overlays: `src/components/overlays/GuideOverlay.tsx`, `src/components/overlays/SettingsOverlay.tsx`

## Protocol UI <-> Worker

- Types de commandes et messages: `src/game/protocol.ts`
- Dispatch des commandes worker: `src/worker/engine/commandDispatcher.ts`
- Bridge React -> worker: `src/hooks/useGameWorker.ts`

## Styles / CSS

- Entrypoint CSS (imports seulement): `src/index.css`
- Tokens + global + scrollbars: `src/styles/00-foundation.css`
- Shell app + top bar + grids structurels: `src/styles/10-shell.css`
- Boutons, meters, formulaires, metrics: `src/styles/20-controls.css`
- Dashboard resources/messages/upgrades/console: `src/styles/30-dashboard.css`
- Overlays base + settings: `src/styles/40-overlays.css`
- Overlays lore cinematique + bridge: `src/styles/41-overlays-lore.css`
- Overlays guide spotlight: `src/styles/42-overlays-guide.css`
- Keyframes + reduced motion: `src/styles/50-motion.css`
- Breakpoints responsive: `src/styles/60-responsive.css`
