import {
  FR_NARRATIVE_CATALOG,
  type FrNarrativeTemplate,
  type NarrativeBucket,
} from '../../../content/fr/narrativeCatalog';
import type { EngineState } from '../../state';

export function allowedRewardTypesForPhase(
  phaseIndex: number,
): ReadonlySet<FrNarrativeTemplate['rewardType']> {
  if (phaseIndex < 2) {
    return new Set<FrNarrativeTemplate['rewardType']>();
  }

  if (phaseIndex === 2) {
    return new Set<FrNarrativeTemplate['rewardType']>(['bots', 'targets']);
  }

  if (phaseIndex === 3) {
    return new Set<FrNarrativeTemplate['rewardType']>(['bots', 'targets', 'money', 'portfolio']);
  }

  if (phaseIndex === 4) {
    return new Set<FrNarrativeTemplate['rewardType']>([
      'bots',
      'targets',
      'money',
      'portfolio',
      'intel',
    ]);
  }

  return new Set<FrNarrativeTemplate['rewardType']>([
    'bots',
    'targets',
    'money',
    'portfolio',
    'intel',
    'heat-relief',
  ]);
}

export function pickTemplateForPhase(
  bucket: NarrativeBucket,
  rewardTypes: ReadonlySet<FrNarrativeTemplate['rewardType']>,
): FrNarrativeTemplate {
  const bucketCandidates = FR_NARRATIVE_CATALOG[bucket].filter((candidate) =>
    rewardTypes.has(candidate.rewardType),
  );

  if (bucketCandidates.length > 0) {
    const index = Math.floor(Math.random() * bucketCandidates.length);
    return bucketCandidates[index];
  }

  const globalCandidates = Object.values(FR_NARRATIVE_CATALOG)
    .flat()
    .filter((candidate) => rewardTypes.has(candidate.rewardType));
  const fallbackIndex = Math.floor(Math.random() * globalCandidates.length);
  return globalCandidates[fallbackIndex];
}

export function pickBucket(state: EngineState): NarrativeBucket {
  if (state.matrix.unlocked && state.matrix.stability <= 3200) return 'matrix';
  if (state.war.heat >= 7600) return 'warning';
  if (state.war.streak >= 2 || state.war.wins > state.war.losses) return 'war';
  return 'economy';
}
