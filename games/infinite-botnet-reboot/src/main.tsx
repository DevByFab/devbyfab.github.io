import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

declare global {
  interface Window {
    __IBR_BOOT_OK__?: boolean
  }
}

function formatBootstrapError(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error
  }

  return 'Unknown bootstrap error'
}

function renderBootstrapError(rootElement: HTMLElement, error: unknown): void {
  const details = formatBootstrapError(error)
  rootElement.innerHTML = `
    <main style="min-height: 100dvh; display: grid; place-items: center; padding: 24px; background: #0b1220; color: #e9edf8; font-family: Segoe UI, Tahoma, Geneva, Verdana, sans-serif;">
      <section style="width: min(780px, 100%); background: #141f33; border: 1px solid #2a3f67; border-radius: 14px; padding: 20px 22px; box-shadow: 0 12px 34px rgba(0, 0, 0, 0.32);">
        <h1 style="margin: 0 0 12px; font-size: 1.4rem; line-height: 1.25;">Infinite BotNet Reboot</h1>
        <p style="margin: 0 0 10px; line-height: 1.55;">The app failed to start in this browser session.</p>
        <p style="margin: 0 0 10px; line-height: 1.55;">Error: <strong>${details.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</strong></p>
        <p style="margin: 0; line-height: 1.55;">Try a hard refresh (Ctrl+Shift+R). If it still fails, open browser devtools and share the first red error line.</p>
      </section>
    </main>
  `
}

async function bootstrap(): Promise<void> {
  const rootElement = document.getElementById('root')

  if (!rootElement) {
    console.error('[reboot] Root container #root introuvable')
    return
  }

  try {
    const { default: App } = await import('./App.tsx')

    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )

    window.__IBR_BOOT_OK__ = true
  } catch (error) {
    console.error('[reboot] bootstrap failed', error)
    renderBootstrapError(rootElement, error)
  }
}

void bootstrap()
