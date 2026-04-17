export type LoreSceneId =
  | 'fall-start'
  | 'fall-pressure'
  | 'eviction-hit'
  | 'botnet-discovery'
  | 'tutorial-bridge';

export interface LoreSceneDefinition {
  id: LoreSceneId;
  i18nKey: string;
  toneClass: string;
  hasCanvasLayer: boolean;
}
