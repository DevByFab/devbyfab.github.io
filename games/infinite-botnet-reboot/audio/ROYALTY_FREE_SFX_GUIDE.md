# Guide Sons Libre de Droit - The Infinite BotNet

Ce guide te donne des sources fiables pour remplir le manifest audio du jeu avec des sons utilisables en portfolio et publication web.

## Regle rapide (important)
- Priorite: `CC0` (zero attribution) pour eviter les contraintes.
- Si `CC-BY`: conserver credit + auteur + lien + licence.
- Eviter les licences ambiguës ou modifiables par abonnement.
- Verifier chaque fichier avant publication (la licence peut differer au niveau d un son individuel).

## Sources recommandees

### 1) Kenney Audio (CC0)
- URL: https://kenney.nl/assets
- Avantage: packs game-ready, propres, simples a mixer.
- A chercher: UI click, blips, notifications.

### 2) Pixabay Sound Effects / Music
- URL: https://pixabay.com/sound-effects/
- Avantage: usage commercial globalement autorise.
- Attention: verifier la page du son et l auteur si mention speciale.

### 3) Freesound (filtrer strict)
- URL: https://freesound.org/
- Filtre recommande: `License = CC0` ou `CC-BY` si tu acceptes credits.
- Avantage: enorme bibliotheque, parfait pour textures serveurs / glitch.

### 4) OpenGameArt Audio
- URL: https://opengameart.org/art-search?keys=audio
- Filtrer sur `CC0` ou `CC-BY` uniquement.

### 5) Sonniss GDC Free Packs
- URL: https://sonniss.com/gameaudiogdc
- Avantage: qualite pro pour ambiances et impacts.
- Attention: lire la licence du pack telecharge.

## Mapping direct vers ton manifest

Le fichier de reference est:
- `manifest.example.json`

Tu peux viser ce mapping:

### UI
- `ui_click_scan.ogg`: click mecanique sec, court, neutre.
- `ui_click_exploit.ogg`: click plus agressif, leger "digital snap".
- `ui_upgrade_buy.ogg`: chime positif court.
- `ui_settings_open.ogg`: whoosh discret.
- `ui_settings_close.ogg`: whoosh inverse discret.
- `ui_error.ogg`: beep court negatif (pas trop fort).

### Events
- `event_target_found.ogg`: ping radar doux.
- `event_exploit_success.ogg`: hit digital positif.
- `event_exploit_fail.ogg`: glitch court / buzz bref.
- `event_market_unlock.ogg`: mini stinger "new module".
- `event_phase_shift.ogg`: transition plus large (0.7-1.2s max).

### Ambiences loop
- `ambience_server_low.ogg`: hum basse frequence, stable.
- `ambience_server_mid.ogg`: plus de texture ventilo + grain.
- `ambience_server_high.ogg`: tension accrue, harmonique plus brillante.
- `ambience_server_overclock.ogg`: couche stress / pulsing discret.

### Stingers (optionnel)
- `stinger_upgrade_tier2.ogg`
- `stinger_upgrade_tier3.ogg`
- `stinger_market_tier2.ogg`

## Mots-cles pratiques de recherche
- `mechanical keyboard single click`
- `ui digital click short`
- `cyber terminal beep`
- `server room hum loop`
- `glitch short impact`
- `sci-fi stinger`

## Conseils mixage rapide (web)
- Cible peak SFX: autour de `-6 dBFS`.
- Ambiance loop: tres bas (`-22` a `-28 dBFS`) pour ne pas fatiguer.
- Duree UI ideale: `40ms` a `220ms`.
- Export: `.ogg` (qualite 5-6) pour bon ratio taille/qualite.

## Credits template (si CC-BY)
Si tu prends des sons CC-BY, garde un fichier `AUDIO_CREDITS.md` avec:
- Nom du son
- Auteur
- Lien source
- Licence
- Modifications eventuelles
