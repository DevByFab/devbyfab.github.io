import { formatBigValue } from '../../../game/format';
import { STORY_PATH_IDS, STORY_PROJECTS } from '../../../game/story';
import type { StoryPathId } from '../../../game/types';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface PathChoiceOverlayProps {
  t: TranslateFn;
  onChoose: (pathId: StoryPathId) => void;
  onLater: () => void;
}

function joinValues(values: number[]): string {
  return values.map((value) => formatBigValue(value)).join(' · ');
}

function requirementLines(pathId: StoryPathId, t: TranslateFn): string[] {
  const projects = STORY_PROJECTS[pathId];
  const lines: string[] = [];

  const money = projects.map((project) => project.costMoney).filter((value) => value > 0);
  if (money.length > 0) lines.push(t('reboot.story.choose.reqMoney', { values: joinValues(money) }));

  const bots = projects.map((project) => project.costBots).filter((value) => value > 0);
  if (bots.length > 0) lines.push(t('reboot.story.choose.reqBots', { values: joinValues(bots) }));

  const wins = projects.map((project) => project.minWarWins).filter((value) => value > 0);
  if (wins.length > 0) lines.push(t('reboot.story.choose.reqWins', { values: wins.join(' · ') }));

  const suspicion = projects.map((project) => project.maxSuspicion).filter((value) => value < 10_000);
  if (suspicion.length > 0) {
    lines.push(t('reboot.story.choose.reqSuspicion', { values: suspicion.map((value) => value / 100 + '%').join(' · ') }));
  }

  return lines;
}

export function PathChoiceOverlay(props: Readonly<PathChoiceOverlayProps>) {
  const { t } = props;

  return (
    <aside className="overlay-backdrop story-backdrop" role="dialog" aria-modal="true" aria-label={t('reboot.story.choose.title')}>
      <div className="overlay-card story-card">
        <p className="eyebrow">{t('reboot.story.choose.eyebrow')}</p>
        <h2>{t('reboot.story.choose.title')}</h2>
        <p className="lore-copy">{t('reboot.story.choose.copy')}</p>

        <div className="path-grid">
          {STORY_PATH_IDS.map((pathId) => (
            <article key={pathId} className={'path-card path-' + pathId}>
              <h3>{t('reboot.story.path.' + pathId + '.name')}</h3>
              <p className="panel-copy">{t('reboot.story.path.' + pathId + '.summary')}</p>
              <ul className="path-reqs">
                {requirementLines(pathId, t).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <button
                className="btn"
                onClick={() => {
                  if (window.confirm(t('reboot.story.choose.confirm', { path: t('reboot.story.path.' + pathId + '.name') }))) {
                    props.onChoose(pathId);
                  }
                }}
              >
                {t('reboot.story.choose.select')}
              </button>
            </article>
          ))}
        </div>

        <div className="button-row">
          <button className="btn ghost" onClick={props.onLater}>
            {t('reboot.story.choose.later')}
          </button>
        </div>
      </div>
    </aside>
  );
}
