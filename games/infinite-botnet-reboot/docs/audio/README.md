# Audio Placeholder Folder

Drop your royalty-free audio files here using the names below.

For curated sound source ideas and license-safe workflow, see:
- `ROYALTY_FREE_SFX_GUIDE.md`

## Runtime Loading Order
- Runtime manifest (primary): `public/audio/manifest.json`
- Runtime manifest (fallback): `audio/manifest.example.json`
- Code fallback (last resort): built-in manifest map in `src/hooks/useAudioManager.ts`

## Runtime Asset Location
- Runtime playback targets `public/audio/` first.
- The source folder `audio/` stays as the editable source/reference for mapping and documentation.

## Current in-game mapping (runtime)
- Ambience loop: `server-drone.mp3`
- UI click: `ui-click.mp3`
- Error feedback: `error-message.mp3`
- Upgrade unlock: `achievement-unlocked.mp3`
- Phase shift: `level-up.mp3`
- Incoming message: `universfield-message-incoming.mp3`

## UI cues (manifest keys)
- `scanClick`: `ui-click.mp3`
- `exploitClick`: `ui-click.mp3`
- `upgradeBuy`: `achievement-unlocked.mp3`
- `settingsOpen`: `ui-click.mp3`
- `settingsClose`: `ui-click.mp3`
- `error`: `error-message.mp3`

## Event cues (manifest keys)
- `targetFound`: `ui-click.mp3`
- `exploitSuccess`: `ui-click.mp3`
- `exploitFail`: `error-message.mp3`
- `marketUnlock`: `achievement-unlocked.mp3`
- `phaseShift`: `level-up.mp3`
- `incomingMessage`: `universfield-message-incoming.mp3`

## Ambience (loop)
- `main`: `server-drone.mp3`

## Stingers
- `upgradeTier2`: `achievement-unlocked.mp3`
- `upgradeTier3`: `level-up.mp3`
- `marketTier2`: `level-up.mp3`
- `loreBotnetDiscovery`: `level-up.mp3`

If you switch to another naming or extension scheme (for example `.ogg`), update
both `public/audio/manifest.json` and `audio/manifest.example.json` to keep runtime
and docs aligned.
