type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface LoreBridgeOverlayProps {
  t: TranslateFn;
}

export function LoreBridgeOverlay(props: Readonly<LoreBridgeOverlayProps>) {
  return (
    <aside
      className="overlay-backdrop lore-overlay lore-bridge-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={props.t('reboot.overlay.lore.bridgeDialogLabel')}
    >
      <div className="overlay-card lore-cinematic-card lore-bridge-card lore-scene-tutorial-bridge">
        <div className="lore-cinematic-layer lore-layer-grid" aria-hidden="true"></div>
        <div className="lore-cinematic-layer lore-layer-glow" aria-hidden="true"></div>
        <div className="lore-cinematic-layer lore-layer-vignette" aria-hidden="true"></div>
        <p className="eyebrow">{props.t('reboot.overlay.lore.eyebrow')}</p>
        <h2>{props.t('reboot.overlay.lore.bridgeTitle')}</h2>
        <p className="lore-copy lore-scene-copy">{props.t('reboot.overlay.lore.bridgeBody')}</p>
      </div>
    </aside>
  );
}
