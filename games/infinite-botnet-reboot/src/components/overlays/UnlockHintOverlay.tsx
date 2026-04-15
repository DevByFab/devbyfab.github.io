type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

interface UnlockHintOverlayProps {
  t: TranslateFn;
  title: string;
  description: string;
  onContinue: () => void;
}

export function UnlockHintOverlay(props: Readonly<UnlockHintOverlayProps>) {
  return (
    <aside
      className="overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={props.t('reboot.overlay.unlock.dialogLabel')}
    >
      <div className="overlay-card">
        <p className="eyebrow">{props.t('reboot.overlay.unlock.eyebrow')}</p>
        <h2>{props.title}</h2>
        <p className="lore-copy">{props.description}</p>
        <div className="button-row">
          <button className="btn" onClick={props.onContinue}>
            {props.t('reboot.overlay.unlock.continue')}
          </button>
        </div>
      </div>
    </aside>
  );
}
