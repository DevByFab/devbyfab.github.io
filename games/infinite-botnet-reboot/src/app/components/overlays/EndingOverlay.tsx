import type { EndingId } from '../../../game/types';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface EndingOverlayProps {
  t: TranslateFn;
  ending: EndingId;
  onRestart: () => void;
}

export function EndingOverlay(props: Readonly<EndingOverlayProps>) {
  const { t, ending } = props;
  const base = 'reboot.story.ending.' + ending;

  return (
    <aside className={'overlay-backdrop story-backdrop ending-' + ending} role="dialog" aria-modal="true" aria-label={t(base + '.title')}>
      <div className="overlay-card story-card ending-card">
        <p className="eyebrow">{t('reboot.story.ending.eyebrow', { label: t(base + '.label') })}</p>
        <h2>{t(base + '.title')}</h2>
        <p className="lore-copy">{t(base + '.p1')}</p>
        <p className="lore-copy">{t(base + '.p2')}</p>
        <p className="lore-copy">{t(base + '.p3')}</p>
        <div className="button-row">
          <button className="btn" onClick={props.onRestart}>
            {t('reboot.story.ending.restart')}
          </button>
        </div>
      </div>
    </aside>
  );
}
