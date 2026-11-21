import { formatBigValue, formatCountdownMs } from '../../../game/format';
import { STORY_PROJECTS_PHASE_INDEX } from '../../../game/story';
import type { GameSnapshot, StoryProjectSnapshot } from '../../../game/types';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface StoryTabPanelProps {
  snapshot: GameSnapshot;
  onOpenChoice: () => void;
  onStartProject: () => void;
  t: TranslateFn;
}

function costLabel(project: StoryProjectSnapshot, t: TranslateFn): string {
  const parts: string[] = [];
  if (project.costMoney > 0) parts.push(formatBigValue(project.costMoney) + ' ' + t('reboot.story.unit.money'));
  if (project.costBots > 0) parts.push(formatBigValue(project.costBots) + ' ' + t('reboot.story.unit.bots'));
  return parts.join(' + ') || '—';
}

export function StoryTabPanel(props: Readonly<StoryTabPanelProps>) {
  const { snapshot, t } = props;
  const { story } = snapshot;
  const projectsOpen = snapshot.phase.index >= STORY_PROJECTS_PHASE_INDEX;
  const running = story.projects.some((project) => project.status === 'running');

  if (!story.path) {
    return (
      <section className="system-grid" role="tabpanel" id="panel-story" aria-labelledby="tab-story">
        <article className="panel" data-guide="story">
          <h2>{t('reboot.story.tab.title')}</h2>
          <p className="panel-copy">{t('reboot.story.tab.noPath')}</p>
          <div className="button-row">
            <button className="btn" onClick={props.onOpenChoice}>
              {t('reboot.story.tab.pick')}
            </button>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="system-grid" role="tabpanel" id="panel-story" aria-labelledby="tab-story">
      <article className="panel panel-span-full" data-guide="story">
        <h2>{t('reboot.story.path.' + story.path + '.name')}</h2>
        <p className="panel-copy">{t('reboot.story.path.' + story.path + '.summary')}</p>
        {!projectsOpen ? <p className="panel-copy">{t('reboot.story.tab.projectsLocked')}</p> : null}

        <ol className="project-list">
          {story.projects.map((project) => {
            const canStart = project.status === 'ready' && project.missing.length === 0 && !running;
            return (
              <li key={project.index} className={'project-row is-' + project.status}>
                <div className="project-head">
                  <h3>{t('reboot.story.project.' + story.path + '.' + (project.index + 1))}</h3>
                  <span className="project-status">{t('reboot.story.status.' + project.status)}</span>
                </div>

                <dl className="metrics">
                  <div>
                    <dt>{t('reboot.story.tab.cost')}</dt>
                    <dd>{costLabel(project, t)}</dd>
                  </div>
                  <div>
                    <dt>{t('reboot.story.tab.duration')}</dt>
                    <dd>{formatCountdownMs(project.durationMs)}</dd>
                  </div>
                  {project.minWarWins > 0 ? (
                    <div>
                      <dt>{t('reboot.story.tab.wins')}</dt>
                      <dd>{project.minWarWins}</dd>
                    </div>
                  ) : null}
                  {project.maxSuspicion < 10_000 ? (
                    <div>
                      <dt>{t('reboot.story.tab.suspicion')}</dt>
                      <dd>≤ {project.maxSuspicion / 100}%</dd>
                    </div>
                  ) : null}
                </dl>

                {project.status === 'running' || project.status === 'done' ? (
                  <div className="meter">
                    <span style={{ width: `${project.progressBps / 100}%` }}></span>
                  </div>
                ) : null}

                {project.stalled ? <p className="project-warn">{t('reboot.story.tab.stalled')}</p> : null}

                {project.status === 'ready' && project.missing.length > 0 ? (
                  <p className="project-warn">
                    {t('reboot.story.tab.missing', {
                      list: project.missing.map((item) => t('reboot.story.missing.' + item)).join(', '),
                    })}
                  </p>
                ) : null}

                {project.status === 'ready' ? (
                  <div className="button-row">
                    <button className="btn" disabled={!canStart} onClick={props.onStartProject}>
                      {t('reboot.story.tab.start')}
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </article>
    </section>
  );
}
