# Infinite BotNet — Conception v2 (partie de 3 à 5 heures)

Statut : **validé le 19 nov. 2026**. Lots L1 et L2 terminés ; lot L3 (courbe d'équilibrage) à lancer.
Décisions prises avec Fabio :
- durée de partie 3 à 5 h ;
- quatre fins (Vengeance, Résilience, Folie, Prison) ;
- **le thème IA / singularité est gardé comme 5e fin cachée** (pas supprimé) ;
- voie choisie **explicitement en P4** ;
- nombres JavaScript normaux à la place de `bigint` ;
- on commence par **mesurer** (lot L1).

## 1. Constat sur la version actuelle

- Prévue pour 12 à 20 h, avec des paliers de 420 000, 18 millions puis 480 millions de bots (courbe « Universal Paperclips »). Trop long et trop abstrait pour 3 à 5 h.
- 10 ressources en parallèle (bots, cibles, argent sale, argent « dark », argent propre, portefeuille, Hz, matière cérébrale, computronium, renseignement) : beaucoup trop pour un joueur qui découvre le jeu.
- La fin de partie actuelle parle d'IA (« Singularity Core »). Tes fins sont humaines (propriétaire, femme, fils, prison). Les deux histoires ne se rejoignent pas.
- Les nombres sont des `bigint` partout : lourd à écrire, lourd à tester, inutile à cette échelle.
- Le moteur envoie l'état complet à l'interface 10 fois par seconde, et l'interface se redessine à chaque message.
- Aucun test automatique fiable de la durée de partie (le script d'équilibrage est périmé).

## 2. Principe de la boucle

Trois temps qui se répètent à chaque phase :

1. **Agir à la main** (scanner, exploiter) tant que c'est nouveau et rapide.
2. **Automatiser** (une amélioration remplace le geste) pour libérer l'attention.
3. **Décider** (un risque à arbitrer : chaleur, suspicion, argent sale) pour que l'automatisation ne suffise jamais seule.

Chaque phase introduit **une** mécanique nouvelle, la rend utile, puis la relie à la suivante. Le joueur doit toujours avoir un objectif visible à moins de 5 minutes.

## 3. Calendrier cible (partie médiane : environ 4 h 10)

| Phase | Durée | Objectif pour le joueur | Mécanique nouvelle |
| --- | --- | --- | --- |
| P0 Garage | 0 à 15 min | **Payer le loyer avant l'expulsion** (le lien avec le lore) | scan, exploit |
| P1 Automatisation | 15 à 50 min | Faire tourner le réseau seul | améliorations, monétisation |
| P2 Cashflow | 50 à 110 min | Transformer l'argent sale en argent utilisable sans se faire repérer | blanchiment, suspicion FBI |
| P3 Empire | 110 à 180 min | Posséder des activités légales de façade, tenir face aux rivaux | entreprises-écrans, guerre, chaleur |
| P4 Pouvoir | 180 à 230 min | **Choisir sa voie** (Vengeance, Résilience ou Folie) | projets de fin, choix irréversible |
| P5 Dénouement | 230 à 250 min | Réaliser les 3 projets de sa voie | chaîne de projets finaux |

Fourchette : un joueur efficace termine vers 3 h, un joueur tranquille vers 5 h. Ces chiffres seront **mesurés** avec le script d'équilibrage réparé, pas supposés.

## 4. Ressources (de 10 à 6)

| Ressource | Rôle | Phase |
| --- | --- | --- |
| Bots | croissance principale | P0 |
| Cibles | file d'attente du scan | P0 |
| Argent sale | produit par la monétisation, dangereux à garder | P1 |
| Argent propre | produit par le blanchiment, sert aux achats importants | P2 |
| Chaleur | pression des rivaux (guerre) | P3 |
| Suspicion | pression de la police (FBI), mène à la prison | P2 |

Supprimés ou fusionnés : l'argent « dark » (fusionné avec argent sale), portefeuille d'investissement (remplacé par les entreprises-écrans, plus lisibles). Le renseignement de guerre peut devenir un simple coût en bots.
Hz, matière cérébrale et computronium ne disparaissent pas : ils ne servent plus que pour la **5e fin cachée « Singularité »** (voir section 5), débloquée tardivement et seulement si le joueur la cherche.
Le mini-jeu de la matrice (saisie de commandes) devient une **infiltration** d'une grande entreprise : braquage à risque, utilisable en P3 et P4. À valider.

> **Mise à jour du 19 nov.** : le blanchiment est supprimé et il n'y a plus qu'une seule monnaie (« Argent »). Dans la Vengeance, le critère n'est donc plus « argent propre » mais **argent total + suspicion basse** ; dans la Résilience, le joueur doit **dépenser** son argent (restitution, écoles, hôpitaux, puits).

## 5. Les quatre fins

Le héros a tout perdu : emploi, femme, garde du fils, logement. Quatre issues, trois choisies, une subie.

### Vengeance
- **Voie choisie en P4.** Il faut de l'**argent propre** (donc un blanchiment réussi).
- 3 projets : (1) racheter tous les biens de l'ancien propriétaire puis le mettre dehors, (2) engager les meilleurs avocats, (3) retourner voir sa femme et obtenir la garde de son fils.
- Contrainte : suspicion basse, car les avocats refusent un client trop exposé.

### Résilience
- **Voie choisie en P4.** La mécanique est **inversée** : il faut **perdre** ce qu'on a gagné.
- 3 projets : (1) rembourser un maximum des sommes volées (le jeu mémorise le total volé), (2) construire des écoles et des hôpitaux là où il en faut, (3) financer des puits dans les zones sans eau et ne garder que de quoi vivre simplement.
- Contrainte : il faut avoir de l'argent propre à donner, donc le joueur doit d'abord réussir pour pouvoir renoncer.

### Folie
- **Voie choisie en P4.** Il faut des **bots et de la guerre**.
- 3 projets : (1) s'en prendre à la plus grande entreprise, (2) s'en prendre à des pays entiers, (3) déclencher la guerre qui mène à la fin du monde.
- Contrainte : la chaleur monte sans retour, le monde réagit.

### Prison (mauvaise fin, subie)
- Peut arriver **dès la phase P2**, quelle que soit la voie.
- Quand la suspicion atteint 100 %, un compte à rebours d'arrestation démarre. Les contre-mesures le retardent, ne l'annulent pas. Si le compte à rebours finit : il est pris et finit en prison jusqu'à la fin de ses jours.
- Rejouable : la partie recommence avec un texte différent.

### Singularité (5e fin, cachée)
- Fin « IA » conservée de la version actuelle : Hz, matière cérébrale, computronium.
- Pas proposée dans l'écran des voies. Elle se débloque en P4 si le joueur a poursuivi la ligne d'accumulation de calcul, avec un indice discret dans les messages.
- Écriture du contenu repoussée après les 4 fins principales (lot L5).

### Choix de la voie
Au début de P4, un écran présente les trois voies avec leurs exigences. Le choix est définitif pour la partie (rejouabilité par une nouvelle partie). Les choix faits avant (messages acceptés ou refusés, cibles attaquées) changent seulement le texte et le ton, pas la voie.

## 6. Moteur et optimisation

| Sujet | Aujourd'hui | Proposition |
| --- | --- | --- |
| Nombres | `bigint` partout | nombres JavaScript normaux (jusqu'à 9 × 10¹⁵, bien au-dessus de ce qu'il faut) |
| Messages worker → interface | état complet, 10 fois par seconde | 4 fois par seconde, et seulement les parties qui ont changé |
| Rendu React | l'application entière se redessine à chaque message | seul l'onglet visible se met à jour |
| Pas de simulation | 100 ms, fixe | 250 ms avec rattrapage si l'onglet reste en arrière-plan |
| Sauvegarde | complète toutes les 2 s | complète toutes les 10 s et à la fermeture |
| Test de durée | périmé | joueur automatique complet, lancé en une commande, qui échoue si la médiane sort de 3 à 5 h |

## 7. Plan de travail en lots

| Lot | Contenu | Résultat vérifiable |
| --- | --- | --- |
| L1 ✅ | Réparer le joueur automatique et mesurer l'existant | **fait** : 0 partie sur 9 finissable à vitesse normale (voir `ETAT_DES_LIEUX_2026-11.md`) |
| L2 ✅ | Nombres normaux, **blanchiment supprimé, monnaies fusionnées en une seule « Argent »** (décidé le 19 nov.) | **fait** : lint, build et interface vérifiés ; les commerces deviennent des sources de revenu |
| L3 | Nouvelle courbe : paliers de phase, coûts, améliorations de P0 à P3 | médiane P0 à P3 dans le calendrier |
| L4 | Système de voies et de projets finaux (3 voies + prison) | les 4 fins atteignables en test automatique |
| L5 | Contenu : améliorations P4/P5, messages, textes des fins | fins jouables de bout en bout |
| L6 | Optimisation de l'interface et de la boucle | mesure avant/après |
| L7 | Tutoriel, cinématiques de fin, finitions | partie complète jouée à la main |

Chaque lot se termine par lint + build + joueur automatique, et un commit.

## 8. Questions ouvertes

1. ~~Thème IA~~ : gardé comme 5e fin cachée (décidé).
2. ~~Voie choisie~~ : explicite en P4 (décidé).
3. ~~`bigint`~~ : nombres normaux (décidé).
4. Faut-il une progression hors-ligne (le jeu avance quand l'onglet est fermé) ? Non prévu pour l'instant.
