import type { LoreSceneDefinition } from './types';
import { loreSceneFallStart } from './scenes/scene1FallStart';
import { loreSceneFallPressure } from './scenes/scene2FallPressure';
import { loreSceneEvictionHit } from './scenes/scene3EvictionHit';
import { loreSceneBotnetDiscovery } from './scenes/scene4BotnetDiscovery';
import { loreSceneTutorialBridge } from './scenes/scene5TutorialBridge';

export const LORE_SCENES: ReadonlyArray<LoreSceneDefinition> = [
  loreSceneFallStart,
  loreSceneFallPressure,
  loreSceneEvictionHit,
  loreSceneBotnetDiscovery,
  loreSceneTutorialBridge,
];
