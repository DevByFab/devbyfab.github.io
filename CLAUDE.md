# DevByFab — contexte du dépôt

Lis ce fichier en premier. Détails du jeu : `games/infinite-botnet-reboot/docs/handoff/PROCHAINE_SESSION.md`.

## Le projet
Portfolio de « DevByFab » (HTML/CSS/JS statique, GitHub Pages) + un jeu dans `games/infinite-botnet-reboot` (React + TypeScript + Vite + Web Worker).
Le propriétaire parle français (tutoiement, ton décontracté). Réponds-lui en français.

## Objectif
- Trouver un poste (ou stage/alternance) **au Portugal, le plus près possible d'Amarante / Porto** (max 1 h 30 en transports), sinon en **télétravail**. Ouvert aux entreprises étrangères en télétravail (France).
- Langues du site : PT (défaut), FR, EN.
- Il adore programmer et veut que la partie code soit visible.

## Confidentialité (important, le dépôt est public)
- La marque est **DevByFab**. Le vrai nom ne doit apparaître nulle part sur le site ni dans les fichiers du dépôt. Pas d'âge, pas d'adresse.
- Contact pro : l'adresse déjà présente dans `index.html`. Contact projets : `devbyfab@gmail.com`.
- Ne jamais mettre d'infos perso dans un fichier du dépôt ou une requête vers un service externe.
- **Ne jamais `git push` sans demande explicite** : un push sur `main` redéploie le site.

## Direction artistique (validée)
- Violet profond et **plat** (aubergine/prune/encre). Pas de glow, de dégradé, de flou « verre », ni de noir pur.
- Structure « console d'exploitation » (grille, étiquettes techniques, schéma d'infra) **sans** cliché hacker : pas de vert terminal.
- Aéré, espacé. Références : apple.com (sites qui offrent une « expérience »). À éviter : oracle.com, look ultra-industriel.
- Retour du propriétaire : « super beau, super propre » mais il manque un peu d'**expérience**. Piste à proposer, pas encore faite.
- Fichiers : `css/{base,layout,components,home,pages,fonts}.css`, `index.html`, `js/{main,animations,performance,i18n}.js`, `i18n/{pt,fr,en}.json`. Textes via `data-i18n*`.

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

## Reste à faire côté portfolio
- Demander ce qu'il veut apprendre ensuite (section « Ce que j'explore »).
- Chiffre RAM mesuré pour AeroTabs (le « 80 % » non vérifié a été retiré).
- Pages `project/*.html` : texte à réécrire en prose FR ; vérifier `legal.html` (vie privée).
- Projets : AeroTabs (bêta, soumission Chrome Web Store + Firefox Add-ons ; captures de store dans `C:\Users\fabcp\Documents\.Fab\AeroTabs-Store\screenshots`), BoTokard (terminé, non montrable), CipherVault (scolaire, ~70 %, repris de temps en temps).
