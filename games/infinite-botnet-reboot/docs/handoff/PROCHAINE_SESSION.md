# Infinite BotNet Reboot — reprise de session

Mis à jour le 20 nov. 2026 (fin du lot L3). Remplace `AGENT_HANDOFF.md` (daté d'avril, périmé) pour savoir où on en est.
Lire aussi : `games/infinite-botnet-reboot/docs/design/GAME_DESIGN_V2.md` (conception validée) et `games/infinite-botnet-reboot/docs/balance/BALANCE_REFERENCE.md` (note L3 + tableau des phases à jour).

## Objectif
Finir le jeu : une partie de **3 à 5 h** avec **4 fins + 1 fin cachée**. Le héros a tout perdu (emploi, femme, garde du fils, logement) et devient hacker.
- Vengeance : racheter les biens de l'ancien propriétaire, avocats, récupérer la garde.
- Résilience : rembourser, construire écoles/hôpitaux/puits, ne garder que de quoi vivre.
- Folie : s'en prendre aux grandes entreprises puis aux pays, guerre, fin du monde.
- Prison (mauvaise fin, subie) : suspicion à 100 % puis arrestation, possible dès P2.
- Singularité (5e fin cachée, thème IA : Hz, matière cérébrale, computronium).
La voie est choisie explicitement au début de P4.

## Décisions déjà prises (ne pas rediscuter)
Nombres JS normaux (plus de bigint) · un seul argent (blanchiment supprimé, fait) · jeu en français d'abord, EN en repli · pas de push sans demande.

## État du code (branche `main`, L3 committé en local, **pas poussé**)
- L1 : joueur automatique `npm run balance:sim -- --seeds=3 --hours=10 [--skill=relaxed|normal|focused] [--step=100] [--trace [--every=<min>]] [--json]` (`src/worker/sim/balanceHarness.ts`). La trace affiche aussi les critères de phase qui manquent.
- L2 : bigint → number, une seule monnaie `money`, commerces-écrans, suspicion FBI (`riskModel.ts`), onglet Cashflow, catalogues de textes du jeu (`src/content/i18n/{fr,en}.json`).
- L3 (commit 22b8949) :
  - Exploit Daemon niveau 1 dès P0 : 100 bots, prérequis 60 scans + 120 exploits réussis. Il est acheté entre 8 et 10 min.
  - Croissance passive : `bots / 800` tentatives par seconde (`AUTO_EXPLOIT_DIVISOR` dans `deriveRates.ts`) + base `(phase+1)/4`. Le réseau double toutes les 11 à 15 min. Plus de seuil de 400 bots.
  - Les améliorations qui coûtaient des bots coûtent de l'argent, sauf Exploit Seed, Cooldown Primer, Scan Burst 1 et Daemon 1. Les 5 améliorations P0 « chères » (probe, pipeline, protocol 1, scan burst 2, macros) demandent P1.
  - Entretien : 1 palier = 16 000 bots (avant 4 000). Moteur et affichage utilisent la même fonction `botMaintenancePerSec` (l'interface affichait 4× trop).
  - Paliers : P2 3 500 bots · P3 100 000 bots + 12 000 argent · P4 5 M bots + portefeuille 190 000 + 18 victoires · P5 100 M bots + 10 M argent + 65 victoires. Plus de critère « scans » dans P2/P3.
- Vérifié : `eslint .`, `tsc -b`, `vite build`. Pas de test navigateur refait pour L3 (aucun changement d'interface).

## Mesure actuelle (`balance:sim --seeds=3 --hours=6`)
9 parties sur 9 terminées (atteinte de P5), entre 3 h 48 et 4 h 01. Médianes : P1 16 min · P2 50 · P3 1 h 52 · P4 3 h 00 · P5 3 h 48. Calendrier visé : 15 / 50 / 110 / 180 / 230 min → respecté.

## Points laissés de côté pendant L3 (à reprendre)
- **Le niveau du joueur ne change presque rien** (relaxed 4 h 01, focused 3 h 49) : la croissance est automatique. L'« attention » n'est pas récompensée. À traiter avec les décisions (chaleur, suspicion, voies) en L4/L5.
- **Revenus des commerces non modifiés** (6/14/30 par s, coûts 1 200/3 800/8 600) : utiles seulement les ~20 premières minutes de P3, puis négligeables face aux ~2 000 argent/s de la monétisation en fin de P3. Ils ajoutent du risque FBI pour un gain faible. Soit on les fait grossir avec la phase, soit on les rend nécessaires (critère de phase).
- Le critère de fin de la simulation est « atteindre P5 », pas « finir les 3 projets de P5 » (L4).
- Les améliorations `autoScanBps` / `autoExploitBps` pèsent peu ou pas : la file de cibles grossit sans limite (1e13+ en fin de partie) et seule la chance d'exploit compte. À régler avec le contenu d'améliorations (L5).
- Chaleur/guerre : coûts de purge et de renfort inchangés (24 000 argent à chaleur 7 200). La simulation purge dès 6 500 de chaleur (avant : 8 800, ce qui bloquait les victoires). P4/P5 n'ont jamais été jouées à la main.
- Suspicion max observée 9 900 (relaxed) : la prison n'existe pas encore, une saisie FBI retire 10 % de l'argent.

## Lots suivants
- L4 : voies + projets finaux, prison (compte à rebours d'arrestation), écran de choix en P4, fin cachée, objectif P0 « payer le loyer avant l'expulsion ». Mettre la simulation à jour : « terminé » = 3 projets de la voie.
- L5 : contenu (40 à 60 améliorations, P3 à P5 aujourd'hui vides ; messages à embranchements ; textes de fins).
- L6 : optimisation (snapshots ~4 Hz en diffs, rendu de l'onglet visible seulement, pas de 250 ms avec rattrapage, sauvegarde toutes les 10 s).
- L7 : tutoriel, cinématiques, finitions, partie complète jouée à la main.

## Nettoyage noté
`domain/economy/helpers.ts` garde des noms `maxBigInt` · les panneaux Guerre/Matrice utilisent encore `formatBigValue` pour des débits · avertissements de build sur `new URL("../../audio/...")` (dossier `audio/` en double entre la racine du jeu et `public/audio`) · le jeu n'écrit pas `infiniteBotnet.portfolioSignal.v1` (signal vers le portfolio, à décider) · `BALANCE_REFERENCE.md` : les tableaux d'améliorations datent d'avril.

## Règles de travail
Code, revue, refactor : skill **ponytail**. Tous les textes du jeu (messages, fins, UI) : skill **humanizer**, en français. Visuel du jeu : **ui-ux-pro-max** / **design-taste-frontend** en aide. Mettre à jour ce fichier à la fin de chaque lot. Fins de ligne : les fichiers du jeu sont en CRLF, à conserver (python `newline=''`).
