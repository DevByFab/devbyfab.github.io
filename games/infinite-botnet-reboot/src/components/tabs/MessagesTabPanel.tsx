import { formatBigValue, formatCountdownMs } from '../../game/format';
import type { GameSnapshot } from '../../game/types';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface MessagesTabPanelProps {
  snapshot: GameSnapshot;
  unlocked: boolean;
  onProcessMessage: () => void;
  onQuarantineMessage: () => void;
  t: TranslateFn;
}

export function MessagesTabPanel(props: Readonly<MessagesTabPanelProps>) {
  const messageHead = props.unlocked ? props.snapshot.messages.pending[0] ?? null : null;

  return (
    <section className="system-grid" role="tabpanel" id="panel-messages" aria-labelledby="tab-messages">
      {props.unlocked ? (
        <article className="panel panel-tall" data-guide="messages">
          <h2>{props.t('reboot.panel.messages.title')}</h2>
          <p className="panel-copy">{props.t('reboot.panel.messages.copy')}</p>
          <div className="stack-scroll">
            {messageHead ? (
              <div className={`message-card tone-${messageHead.tone}`}>
                <div className="message-top">
                  <strong>{messageHead.subject}</strong>
                  <span>{messageHead.source}</span>
                </div>
                <p>{messageHead.body}</p>
                <div className="message-meta">
                  <span>
                    {props.t('reboot.panel.messages.effectLabel')}: {messageHead.rewardLabel}
                  </span>
                  <span>
                    {props.t('reboot.panel.messages.quarantineLabel')}: {formatBigValue(messageHead.quarantineCost)} $
                  </span>
                </div>
                <div className="button-row">
                  <button className="btn" onClick={props.onProcessMessage}>
                    {props.t('reboot.panel.messages.process')}
                  </button>
                  <button className="btn ghost" onClick={props.onQuarantineMessage}>
                    {props.t('reboot.panel.messages.quarantine')}
                  </button>
                </div>
              </div>
            ) : (
              <p className="empty-text">{props.t('reboot.panel.messages.empty')}</p>
            )}
          </div>
          <p className="queue-hint">
            {props.t('reboot.panel.messages.unread')}: {props.snapshot.messages.unread} · {props.t('reboot.panel.messages.processed')}:{' '}
            {props.snapshot.messages.processed} · {props.t('reboot.panel.messages.nextIn')} {formatCountdownMs(props.snapshot.messages.nextInMs)}
          </p>
        </article>
      ) : (
        <article className="panel locked-panel panel-tall" data-guide="messages">
          <h2>{props.t('reboot.panel.messages.title')}</h2>
          <p className="panel-copy">{props.t('reboot.panel.messages.locked')}</p>
        </article>
      )}
    </section>
  );
}
