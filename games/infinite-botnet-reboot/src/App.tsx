import { useMemo, useState } from 'react';
import { formatBigValue, formatCountdownMs, formatPercentFromBps } from './game/format';
import { useGameWorker } from './hooks/useGameWorker';

const TURBO_OPTIONS = [1, 5, 10, 20, 40];

interface ResourceCardProps {
  label: string;
  value: string;
}

function ResourceCard(props: Readonly<ResourceCardProps>) {
  return (
    <article className="resource-card">
      <p className="resource-label">{props.label}</p>
      <p className="resource-value">{formatBigValue(props.value)}</p>
    </article>
  );
}

function App() {
  const { snapshot, logs, ready, error, turbo, sendCommand, setTurbo, resetSession } = useGameWorker();
  const [matrixCommand, setMatrixCommand] = useState('');

  const latestLogs = useMemo(() => logs.slice(Math.max(0, logs.length - 18)), [logs]);

  if (!snapshot) {
    return (
      <main className="loading-shell">
        <h1>Infinite BotNet Reboot</h1>
        <p>Initialisation du worker simulation...</p>
      </main>
    );
  }

  const bots = BigInt(snapshot.resources.bots);
  const queuedTargets = BigInt(snapshot.resources.queuedTargets);
  const money = BigInt(snapshot.resources.darkMoney);
  const intel = BigInt(snapshot.resources.warIntel);

  const attackCost = BigInt(snapshot.war.attackCostBots);
  const scrubCost = BigInt(snapshot.war.scrubCostMoney);
  const fortifyCostMoney = BigInt(snapshot.war.fortifyCostMoney);
  const fortifyCostIntel = BigInt(snapshot.war.fortifyCostIntel);

  const matrixArmCostHz = BigInt(snapshot.matrix.armCostHz);
  const matrixArmCostComp = BigInt(snapshot.matrix.armCostComputronium);
  const matrixInjectCostHz = BigInt(snapshot.matrix.injectCostHz);
  const matrixInjectCostComp = BigInt(snapshot.matrix.injectCostComputronium);
  const matrixStabilizeCost = BigInt(snapshot.matrix.stabilizeCostMoney);

  const messageHead = snapshot.messages.pending[0] ?? null;

  return (
    <main className="app-shell">
      <div className="app-atmosphere" aria-hidden="true"></div>

      <header className="top-bar">
        <div>
          <p className="eyebrow">Desktop-first reboot build</p>
          <h1>Infinite BotNet Reboot</h1>
          <p className="phase-line">
            Phase <strong>{snapshot.phase.label}</strong> · Next {snapshot.phase.nextLabel}
          </p>
        </div>
        <div className="top-actions">
          <p className={ready ? 'status-chip is-online' : 'status-chip'}>
            {ready ? 'Worker Online' : 'Worker Booting'}
          </p>
          <button className="btn ghost" onClick={resetSession}>
            Reset Session
          </button>
        </div>
      </header>

      {error ? <p className="error-banner">Worker error: {error}</p> : null}

      <section className="phase-progress panel-lite">
        <div className="phase-progress-head">
          <span>Progression de phase</span>
          <strong>{(snapshot.phase.progressBps / 100).toFixed(2)}%</strong>
        </div>
        <div className="meter">
          <span style={{ width: `${snapshot.phase.progressBps / 100}%` }}></span>
        </div>
      </section>

      <section className="resource-grid">
        <ResourceCard label="Bots" value={snapshot.resources.bots} />
        <ResourceCard label="Targets" value={snapshot.resources.queuedTargets} />
        <ResourceCard label="Dark Money" value={snapshot.resources.darkMoney} />
        <ResourceCard label="Portfolio" value={snapshot.resources.portfolio} />
        <ResourceCard label="War Intel" value={snapshot.resources.warIntel} />
        <ResourceCard label="Hz" value={snapshot.resources.hz} />
        <ResourceCard label="Brain Matter" value={snapshot.resources.brainMatter} />
        <ResourceCard label="Computronium" value={snapshot.resources.computronium} />
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>Core Ops</h2>
          <p className="panel-copy">Actions manuelles et cadence brute d infection.</p>
          <div className="button-row">
            <button className="btn" onClick={() => sendCommand({ type: 'SCAN' })}>
              Scanner IP
            </button>
            <button
              className="btn"
              disabled={queuedTargets <= 0n}
              onClick={() => sendCommand({ type: 'EXPLOIT' })}
            >
              Tenter Exploit
            </button>
          </div>
          <dl className="metrics">
            <div>
              <dt>Exploit chance</dt>
              <dd>{formatPercentFromBps(snapshot.economy.moneyYieldBps)}</dd>
            </div>
            <div>
              <dt>Bots/s</dt>
              <dd>{formatBigValue(snapshot.telemetry.botsPerSec)}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <h2>Economy Lab</h2>
          <p className="panel-copy">Monetisation risquee, investissement, et friction de maintenance.</p>
          <div className="button-row">
            <button className="btn" onClick={() => sendCommand({ type: 'TOGGLE_MONETIZE' })}>
              {snapshot.economy.monetizeActive ? 'Pause Monetize' : 'Start Monetize'}
            </button>
            <button
              className="btn"
              disabled={money < 80n}
              onClick={() => sendCommand({ type: 'INVEST_TRANCHE' })}
            >
              Invest Tranche
            </button>
            <button
              className="btn ghost"
              disabled={BigInt(snapshot.resources.portfolio) <= 0n}
              onClick={() => sendCommand({ type: 'CASHOUT_PORTFOLIO' })}
            >
              Cashout
            </button>
          </div>
          <div className="button-row compact">
            <button className="btn ghost" onClick={() => sendCommand({ type: 'TOGGLE_INVEST_MODE' })}>
              Mode: {snapshot.economy.investMode}
            </button>
          </div>
          <dl className="metrics">
            <div>
              <dt>Money yield</dt>
              <dd>{formatPercentFromBps(snapshot.economy.moneyYieldBps)}</dd>
            </div>
            <div>
              <dt>Maintenance/s</dt>
              <dd>{formatBigValue(snapshot.economy.maintenanceMoneyPerSec)}</dd>
            </div>
            <div>
              <dt>Money/s</dt>
              <dd>{formatBigValue(snapshot.telemetry.moneyPerSec)}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <h2>War Room</h2>
          <p className="panel-copy">Lisibilite tactique: cout, probabilite, cooldown, Heat.</p>
          <div className="meter heat">
            <span style={{ width: `${snapshot.war.heat / 100}%` }}></span>
          </div>
          <div className="war-meta">
            <span>Heat {snapshot.war.heat / 100}%</span>
            <span>Success {formatPercentFromBps(snapshot.war.projectedSuccessBps)}</span>
          </div>
          <div className="button-row">
            <button
              className="btn"
              disabled={bots < attackCost || snapshot.war.attackCooldownMs > 0}
              onClick={() => sendCommand({ type: 'WAR_ATTACK' })}
            >
              War Attack
            </button>
            <button
              className="btn"
              disabled={money < scrubCost}
              onClick={() => sendCommand({ type: 'WAR_SCRUB' })}
            >
              Scrub
            </button>
            <button
              className="btn"
              disabled={
                money < fortifyCostMoney ||
                intel < fortifyCostIntel ||
                snapshot.war.fortifyCooldownMs > 0
              }
              onClick={() => sendCommand({ type: 'WAR_FORTIFY' })}
            >
              Fortify
            </button>
          </div>
          <dl className="metrics">
            <div>
              <dt>Attack CD</dt>
              <dd>{formatCountdownMs(snapshot.war.attackCooldownMs)}</dd>
            </div>
            <div>
              <dt>Defense</dt>
              <dd>{formatCountdownMs(snapshot.war.defenseRemainingMs)}</dd>
            </div>
            <div>
              <dt>W/L</dt>
              <dd>
                {snapshot.war.wins}/{snapshot.war.losses}
              </dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <h2>Matrix Console</h2>
          <p className="panel-copy">Bypass, injection signee, stabilisation et risque collapse.</p>
          <dl className="metrics">
            <div>
              <dt>Unlocked</dt>
              <dd>{snapshot.matrix.unlocked ? 'Oui' : 'Non'}</dd>
            </div>
            <div>
              <dt>Stability</dt>
              <dd>{snapshot.matrix.stability / 100}%</dd>
            </div>
            <div>
              <dt>Breach</dt>
              <dd>{snapshot.matrix.breachProgress}%</dd>
            </div>
            <div>
              <dt>Bypass</dt>
              <dd>{formatCountdownMs(snapshot.matrix.bypassRemainingMs)}</dd>
            </div>
          </dl>
          <div className="button-row">
            <button
              className="btn"
              disabled={
                !snapshot.matrix.unlocked ||
                BigInt(snapshot.resources.hz) < matrixArmCostHz ||
                BigInt(snapshot.resources.computronium) < matrixArmCostComp
              }
              onClick={() => sendCommand({ type: 'MATRIX_ARM' })}
            >
              Arm Bypass
            </button>
            <button
              className="btn"
              disabled={
                !snapshot.matrix.unlocked ||
                BigInt(snapshot.resources.hz) < matrixInjectCostHz ||
                BigInt(snapshot.resources.computronium) < matrixInjectCostComp
              }
              onClick={() => {
                sendCommand({ type: 'MATRIX_INJECT', payload: { commandText: matrixCommand } });
                setMatrixCommand('');
              }}
            >
              Inject
            </button>
            <button
              className="btn"
              disabled={!snapshot.matrix.unlocked || money < matrixStabilizeCost}
              onClick={() => sendCommand({ type: 'MATRIX_STABILIZE' })}
            >
              Stabilize
            </button>
          </div>
          <label className="input-label" htmlFor="matrix-command">
            Commande attendue: {snapshot.matrix.expectedCommand}
          </label>
          <input
            id="matrix-command"
            className="command-input"
            value={matrixCommand}
            placeholder="inject fractal.root --f12"
            onChange={(event) => setMatrixCommand(event.target.value)}
          />
        </article>

        <article className="panel panel-wide">
          <h2>Relay Messages (FR-first)</h2>
          <p className="panel-copy">Pipeline narratif event-driven. Quarantaine contre penalite.</p>
          {messageHead ? (
            <div className={`message-card tone-${messageHead.tone}`}>
              <div className="message-top">
                <strong>{messageHead.subject}</strong>
                <span>{messageHead.source}</span>
              </div>
              <p>{messageHead.body}</p>
              <div className="message-meta">
                <span>Effet: {messageHead.rewardLabel}</span>
                <span>Quarantaine: {formatBigValue(messageHead.quarantineCost)} $</span>
              </div>
              <div className="button-row">
                <button className="btn" onClick={() => sendCommand({ type: 'MESSAGE_PROCESS' })}>
                  Process
                </button>
                <button className="btn ghost" onClick={() => sendCommand({ type: 'MESSAGE_QUARANTINE' })}>
                  Quarantine
                </button>
              </div>
            </div>
          ) : (
            <p className="empty-text">Aucun message en attente.</p>
          )}
          <p className="queue-hint">
            Unread: {snapshot.messages.unread} · Processed: {snapshot.messages.processed} · Next in{' '}
            {formatCountdownMs(snapshot.messages.nextInMs)}
          </p>
        </article>

        <article className="panel panel-wide">
          <div className="panel-head">
            <h2>Simulation Console</h2>
            <div className="turbo-controls">
              {TURBO_OPTIONS.map((value) => (
                <button
                  key={value}
                  className={value === turbo ? 'btn tiny is-active' : 'btn tiny'}
                  onClick={() => setTurbo(value)}
                >
                  x{value}
                </button>
              ))}
            </div>
          </div>
          <p className="panel-copy">Heat delta: {snapshot.telemetry.heatPerSec}/s</p>
          <ul className="terminal-feed">
            {latestLogs.length === 0 ? <li className="empty-text">Aucun log pour le moment.</li> : null}
            {latestLogs.map((line) => (
              <li key={line.id} className={`log-line ${line.severity}`}>
                <span>{new Date(line.atMs).toLocaleTimeString('fr-FR')}</span>
                <p>{line.text}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}

export default App;
