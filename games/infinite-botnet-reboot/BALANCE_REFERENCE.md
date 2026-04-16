# Infinite BotNet Reboot - Balance Reference

Balance reference moved to:
- `docs/balance/BALANCE_REFERENCE.md`

This root file is kept as a compatibility entrypoint.
# Infinite BotNet Reboot - Balance Reference

Balance reference moved to:
- `docs/balance/BALANCE_REFERENCE.md`

This root file is kept as a compatibility entrypoint.
# Infinite Botnet Reboot - Reference progression (upgrades + phases)

Ce document sert a jauger la vitesse de progression sans lancer une partie.
Toutes les valeurs ci-dessous viennent directement du code courant.

## Sources utilisees
- games/infinite-botnet-reboot/src/worker/domain/upgrades.ts
- games/infinite-botnet-reboot/src/worker/domain/phases.ts

## Regles de disponibilite des upgrades
- Une chaine apparait si phase.index >= discoverPhaseIndex (ou si deja achetee auparavant).
- Un niveau est achetable seulement si:
  - tous ses prerequis sont valides
  - et les ressources de cout sont disponibles
- Les champs en bps sont des basis points:
  - 100 bps = 1%
  - exemple autoScanBps +380 = +3.80%
- Cas cooldown exploit:
  - manualExploitCooldownReductionBps 2500 = -25% du cooldown de base
  - manualExploitCooldownReductionBps 5000 = -50% du cooldown de base
  - manualExploitCooldownDisable 1 = cooldown retire

## Phases disponibles et prerequis de debloquage

| Index | ID | Label | Prerequis pour debloquer la phase |
|---|---|---|---|
| 0 | garage | P0 Garage | bots >= 0 |
| 1 | automation | P1 Recon Automation | bots >= 180, scans >= 80, exploitSuccesses >= 30 |
| 2 | monetization | P2 Cashflow Hijack | bots >= 6500, scans >= 650, darkMoney >= 1700, exploitSuccesses >= 240 |
| 3 | botnet-war | P3 Botnet War | bots >= 420000, scans >= 2000, darkMoney >= 26000, messagesProcessed >= 8 |
| 4 | matrix-breach | P4 Matrix Edge | bots >= 18000000, portfolio >= 190000, warWins >= 18, messagesProcessed >= 28 |
| 5 | singularity-core | P5 Singularity Core | bots >= 480000000, darkMoney >= 11000000, warWins >= 65, messagesProcessed >= 65 |

### Note importante sur la barre de progression phase
La progression phase (progressBps) est calculee principalement sur le nombre de bots entre la phase courante et la suivante.
Tu peux donc etre proche de 100% en bots mais encore bloque par un autre prerequis (messages, warWins, scans, etc.).

## Ameliorations actuellement disponibles

Nombre total de niveaux upgrades: 18

### 1) Probe Cache (chainId: econ-probe-cache)
- Categorie: economy
- Apparition de la chaine: phase >= 0 (P0)
- Resume: Augmente la cadence de scan passif pour alimenter la file de cibles.

| Niveau | Cout bots | Cout darkMoney | Prerequis d achat | Effets |
|---|---:|---:|---|---|
| 1 | 120 | 0 | scans >= 20, exploitSuccesses >= 8 | autoScanBps +380 |
| 2 | 1800 | 420 | phase >= 1, scans >= 180, exploitSuccesses >= 90 | autoScanBps +520 |
| 3 | 22000 | 6200 | phase >= 2, scans >= 720, exploitSuccesses >= 420 | autoScanBps +680 |

### 2) Cooldown Rig (chainId: econ-cooldown-rig)
- Categorie: economy
- Apparition de la chaine: phase >= 0 (P0)
- Resume: Tier cooldown: -25%, puis -50% supplementaires, puis suppression totale.

| Niveau | Cout bots | Cout darkMoney | Prerequis d achat | Effets |
|---|---:|---:|---|---|
| 1 | 360 | 140 | scans >= 70, exploitSuccesses >= 35 | manualExploitCooldownReductionBps +2500 |
| 2 | 8400 | 2400 | phase >= 1, scans >= 280, exploitSuccesses >= 180 | manualExploitCooldownReductionBps +5000 |
| 3 | 420000 | 95000 | phase >= 2, scans >= 1800, exploitSuccesses >= 1200 | manualExploitCooldownDisable +1 |

### 3) Exploit Daemon (chainId: econ-exploit-daemon)
- Categorie: economy
- Apparition de la chaine: phase >= 1 (P1)
- Resume: Debloque puis accelere les exploits passifs pour les longues sessions.

| Niveau | Cout bots | Cout darkMoney | Prerequis d achat | Effets |
|---|---:|---:|---|---|
| 1 | 6000 | 1800 | phase >= 1, scans >= 300, exploitSuccesses >= 220 | autoExploitUnlock +1, autoExploitBps +450 |
| 2 | 80000 | 24000 | phase >= 2, scans >= 900, exploitSuccesses >= 700 | autoExploitBps +700, exploitChanceBps +80 |
| 3 | 950000 | 260000 | phase >= 3, scans >= 2800, exploitSuccesses >= 2800 | autoExploitBps +950, exploitChanceBps +130 |

### 4) Exploit Protocol (chainId: econ-exploit-protocol)
- Categorie: economy
- Apparition de la chaine: phase >= 0 (P0)
- Resume: Renforce la precision exploit et augmente le gain par scan manuel.

| Niveau | Cout bots | Cout darkMoney | Prerequis d achat | Effets |
|---|---:|---:|---|---|
| 1 | 500 | 0 | exploitSuccesses >= 25 | exploitChanceBps +130, manualScanGainFlat +1 |
| 2 | 7500 | 1800 | phase >= 1, scans >= 200, exploitSuccesses >= 150 | exploitChanceBps +170, manualScanGainFlat +1 |
| 3 | 110000 | 34000 | phase >= 2, scans >= 850, exploitSuccesses >= 650 | exploitChanceBps +220, manualScanGainFlat +1 |
| 4 | 1300000 | 420000 | phase >= 3, scans >= 2600, exploitSuccesses >= 2600 | exploitChanceBps +280, manualScanGainFlat +1 |

### 5) Black Ledger (chainId: econ-black-ledger)
- Categorie: economy
- Apparition de la chaine: phase >= 2 (P2)
- Resume: Renforce le rendement financier global et la stabilite de maintenance.

| Niveau | Cout bots | Cout darkMoney | Prerequis d achat | Effets |
|---|---:|---:|---|---|
| 1 | 0 | 14000 | phase >= 2, darkMoney >= 8000 | moneyYieldBps +180, maintenanceReductionBps +350 |
| 2 | 0 | 160000 | phase >= 3, darkMoney >= 120000 | moneyYieldBps +240, maintenanceReductionBps +550 |
| 3 | 0 | 1300000 | phase >= 4, darkMoney >= 900000 | moneyYieldBps +320, maintenanceReductionBps +800 |

### 6) Backbone Overclock (chainId: econ-backbone-overclock)
- Categorie: economy
- Apparition de la chaine: phase >= 3 (P3)
- Resume: Palier endgame global pour lisser la progression vers les dernieres phases.

| Niveau | Cout bots | Cout darkMoney | Prerequis d achat | Effets |
|---|---:|---:|---|---|
| 1 | 2800000 | 650000 | phase >= 3, scans >= 3500, exploitSuccesses >= 2000 | autoScanBps +900, autoExploitBps +600, moneyYieldBps +180 |
| 2 | 24000000 | 4200000 | phase >= 4, scans >= 6500, exploitSuccesses >= 5000 | autoScanBps +1200, autoExploitBps +850, moneyYieldBps +220, maintenanceReductionBps +600 |

## Totaux utiles pour estimer le pacing

### Cout cumule pour acheter tous les niveaux upgrades
- Bots total: 29706680
- DarkMoney total: 7169760
- WarIntel total: 0
- Hz total: 0
- Computronium total: 0

### Plus gros prerequis de debloquage upgrades
- phase >= 4 (dernier niveau Backbone Overclock)
- scans >= 6500
- exploitSuccesses >= 5000
- darkMoney >= 900000 (prerequis de niveau, pas le cout)

### Plus gros prerequis de phase (pour atteindre P5)
- bots >= 480000000
- darkMoney >= 11000000
- warWins >= 65
- messagesProcessed >= 65

## Lecture rapide pour ton objectif "vitesse du jeu"
- Debut (P0 -> P2): surtout scans/exploitSuccesses + accumulation bots.
- Milieu (P2 -> P3): darkMoney devient un vrai gate, plus messagesProcessed.
- Late (P3 -> P5): gros mur bots + warWins + messagesProcessed.
- Les upgrades eco reduisent la friction, mais la montee vers P5 reste fortement gatee par les prerequis de phase (pas seulement par les couts d upgrades).
