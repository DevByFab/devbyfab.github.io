# DevByFab — contexte du dépôt

Lis ce fichier en premier. Détails du jeu : `games/infinite-botnet-reboot/docs/handoff/PROCHAINE_SESSION.md`.

## Le projet
Portfolio de « DevByFab » (HTML/CSS/JS statique, GitHub Pages) + un jeu dans `games/infinite-botnet-reboot` (React + TypeScript + Vite + Web Worker).
Le propriétaire parle français (tutoiement, ton décontracté). Réponds-lui en français.

## Objectif
- Trouver un poste (ou stage/alternance) **dans le nord du Portugal**, sinon en **télétravail**. Ouvert aux entreprises étrangères en télétravail (France).
- Langues du site : PT (défaut), FR, EN.
- Il adore programmer et veut que la partie code soit visible.

## Confidentialité (important, le dépôt est public)
- La marque est **DevByFab**. Le vrai nom ne doit apparaître nulle part sur le site ni dans les fichiers du dépôt. Pas d'âge, pas d'adresse.
- Contact pro : l'adresse déjà présente dans `index.html`. Contact projets : `devbyfab@gmail.com`.
- Ne jamais mettre d'infos perso dans un fichier du dépôt ou une requête vers un service externe.
- **Aucune ville ni commune** (ni la sienne, ni celle des employeurs ou écoles) dans le site ni dans les docs : on écrit « nord du Portugal » ou « Portugal ». La scolarité passée (France jusqu'en seconde, stage de 3e) peut rester : elle prouve le français et ne localise pas. Pas d'état civil. Le PDF du CV public doit être sans nom, téléphone ni ville ; l'ancien PDF reste dans l'historique git (réécriture = force push, seulement sur demande).
- **Ne jamais `git push` sans demande explicite** : un push sur `main` redéploie le site.

## Direction artistique (validée)
- Violet profond et **plat** (aubergine/prune/encre). Pas de glow, de dégradé, de flou « verre », ni de noir pur.
- Structure « console d'exploitation » (grille, étiquettes techniques, schéma d'infra) **sans** cliché hacker : pas de vert terminal.
- Aéré, espacé. Références : apple.com (sites qui offrent une « expérience »). À éviter : oracle.com, look ultra-industriel.
- Retour du propriétaire : « super beau, super propre » mais il manque un peu d'**expérience**. Piste à proposer, pas encore faite.
- Fichiers : `css/{base,layout,components,home,pages,fonts}.css`, `index.html`, `js/{main,animations,performance,i18n}.js`, `i18n/{pt,fr,en}.json`. Textes via `data-i18n*`. Langue : `navigator.languages` (première entrée PT, FR ou EN), sinon EN ; un choix mémorisé (`devbyfab:lang`) prime.

## Comment travailler (skills installés dans `~/.claude/skills`)
- **ponytail** : à utiliser pour tout code, correction, refactor et revue (`/ponytail-review`, `/ponytail-audit`, `/ponytail-debt`). Plus petit changement complet, finir par ce qui a été sauté et les risques.
- **humanizer** : pour **tout texte** (copy du site, textes du jeu, commits, docs destinées à un humain). Pas de « sans blabla », « zéro artifice », « passionné » ; des faits et des chiffres.
- **design-taste-frontend** (taste-skill) et **ui-ux-pro-max** : en aide pour le visuel. Ils doivent respecter la DA ci-dessus (elle prime sur leurs défauts : pas d'effets shader/glow imposés).
- Les skills se chargent au démarrage d'une session : si l'un manque, relancer.

### Installer les skills sur une nouvelle machine (bash)
```
mkdir -p ~/.claude/skills /tmp/sk && cd /tmp/sk
git clone --depth 1 https://github.com/DietrichGebert/ponytail && cp -r ponytail/skills/ponytail* ~/.claude/skills/
git clone --depth 1 https://github.com/blader/humanizer && mkdir -p ~/.claude/skills/humanizer && cp humanizer/SKILL.md ~/.claude/skills/humanizer/
git clone --depth 1 https://github.com/leonxlnx/taste-skill && cp -r taste-skill/skills/taste-skill ~/.claude/skills/design-taste-frontend
git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill && cp -r ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max ~/.claude/skills/
```
On copie les dossiers de skills seulement (pas les hooks du plugin ponytail). Relancer Claude Code ensuite.

## Pièges connus
- Avant de supprimer une donnée partagée (JSON i18n, etc.), faire un grep sur **tout** le dépôt, `games/` compris.
- Fichiers à fins de ligne mixtes (CRLF/LF) : conserver celles du fichier. PowerShell `Set-Content -Encoding utf8` ajoute un BOM (casse `package.json`).
- Build du jeu sous Windows : `npm install --no-save @rolldown/binding-win32-x64-msvc@<version de rolldown>`. Vite 8 veut Node ≥ 22.12, la machine a 22.11.
- Tests navigateur : Chrome headless avec un **profil neuf** (le cache fausse les résultats).

## Décisions du 20 nov. 2026 (site)
- Boutons « CV » : tous ouvrent `assets/CV_DevByFab.pdf` dans un nouvel onglet. Pas de page CV (`cv.html` supprimé).
- Langues : toutes les pages en PT / FR / EN (langue du navigateur, sinon choix mémorisé), sauf `legal.html` qui reste en anglais seul. Rédiger chaque langue directement (PT-PT natif), passer humanizer partout : le ton actuel sonne très IA.
- Accueil (fait le 20 nov.) : 4 chapitres au scroll (Code, Réseau et cybersécurité, 3D Blender, IA), puis Parcours et Contact. Chaque chapitre = une scène plate collée à l'écran + des étapes qui défilent ; `main.js` (`initChapters`) écrit `data-step` sur la section et `.on` sur les calques `.layer[data-l]`. Fortinet n'est plus qu'une phrase. Un nouveau chapitre = copier une section `.chapter` de `index.html`, ses clés `h.*` dans les 3 JSON, et vérifier avec un test puppeteer (scène synchronisée, pas de débordement).
- Pages `project/*.html` : plus courtes et plus personnelles (ce que j'ai fait, pourquoi, en quoi ça consiste, ce qui a été le plus dur ou le plus plaisant). Plus de blocs terminal/code au milieu, plus de `glass-card` ni d'émojis.
- **Responsive = exigence n°1** : lisibilité et expérience identiques sur mobile et ordinateur. Tester en émulation mobile réelle (puppeteer-core + Chrome, largeurs 320 à 1440, les 3 langues), pas avec `--window-size` en headless (largeur minimale ~500 px, la capture est rognée). Zones tactiles ≥ 44 px, pas de débordement horizontal, CV accessible aussi dans le menu burger.
- Le jeu : les heures annoncées viennent du joueur automatique (`balance:sim`), jusqu'à la version finale ; pas de test manuel en boucle.
- « Ce que j'explore » : modélisation 3D sous Blender, programmation, veille informatique et cybersécurité, IA (bien l'utiliser).
- AeroTabs : aucune mesure de RAM publiée (une mesure existe, mais seulement chez lui).

## Direction « humaine » (21 nov. 2026)
- Priorité recruteur : **qui il est** d'abord, les projets comme preuves. Voix : directe et décontractée, première personne, honnête (ses seules expériences en entreprise sont des stages d'école, on le dit). Aucune photo, seulement la marque DevByFab.
- Clin d'œil jeu vidéo **sérieux, ni gamin ni geek** : « Niveau 1 · Code »…, gros numéro de niveau plat derrière le titre, carrés de progression par étape (`.step-hud`), barre de progression dans l'en-tête (`#level-fill`), contact = « Niveau final ». Référence visuelle : la beauté de Monster Hunter, Elden Ring, Clair Obscur (il aime ce qui est beau, « une claque »).
- Fiche « En bref » à droite du hero (`.profile`, clés `h.f.*`) : ce qu'il cherche, langues, méthode (planifie beaucoup avant de coder), setup (2 écrans, un 3e voulu ; code de nuit, jour avec ses amis), hors code (Overwatch depuis la sortie, Clair Obscur, LoL, animés, 10 ans de taekwondo). Pas d'âge, pas de lieu.
- AeroTabs s'appelait CryoTabs au départ : c'est son premier vrai projet. Avant : un vieux site et un petit jeu pour l'école.
- Il cherche un endroit où évoluer (salaire et compétences) et où l'on rit en travaillant.

## Reste à faire côté portfolio
- Fournir le PDF du CV public (sans nom, téléphone, ville) à placer dans `assets/CV_DevByFab.pdf`. Décider s'il en faut un par langue.
- Passage humanizer fait sur l'accueil et les pages projet (PT-PT, FR, EN). À relire par le propriétaire.
- Projets : AeroTabs (bêta, soumission Chrome Web Store + Firefox Add-ons ; captures de store dans `C:\Users\fabcp\Documents\.Fab\AeroTabs-Store\screenshots`), BoTokard (terminé, non montrable), CipherVault (scolaire, ~70 %, repris de temps en temps).
