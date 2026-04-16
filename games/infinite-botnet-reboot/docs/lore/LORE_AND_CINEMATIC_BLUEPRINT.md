# Infinite BotNet Reboot - Lore and Cinematic Blueprint (P0)

## Purpose
This document is the canonical reference for the P0 opening cinematic.
Scope is strict: opening story from first launch to the tutorial bridge.

## Locked Product Decisions
- Navigation mode: manual scene navigation (Previous / Next).
- Visual scope for this sprint: text + CSS staging + audio cues.
- Audio direction: ambience loop + one stinger on BotNet discovery beat.
- Pacing gate: minimum 2s read delay before Next/Continue unlocks.
- Accessibility controls: lore keyboard controls enabled (Enter/Space/ArrowRight next, ArrowLeft/Backspace previous, Escape skip).
- Legacy lore replacement: complete replacement of the previous 3-paragraph intro.
- Runtime intent: short opening (about 60 to 90 seconds when read normally).

## Narrative Arc (P0)
Tone: gritty personal fall, survival pressure, then illegal pivot.

### Canonical prologue
After getting fired, losing your wife and custody of your kids, the months without a single positive answer to your CVs taught you one thing: you had never really been hungry before today.
Then comes the final drop: the eviction letter.
You try multiple survival businesses, but the closer the deadline gets, the more you slide into illegal territory.
That is when you discover BotNets.
You decide to try this new business.
Then the tutorial starts.

## Scene Plan (P0 only)

### Scene 1 - Fall start
- Narrative beat: job loss and family collapse.
- Visual intent: cold atmosphere, restrained cyan lighting, low motion.
- Audio intent: ambience only.
- UX intent: establish emotional context before mechanics.

### Scene 2 - Slow starvation
- Narrative beat: months of failed CV attempts and real hunger.
- Visual intent: pressure rise, warmer edge glow, tighter contrast.
- Audio intent: ambience only.
- UX intent: increase urgency.

### Scene 3 - Eviction hit
- Narrative beat: eviction letter and hard deadline.
- Visual intent: warning hue, pulse effect to signal shock.
- Audio intent: ambience only.
- UX intent: force clear stakes.

### Scene 4 - BotNet discovery
- Narrative beat: discovery of BotNet channels as a survival option.
- Visual intent: orange/high-risk tension spike and unstable glow.
- Audio intent: short stinger on scene entry.
- UX intent: lock the emotional pivot into the illegal path.

### Scene 5 - Commitment / Tutorial bridge
- Narrative beat: crossing the line and committing to operation setup.
- Visual intent: mixed hot/cold palette to signal controlled urgency.
- Audio intent: ambience continues.
- UX intent: direct bridge to tutorial start.

## i18n Contract (FR-first)
Keys used by runtime overlay:
- reboot.overlay.lore.dialogLabel
- reboot.overlay.lore.eyebrow
- reboot.overlay.lore.title
- reboot.overlay.lore.progress
- reboot.overlay.lore.previous
- reboot.overlay.lore.next
- reboot.overlay.lore.continue
- reboot.overlay.lore.skip
- reboot.overlay.lore.readDelay
- reboot.overlay.lore.readReady
- reboot.overlay.lore.keyboardHint
- reboot.overlay.lore.bridgeDialogLabel
- reboot.overlay.lore.bridgeTitle
- reboot.overlay.lore.bridgeBody
- reboot.overlay.lore.scene1
- reboot.overlay.lore.scene2
- reboot.overlay.lore.scene3
- reboot.overlay.lore.scene4
- reboot.overlay.lore.scene5

## Technical Mapping
- Scene state and navigation: src/App.tsx
- Cinematic style classes and motion layers: src/index.css
- Audio cue trigger and channel mix: src/hooks/useAudioManager.ts
- Cue mapping template: audio/manifest.example.json
- Translation source: i18n/fr.json

## Runtime Flow
1. First launch check opens lore overlay.
2. Each scene enters with animated transition and scene-specific visual tone.
3. Player navigates scenes manually with Previous / Next.
4. Next/Continue unlock only after a minimum 2s read gate per scene.
5. Scene 4 transition triggers discovery stinger.
6. Last scene Continue opens a short bridge overlay, then starts tutorial flow.
7. Skip marks lore/tutorial as seen and returns to dashboard.
8. Replay from Settings reopens lore at scene 1.

## Acceptance Checklist
- Lore opening is no longer a static 3-paragraph block.
- All 5 scenes are readable in desktop constraints.
- Lore overlay uses a dynamic multi-layer backdrop with visible blur/depth.
- Previous button disabled on first scene.
- Continue appears only on final scene.
- Scene transitions are animated (out/in) rather than instant text swaps.
- Next/Continue stay disabled until read gate is complete.
- Stinger triggers on BotNet discovery beat.
- Lore keyboard controls are active and isolated to the overlay.
- Lore exit to tutorial uses a short bridge transition (no hard cut).
- Replay Lore from Settings starts from scene 1.
- Skip behavior remains deterministic and persistent.

## Notes for Next Phases
- P1 to P5 arcs will be drafted in separate documents.
- Endings (3 major + 1 bad) are out of scope for this P0 blueprint.
