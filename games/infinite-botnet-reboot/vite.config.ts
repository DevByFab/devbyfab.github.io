import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
function normalizeBasePath(value: string): string {
  return value.endsWith('/') ? value : `${value}/`
}

const workspaceRoot = path.resolve(__dirname, '../..')

export default defineConfig(({ command }) => {
  const baseFromEnv = process.env.VITE_PUBLIC_BASE?.trim()
  const defaultBase = command === 'build' ? '/games/infinite-botnet-reboot/' : '/'
  const base = baseFromEnv && baseFromEnv.length > 0
    ? normalizeBasePath(baseFromEnv)
    : defaultBase

  return {
    base,
    plugins: [react()],
    server: {
      fs: {
        allow: [workspaceRoot],
      },
    },
  }
})
