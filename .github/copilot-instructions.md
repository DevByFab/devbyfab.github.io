# Project Guidelines

## Code Style
- Keep changes aligned with each area of the repo:
  - Root site and `games/infinite-botnet`: vanilla HTML/CSS/JS patterns already in place.
  - `games/infinite-botnet-reboot`: React + TypeScript with ESLint and strict TS checks.
- In reboot, preserve typed UI/Worker boundaries through `src/game/protocol.ts` and `src/game/types.ts`.
- Keep narrative content edits in `src/content/fr/narrativeCatalog.ts` and route UI text through `useRebootI18n`.
- Avoid adding new dependencies unless they are clearly required for the task.

## Architecture
- Root (`/`) is a static portfolio site (`index.html`, `legal.html`, `css/`, `js/`, `project/`).
- `games/infinite-botnet/` is the legacy prototype (vanilla JS) used as reference.
- `games/infinite-botnet-reboot/` is the active codebase:
  - React UI layer (`src/App.tsx`, hooks in `src/hooks/`)
  - Typed protocol (`src/game/protocol.ts`)
  - Worker simulation engine (`src/worker/engine.worker.ts`)
  - Domain logic modules (`src/worker/domain/`)
  - Canonical state + snapshots (`src/worker/state.ts`)
- Treat worker state as source of truth; UI should only consume snapshots.

## Build and Test
- Run reboot commands from `games/infinite-botnet-reboot`:
  - `npm install`
  - `npm run dev`
  - `npm run lint`
  - `npm run build`
  - `npm run preview`
  - `npm run balance:sim`
- Do not validate reboot by opening `index.html` directly; use Vite (`npm run dev` or `npm run preview`) so module workers load correctly.
- Production base path defaults to `/games/infinite-botnet-reboot/`; set `VITE_PUBLIC_BASE` when targeting a different deploy path.

## Conventions
- Progression is phase-gated (`src/worker/domain/phases/`) and upgrades use strict prerequisite chains (`src/worker/domain/upgrades/`).
- Message rewards are phase-gated in `src/worker/domain/narrative.ts`.
- Keep pacing-sensitive changes validated with both `npm run lint` and `npm run balance:sim`.
- Use `games/infinite-botnet-reboot/docs/tracker/REFONTE_TRACKER.md` as roadmap source of truth.

## References
- Reboot runtime and structure: `games/infinite-botnet-reboot/docs/project/README.md`
- Balance tuning: `games/infinite-botnet-reboot/docs/balance/BALANCE_REFERENCE.md`
- Lore/cinematic blueprint: `games/infinite-botnet-reboot/docs/lore/LORE_AND_CINEMATIC_BLUEPRINT.md`
- Legacy progression docs: `games/infinite-botnet/PHASES_AND_PREREQUISITES.md`, `games/infinite-botnet/project.md`
