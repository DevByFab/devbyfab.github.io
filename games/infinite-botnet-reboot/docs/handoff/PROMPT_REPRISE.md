# Prompt pour démarrer la prochaine conversation

Colle ceci dans le premier message (Claude Code ouvert à la racine du dépôt cloné) :

```
Salut. On reprend mon portfolio DevByFab et mon jeu Infinite BotNet Reboot.

Lis d'abord CLAUDE.md (racine), puis games/infinite-botnet-reboot/docs/handoff/PROCHAINE_SESSION.md,
puis games/infinite-botnet-reboot/docs/design/GAME_DESIGN_V2.md.

Si les skills ponytail, humanizer, design-taste-frontend et ui-ux-pro-max ne sont pas
installés, installe-les avec les commandes de CLAUDE.md et dis-moi de relancer.

Règles : ponytail pour tout le code et les revues, humanizer pour tous les textes,
taste et ui-ux-pro-max seulement en aide visuelle (ma DA violet plat prime).
Pas de push sans que je le demande.

On reprend au lot L3 (nouvelle courbe de progression du jeu). Début de partie :
~10 min de manuel puis automatisation accessible vers 100 bots.
Résume en 5 lignes ce que tu as compris, puis lance L3.
```

Rappel côté machine : `cd games/infinite-botnet-reboot && npm ci`, puis sous Windows
`npm install --no-save @rolldown/binding-win32-x64-msvc@<version de rolldown>` (voir CLAUDE.md).
