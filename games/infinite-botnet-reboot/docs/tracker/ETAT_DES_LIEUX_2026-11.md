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
| `npm run balance:sim` | Se lance, mais **ne mesure rien d'utile** (voir « Équilibrage ») |

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
| Durée de partie | non mesurée de façon fiable | 12 à 20 h |
| Signal vers le portfolio | l'ancien jeu écrivait `infiniteBotnet.portfolioSignal.v1` ; le reboot ne l'écrit pas | à décider |

## Équilibrage : pourquoi `balance:sim` ne prouve rien

Le joueur automatique de `src/worker/sim/balanceHarness.ts` est périmé :

- il **n'achète aucune amélioration** (depuis avril, les améliorations coûtent des bots) ;
- il **arrête d'exploiter à 360 bots** (`bots < 360n`), donc il reste bloqué en P1 ;
- il **ne gère pas la phase P2** (pas de blanchiment, pas d'entreprises-écrans).

Résultat : 0 partie terminée sur 10. Ce n'est pas la preuve que le jeu est impossible à finir, c'est la preuve que le test n'est plus adapté.

Sonde rapide faite à la main (joueur automatique qui achète les améliorations, à titre indicatif seulement) :
la phase P1 dure environ 5 h 40 de temps simulé et la P2 est atteinte vers 6 h 30. En entrant en P2, le nombre de bots chute (5 974 à 2 324). À confirmer avec un vrai harness.

## Environnement

- Windows : `npm ci` n'installe pas le module natif de rolldown. Contournement : `npm install --no-save @rolldown/binding-win32-x64-msvc@<version de rolldown>`. Le fichier `package-lock.json` ne contient sans doute que les modules Linux.
- Vite 8 demande Node ≥ 22.12 ; la machine a 22.11.

## Corrigé aujourd'hui

- `balance:sim` pointait vers `src/sim/` qui n'existe plus : chemin corrigé (`src/worker/sim/`).
- 4 fichiers en double inutilisés dans `src/app/` supprimés (seules les versions de `src/app/hooks/` sont importées).
- Les textes du jeu sont maintenant dans `src/content/i18n/{fr,en}.json`, séparés de ceux du portfolio. Avant, le jeu lisait les `i18n/*.json` du site, et le nettoyage du site a supprimé les clés `reboot.*` (textes affichés comme `reboot.overlay.lore.title`). Corrigé avant toute mise en ligne.

## Proposition de plan pour finir le jeu

1. **Réparer l'instrument de mesure** : réécrire le joueur automatique (améliorations, P2, guerre, matrice) pour mesurer la vraie durée de partie.
2. **Dérouler la partie à la main** de P0 à P5 avec le mode turbo, et noter chaque blocage ou chiffre absurde. C'est ce qui dira vraiment « où j'en suis ».
3. **Écrire le contenu manquant** : améliorations P3 à P5, puis les fins.
4. **Recaler la durée** sur la cible (12 à 20 h, ou réduire la cible : à décider).
5. **Tutoriel v2** et narration à embranchements en dernier.
