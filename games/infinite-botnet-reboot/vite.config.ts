import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const workspaceRoot = path.resolve(__dirname, '../..')

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react()],
    server: {
      fs: {
        allow: [workspaceRoot],
      },
    },
  }
})
