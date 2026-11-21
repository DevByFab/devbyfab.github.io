import { formatCountdownMs } from '../../game/format';
import { ARREST_RUN_SUSPICION } from '../../game/story';
import type { GameSnapshot } from '../../game/types';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface ArrestBannerProps {
  snapshot: GameSnapshot;
  t: TranslateFn;
}

export function ArrestBanner(props: Readonly<ArrestBannerProps>) {
  const { story, economy } = props.snapshot;
  if (!story.arrestActive || story.ending) return null;

  const running = economy.fbiSuspicion >= ARREST_RUN_SUSPICION;

  return (
    <p className={running ? 'arrest-banner is-running' : 'arrest-banner'} role="alert">
      <strong>{props.t('reboot.story.arrest.banner', { time: formatCountdownMs(story.arrestRemainingMs) })}</strong>
      <span>{running ? props.t('reboot.story.arrest.running') : props.t('reboot.story.arrest.paused')}</span>
    </p>
  );
}
