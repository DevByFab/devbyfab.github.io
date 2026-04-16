import type { GameSnapshot, LogLine } from '../../game/types';
import { ConsolePanel } from './dashboard/ConsolePanel';
import { CoreOpsPanel } from './dashboard/CoreOpsPanel';
import { UpgradesPanel } from './dashboard/UpgradesPanel';

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface DashboardTabPanelProps {
  snapshot: GameSnapshot;
  latestLogs: LogLine[];
  consoleCollapsed: boolean;
  onToggleConsole: () => void;
  onSendScan: () => void;
  onSendExploit: () => void;
  onPurchaseUpgrade: (chainId: string) => void;
  t: TranslateFn;
}

export function DashboardTabPanel(props: Readonly<DashboardTabPanelProps>) {
  return (
    <section className="dashboard-grid" role="tabpanel" id="panel-dashboard" aria-labelledby="tab-dashboard">
      <CoreOpsPanel
        snapshot={props.snapshot}
        onSendScan={props.onSendScan}
        onSendExploit={props.onSendExploit}
        t={props.t}
      />

      <UpgradesPanel
        snapshot={props.snapshot}
        onPurchaseUpgrade={props.onPurchaseUpgrade}
        t={props.t}
      />

      <ConsolePanel
        snapshot={props.snapshot}
        latestLogs={props.latestLogs}
        consoleCollapsed={props.consoleCollapsed}
        onToggleConsole={props.onToggleConsole}
        t={props.t}
      />
    </section>
  );
}
