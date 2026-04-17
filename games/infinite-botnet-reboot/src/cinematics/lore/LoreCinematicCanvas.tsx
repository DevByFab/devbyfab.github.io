import type { LoreSceneId } from './types';
import { Scene1FallStartCanvas } from './scenes/scene1FallStartCanvas';
import { Scene2FallPressureCanvas } from './scenes/scene2FallPressureCanvas';
import { Scene3EvictionHitCanvas } from './scenes/scene3EvictionHitCanvas';
import { Scene4BotnetDiscoveryCanvas } from './scenes/scene4BotnetDiscoveryCanvas';
import { Scene5TutorialBridgeCanvas } from './scenes/scene5TutorialBridgeCanvas';

interface LoreCinematicCanvasProps {
  sceneId: LoreSceneId;
  active: boolean;
}

export function LoreCinematicCanvas(props: Readonly<LoreCinematicCanvasProps>) {
  if (!props.active) {
    return null;
  }

  switch (props.sceneId) {
    case 'fall-start':
      return <Scene1FallStartCanvas />;
    case 'fall-pressure':
      return <Scene2FallPressureCanvas />;
    case 'eviction-hit':
      return <Scene3EvictionHitCanvas />;
    case 'botnet-discovery':
      return <Scene4BotnetDiscoveryCanvas />;
    case 'tutorial-bridge':
      return <Scene5TutorialBridgeCanvas />;
    default:
      return null;
  }
}
