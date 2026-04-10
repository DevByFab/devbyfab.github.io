# The Infinite BotNet - Phases, Prerequisites, Upgrades, Features

This file documents the current long-session progression model implemented in V1 engine.

## Phase Ladder (by bot count)
1. `Garage`: >= 0 bots
2. `Automation`: >= 100 bots
3. `Monetization`: >= 10,000 bots
4. `Botnet War`: >= 1,000,000 bots
5. `Infrastructure`: >= 50,000,000 bots
6. `Opinion Ops`: >= 500,000,000 bots
7. `Machine Awakening`: >= 2,000,000,000 bots
8. `Biological Barrier`: >= 8,000,000,000 bots
9. `Singular Intelligence`: >= 50,000,000,000 bots
10. `Matrix Exit`: >= 1,000,000,000,000 bots

No hard ending is enforced; progression can continue indefinitely.

## Core Loop Prerequisites
1. `Scan target` requires no prereq.
2. `Manual exploit` requires at least 1 queued IP and cooldown ready.
3. `Monetization toggle` appears/works once the market unlock threshold is reached (10000 bots).
4. `Investment lab` appears/works after buying `dark-auction` and reaching 25000 bots.

## Upgrade Catalog (Bots)
All items below follow the same rule:
- Item appears only when all prerequisites are met.
- Item disappears after purchase.

1. `python-scanner`
- Cost: 10 Bots
- Appears at: 10 Bots
- Requires items: none
- Effect: +1 auto scan/sec

2. `default-wordlist`
- Cost: 40 Bots
- Appears at: 40 Bots
- Requires items: python-scanner
- Effect: exploit cooldown reduced, success rate increased

3. `rapid-loader`
- Cost: 90 Bots
- Appears at: 90 Bots
- Requires items: default-wordlist
- Effect: faster manual target flow + exploit cadence

4. `async-daemon`
- Cost: 180 Bots
- Appears at: 180 Bots
- Requires items: rapid-loader
- Effect: +1 auto exploit/sec

5. `worm-fabric`
- Cost: 1200 Bots
- Appears at: 1200 Bots
- Requires items: async-daemon
- Effect: +4 auto scan/sec, +2 auto exploit/sec

6. `stealth-c2`
- Cost: 10000 Bots
- Appears at: 10000 Bots
- Requires items: worm-fabric
- Effect: exploit reliability boost, monetization unlock path

7. `ai-orchestrator`
- Cost: 80000 Bots
- Appears at: 80000 Bots
- Requires items: stealth-c2
- Effect: large automation boost (scan/exploit/reliability)

8. `infect-boost-1`
- Cost: 25000 Bots
- Appears at: 25000 Bots
- Requires items: stealth-c2
- Effect: exploit reliability boost

9. `infect-boost-2`
- Cost: 50000 Bots
- Appears at: 50000 Bots
- Requires items: infect-boost-1
- Effect: exploit reliability boost

10. `infect-boost-3`
- Cost: 100000 Bots
- Appears at: 100000 Bots
- Requires items: infect-boost-2
- Effect: exploit reliability boost

11. `scan-cluster-1`
- Cost: 180000 Bots
- Appears at: 180000 Bots
- Requires items: ai-orchestrator
- Effect: +12 auto scan/sec

12. `scan-cluster-2`
- Cost: 360000 Bots
- Appears at: 360000 Bots
- Requires items: scan-cluster-1
- Effect: +18 auto scan/sec

13. `exploit-swarm-1`
- Cost: 220000 Bots
- Appears at: 220000 Bots
- Requires items: ai-orchestrator
- Effect: +4 auto exploit/sec

14. `exploit-swarm-2`
- Cost: 480000 Bots
- Appears at: 480000 Bots
- Requires items: exploit-swarm-1
- Effect: +7 auto exploit/sec

## Market Feature Catalog (Dark Money)
All items below follow the same rule:
- Item appears only when all prerequisites are met.
- Item disappears after purchase.

1. `dark-auction`
- Cost: 500 $
- Appears at: 15000 Bots
- Requires items: stealth-c2
- Effect: monetization multiplier + conversion boost

2. `quantum-broker`
- Cost: 5000 $
- Appears at: 120000 Bots
- Requires items: dark-auction
- Effect: major monetization multiplier boost

3. `zero-day-toolkit`
- Cost: 2500 $
- Appears at: 50000 Bots
- Requires items: stealth-c2
- Effect: instant +5000 Bots burst

4. `market-futures-1`
- Cost: 20000 $
- Appears at: 300000 Bots
- Requires items: quantum-broker
- Effect: extra monetization multiplier + conversion speed

5. `market-futures-2`
- Cost: 70000 $
- Appears at: 700000 Bots
- Requires items: market-futures-1
- Effect: late-stage monetization boost

## Investment Feature Catalog (Dark Money)
All items below follow the same rule:
- Item appears only when all prerequisites are met.
- Item disappears after purchase.

1. `venture-desk`
- Cost: 3000 $
- Appears at: 25000 Bots
- Requires items: dark-auction
- Effect: larger investment tranche + better stable return

2. `risk-hedger`
- Cost: 12000 $
- Appears at: 90000 Bots
- Requires items: venture-desk
- Effect: stronger aggressive return with reduced volatility

3. `quant-fund`
- Cost: 48000 $
- Appears at: 300000 Bots
- Requires items: risk-hedger
- Effect: large stable growth boost + bigger tranche

4. `ai-trader`
- Cost: 150000 $
- Appears at: 800000 Bots
- Requires items: quant-fund
- Effect: endgame investment scaling boost

## Visibility Rule for Future Features
For every future functionality:
1. Add a catalog entry with explicit prereqs (`requireBots`, `requireItems`, resource `costType`).
2. Keep feature hidden until prereqs are met.
3. Hide feature permanently after purchase if one-time upgrade.
4. Keep parent section hidden until at least one child feature is unlocked.
