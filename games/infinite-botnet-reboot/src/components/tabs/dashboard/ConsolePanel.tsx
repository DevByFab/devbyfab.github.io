import type { GameSnapshot, LogLine } from '../../../game/types';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface ConsolePanelProps {
  snapshot: GameSnapshot;
  latestLogs: LogLine[];
  consoleCollapsed: boolean;
  onToggleConsole: () => void;
  t: TranslateFn;
}

export function ConsolePanel(props: Readonly<ConsolePanelProps>) {
  return (
    <article
      className={
        props.consoleCollapsed
          ? 'panel console-panel panel-span-full is-collapsed'
          : 'panel console-panel panel-span-full'
      }
      data-guide="console"
    >
      <div className="panel-head">
        <h2>{props.t('reboot.panel.console.title')}</h2>
        <div className="button-row compact">
          <button className="btn tiny ghost" onClick={props.onToggleConsole}>
            {props.consoleCollapsed
              ? props.t('reboot.panel.console.open')
              : props.t('reboot.panel.console.reduce')}
          </button>
        </div>
      </div>

      {!props.consoleCollapsed ? (
        <>
          <p className="panel-copy">
            {props.t('reboot.panel.console.heatDelta')}: {props.snapshot.telemetry.heatPerSec}/s
          </p>
          <ul className="terminal-feed">
            {props.latestLogs.length === 0 ? (
              <li className="empty-text">{props.t('reboot.panel.console.empty')}</li>
            ) : null}
            {props.latestLogs.map((line) => (
              <li key={line.id} className={`log-line ${line.severity}`}>
                <span>{new Date(line.atMs).toLocaleTimeString('fr-FR')}</span>
                <p>{line.text}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </article>
  );
}