import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
const baseFromEnv = process.env.VITE_PUBLIC_BASE?.trim()

const base = baseFromEnv
  ? baseFromEnv.endsWith('/')
    ? baseFromEnv
    : `${baseFromEnv}/`
  : process.env.NODE_ENV === 'production'
    ? '/games/infinite-botnet-reboot/'
    : '/'

const workspaceRoot = path.resolve(__dirname, '../..')

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
})
