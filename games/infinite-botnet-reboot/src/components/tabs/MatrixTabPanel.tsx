import type { GameSnapshot } from '../../game/types';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface MatrixTabPanelProps {
  snapshot: GameSnapshot;
  unlocked: boolean;
  matrixCommand: string;
  onMatrixCommandChange: (value: string) => void;
  onArm: () => void;
  onInject: () => void;
  onStabilize: () => void;
  t: TranslateFn;
}

export function MatrixTabPanel(props: Readonly<MatrixTabPanelProps>) {
  const money = BigInt(props.snapshot.resources.darkMoney);

  const matrixArmCostHz = BigInt(props.snapshot.matrix.armCostHz);
  const matrixArmCostComp = BigInt(props.snapshot.matrix.armCostComputronium);
  const matrixInjectCostHz = BigInt(props.snapshot.matrix.injectCostHz);
  const matrixInjectCostComp = BigInt(props.snapshot.matrix.injectCostComputronium);
  const matrixStabilizeCost = BigInt(props.snapshot.matrix.stabilizeCostMoney);

  return (
    <section className="system-grid" role="tabpanel" id="panel-matrix" aria-labelledby="tab-matrix">
      {props.unlocked ? (
        <article className="panel" data-guide="matrix">
          <h2>{props.t('reboot.panel.matrix.title')}</h2>
          <p className="panel-copy">{props.t('reboot.panel.matrix.copy')}</p>
          <dl className="metrics">
            <div>
              <dt>{props.t('reboot.panel.matrix.unlocked')}</dt>
              <dd>{props.snapshot.matrix.unlocked ? props.t('reboot.common.yes') : props.t('reboot.common.no')}</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.matrix.stability')}</dt>
              <dd>{props.snapshot.matrix.stability / 100}%</dd>
            </div>
            <div>
              <dt>{props.t('reboot.panel.matrix.breach')}</dt>
              <dd>{props.snapshot.matrix.breachProgress}%</dd>
            </div>
          </dl>
          <div className="button-row">
            <button
              className="btn"
              disabled={
                !props.snapshot.matrix.unlocked ||
                BigInt(props.snapshot.resources.hz) < matrixArmCostHz ||
                BigInt(props.snapshot.resources.computronium) < matrixArmCostComp
              }
              onClick={props.onArm}
            >
              {props.t('reboot.panel.matrix.arm')}
            </button>
            <button
              className="btn"
              disabled={
                !props.snapshot.matrix.unlocked ||
                BigInt(props.snapshot.resources.hz) < matrixInjectCostHz ||
                BigInt(props.snapshot.resources.computronium) < matrixInjectCostComp
              }
              onClick={props.onInject}
            >
              {props.t('reboot.panel.matrix.inject')}
            </button>
            <button
              className="btn"
              disabled={!props.snapshot.matrix.unlocked || money < matrixStabilizeCost}
              onClick={props.onStabilize}
            >
              {props.t('reboot.panel.matrix.stabilize')}
            </button>
          </div>
          <label className="input-label" htmlFor="matrix-command">
            {props.t('reboot.panel.matrix.expectedCommand')}: {props.snapshot.matrix.expectedCommand}
          </label>
          <input
            id="matrix-command"
            className="command-input"
            value={props.matrixCommand}
            placeholder={props.t('reboot.panel.matrix.inputPlaceholder')}
            onChange={(event) => props.onMatrixCommandChange(event.target.value)}
          />
        </article>
      ) : (
        <article className="panel locked-panel" data-guide="matrix">
          <h2>{props.t('reboot.panel.matrix.title')}</h2>
          <p className="panel-copy">{props.t('reboot.panel.matrix.locked')}</p>
        </article>
      )}
    </section>
  );
}
