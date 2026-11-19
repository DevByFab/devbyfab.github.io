# État des lieux — 19 novembre 2026

Audit fait en lisant le code et en lançant le jeu. Ce document complète `REFONTE_TRACKER.md`, qui s'arrête au 20 avril 2026 et ne reflète plus la réalité.

Dernière vraie session de développement : 5 mai 2026 (« P2 refont »). Le commit du 11 septembre est une passe de performance.

## Ce qui a été vérifié aujourd'hui

| Contrôle | Résultat |
| --- | --- |
| `npm run lint` | OK, 0 erreur |
| `tsc -b` (types) | OK |
| `npm run build` | OK (voir « Environnement » pour Windows) |
| Le jeu démarre dans Chrome | OK : le worker se lance, la cinématique de lore s'affiche, 0 erreur console |
| Textes en français | OK après correction (voir plus bas) |
| `npm run balance:sim` | Réécrit : mesure fiable (voir « Équilibrage ») |

## Ce qui existe (preuves dans le code)

- Architecture : moteur dans un Web Worker, protocole typé UI/worker, sauvegarde automatique toutes les 2 s, export/import en Base64.
- 6 phases P0 à P5 avec conditions de déblocage (`src/worker/domain/phases/definitions/`).
- Économie : scan/exploit, monétisation, investissement.
- P2 « Cashflow » : blanchiment, profils de risque, entreprises-écrans (`frontBusinesses.ts`), risque FBI avec contre-mesure active.
- Guerre/chaleur (`war.ts`), Matrice (`matrix.ts`) : mécaniques de base présentes.
- Messages : génération, traitement, quarantaine, récompenses par phase.
- Interface : tableau de bord + onglets Cashflow, Messages, Guerre, Matrice, réglages, audio (6 sons), tutoriel guidé v1.
- Cinématique de lore P0 : 5 scènes dessinées en canvas.

## Ce qui manque ou reste faible

| Sujet | État réel | Cible du projet |
| --- | --- | --- |
| Améliorations | **13 chaînes / 28 niveaux**, dont 3 « lore ». Rien n'est découvert à partir de la phase P4 (index 4) ni P5. | 40 à 60 améliorations |
| Fins du jeu | **Aucun code de fin.** Le jeu n'a pas de conclusion. | 3 fins majeures + 1 mauvaise fin |
| Narration | 11 modèles de messages seulement, pas de branches avec conséquences | M5 : narration à embranchements |
| Tutoriel | v1 seulement (guide par sections) | M7 : tutoriel stratégique |
| Visuels guerre/matrice | pas de couches visuelles dédiées | M6.1 |
| Durée de partie | **mesurée : aucune partie finissable au rythme normal** | 3 à 5 h (décidé le 19 nov.) |
| Signal vers le portfolio | l'ancien jeu écrivait `infiniteBotnet.portfolioSignal.v1` ; le reboot ne l'écrit pas | à décider |

## Équilibrage : mesure réelle (lot L1, 19 nov. 2026)

Le joueur automatique a été réécrit (`src/worker/sim/balanceHarness.ts`). Il joue avec les mêmes fonctions que le worker (même boucle, mêmes commandes), avec un hasard reproductible. Commande : `npm run balance:sim -- --seeds=3 --hours=10 [--step=100] [--trace]`.

**Résultat au vrai rythme du jeu (ticks de 100 ms), 3 graines × 3 niveaux de joueur, limite 10 h :**

| Mesure | Résultat |
| --- | --- |
| Parties terminées | **0 sur 9** |
| P1 « Automation » atteinte | vers 43 min |
| P2 « Cashflow » atteinte | **jamais** en 10 h |
| Argent gagné pendant 10 h | **0** |
| Bots après 10 h | environ 10 500 (la P3 en demande 420 000) |

### Cause 1 : l'argent n'arrive jamais à vitesse normale
`scalePerSecond` (`domain/economy/helpers.ts`) calcule `débit × durée du tick ÷ 1000` en division entière. Avec un tick de 100 ms, un débit de 2 par seconde donne `2 × 100 / 1000 = 0`. Les petits débits ne produisent rien, et le résultat dépend de la durée du tick. En mode turbo (ticks plus longs) l'argent arrive, ce qui masque le défaut quand on teste en accéléré.

### Cause 2 : la croissance automatique est inaccessible
Sans l'amélioration « Exploit Daemon » (6 500 bots + 1 900 d'argent), la seule source de bots est le geste manuel : environ 1 000 bots par heure, quel que soit le niveau du joueur (le geste est limité par un délai de 2 s). Il faut donc 6 heures juste pour pouvoir l'acheter, et l'argent manque de toute façon (cause 1).

### Autres constats
- Le niveau du joueur (détendu ou concentré) ne change rien aux résultats : tout est limité par le délai du geste manuel. Le jeu ne récompense pas l'attention.
- Les paliers P3 à P5 (420 000, 18 millions, 480 millions de bots) sont hors de portée de cette courbe.
- Les phases P3 à P5 n'ont donc jamais pu être testées avec cette économie : leur équilibrage est entièrement inconnu.

## Environnement

- Windows : `npm ci` n'installe pas le module natif de rolldown. Contournement : `npm install --no-save @rolldown/binding-win32-x64-msvc@<version de rolldown>`. Le fichier `package-lock.json` ne contient sans doute que les modules Linux.
- Vite 8 demande Node ≥ 22.12 ; la machine a 22.11.

## Corrigé aujourd'hui

- `balance:sim` pointait vers `src/sim/` qui n'existe plus : chemin corrigé (`src/worker/sim/`).
- 4 fichiers en double inutilisés dans `src/app/` supprimés (seules les versions de `src/app/hooks/` sont importées).
- Les textes du jeu sont maintenant dans `src/content/i18n/{fr,en}.json`, séparés de ceux du portfolio. Avant, le jeu lisait les `i18n/*.json` du site, et le nettoyage du site a supprimé les clés `reboot.*` (textes affichés comme `reboot.overlay.lore.title`). Corrigé avant toute mise en ligne.

## Proposition de plan pour finir le jeu

1. ~~Réparer l'instrument de mesure~~ : fait (lot L1). Voir `docs/design/GAME_DESIGN_V2.md` pour la suite.
2. **Dérouler la partie à la main** de P0 à P5 avec le mode turbo, et noter chaque blocage ou chiffre absurde. C'est ce qui dira vraiment « où j'en suis ».
3. **Écrire le contenu manquant** : améliorations P3 à P5, puis les fins.
4. **Recaler la durée** sur la cible (12 à 20 h, ou réduire la cible : à décider).
5. **Tutoriel v2** et narration à embranchements en dernier.
