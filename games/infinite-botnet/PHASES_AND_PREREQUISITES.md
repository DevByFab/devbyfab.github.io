# The Infinite BotNet - Phases, Branches, War/Heat, Endings

This file documents the current progression model implemented in worker save version 3.

## Core Design Goals
- Long session pacing with regular decisions.
- Parallel upgrade choices at similar thresholds (no hard linear chain).
- Multiple economies: bots, dark money, portfolio, war intel, Hz, brain matter, computronium.
- Endgame routes that can alter portfolio presentation outside the game page.

## Phase Ladder (by bot count)
1. `Garage`: >= 0 bots
2. `Automation`: >= 100 bots
3. `Monetization`: >= 10,000 bots
4. `Botnet War`: >= 1,000,000 bots
5. `Cloud Dominion`: >= 50,000,000 bots
6. `Opinion Forge`: >= 500,000,000 bots
7. `Grid Overmind`: >= 2,000,000,000 bots
8. `Neural Breach`: >= 8,000,000,000 bots
9. `Singularity Core`: >= 50,000,000,000 bots
10. `Matrix Breach`: >= 1,000,000,000,000 bots

No hard ending is enforced. The run can keep scaling after route unlocks.

## Feature Unlock Rules
1. `Market` unlocks at 1,500 bots.
2. `Investment Lab` unlocks at 7,000 bots and at least 1,100 dark money.
3. `Relay Inbox` unlocks at 220 bots.
4. `Botnet War` unlocks at 750,000 bots.
5. `Frequency lattice` unlocks at 40,000,000 bots.
6. `Brain mining` unlocks at 7,000,000,000 bots.
7. `Computronium forge` unlocks at 40,000,000,000 bots.
8. `Matrix breach console` unlocks in Matrix Breach phase with at least 120 computronium.
9. `Endings panel` unlocks once at least one route condition is satisfied.

## Catalog Visibility Rules
1. Items become visible at `requireBots` threshold when parent feature is unlocked.
2. One-time items hide after purchase.
3. Repeatable items remain visible (`zero-day-toolkit`).
4. Main progression intentionally avoids strict `requireItems` chains.

## Economy Summary
- `Bots`: infection power and most early-mid costs.
- `Dark Money`: market/invest/war economy costs.
- `Portfolio`: investment growth pool.
- `War Intel`: earned from successful war strikes, used for route progression.
- `Relay Messages`: periodic intercepted packets that grant tactical boosts.
- `Hz`: high-frequency neural lattice output generated from large-scale bot pressure.
- `Brain Matter`: mined from Hz once neural phase is unlocked.
- `Computronium`: forged from brain matter + dark money for matrix operations.

## Advanced Late-Phase Loops
- `Botnet War+`: phase economy pulse can lease dark money for direct bot growth while monetization is active.
- `Cloud Dominion+`: portfolio scale can drip passive war intel.
- `Opinion Forge+`: high war streaks create extra heat pressure, demanding more disciplined scrub cadence.
- `Neural Breach+`: Hz converts to brain matter through neural mining throughput.
- `Singularity Core+`: brain matter + dark money forge computronium and feed extra Hz harmony output.
- `Matrix Breach`: stability decay, bypass windows, signed F12 injections, and backlash risk.

## Matrix Console Loop
- `ARM BYPASS`: spends Hz + computronium to open a short injection window.
- `INJECT PAYLOAD`: requires exact signed command (`inject <token> --f12`) and advances breach progress.
- `STABILIZE MATRIX`: spends dark money to recover matrix stability and lower heat.
- Stability collapse triggers watchdog backlash (bot purge + progress regression).
- Full breach completion force-unlocks triad route state and grants a late-run reward burst.

## Heat / War Loop
- Heat range: 0-10000.
- Heat rises with high automation pressure and monetization.
- Heat can be reduced by `SCRUB TRACE SIGNATURES`.
- `DEFENSE PULSE` spends dark money (+ intel at high pressure) to deploy a timed mitigation field.
- Very high heat triggers detection pressure events that can purge bots.
- War strikes consume bots, then resolve as win/loss for large reward swings.

## Branch Highlights

### Upgrade branch (bots)
- Early acceleration: `python-scanner`, `default-wordlist`, `rapid-loader`, `async-daemon`.
- Mid scaling: `worm-fabric`, `stealth-c2`, `infect-*`, `ai-orchestrator`.
- Late pair choices: `scan-cluster-*` and `exploit-swarm-*`.
- High tier route setup: `ghost-protocol`, `neural-lure`.

### Market branch (dark money)
- Core multipliers: `dark-auction`, `quantum-broker`, `market-futures-*`.
- Repeatable catch-up lever: `zero-day-toolkit`.

### Investment branch (dark money)
- Portfolio progression: `venture-desk`, `risk-hedger`, `quant-fund`, `ai-trader`.

### War branch (bots + dark money)
- Heat control and detection defense: `heat-sink-array`, `c2-obfuscator`.
- Strike power and rewards: `war-forge`, `predatory-proxy`.

## Ending Routes (Matrix Breach phase)
1. `Ghost Exit`
- Low heat discipline and reliable war intel progression.
- Intended fantasy: silent exfiltration / stealth supremacy.

2. `Overmind Ascension`
- High-heat domination with heavy war victories.
- Intended fantasy: hostile AI takeover.

3. `Archivist Accord`
- Economic mastery (dark money + portfolio) with controlled war losses.
- Intended fantasy: continuity protocol preserving the archive.

When all three routes are unlocked, the `Triad Sigil` triggers as a hidden meta-state.

## Portfolio Easter Egg Signal
The game writes a localStorage signal (`infiniteBotnet.portfolioSignal.v1`) containing:
- selected ending route
- unlocked route map
- triad state
- takeover level

The portfolio home page reads this signal and adapts visuals/banners accordingly.

## Notes For Future Features
1. Keep adding parallel choices (2-3 options per tier) rather than single mandatory ladders.
2. Keep one repeatable helper in each major economy branch.
3. Expand war subsystem with defenses, rival archetypes, and timed world events.
4. Expand endings with optional route-specific mini-objectives.
