type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface LoreBridgeOverlayProps {
  t: TranslateFn;
}

export function LoreBridgeOverlay(props: Readonly<LoreBridgeOverlayProps>) {
  return (
    <aside
      className="overlay-backdrop lore-bridge-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={props.t('reboot.overlay.lore.bridgeDialogLabel')}
    >
      <div className="overlay-card lore-bridge-card">
        <p className="eyebrow">{props.t('reboot.overlay.lore.eyebrow')}</p>
        <h2>{props.t('reboot.overlay.lore.bridgeTitle')}</h2>
        <p className="lore-copy">{props.t('reboot.overlay.lore.bridgeBody')}</p>
        <div className="lore-bridge-meter" aria-hidden="true">
          <span></span>
        </div>
      </div>
    </aside>
  );
}
