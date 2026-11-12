/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },
  // Port 5174 matches the redirect URIs registered for the affiliate-portal client (the admin app uses 5173).
  server: { port: 5174, strictPort: true },
  build: {
    rollupOptions: {
      output: {
        // Libraries change less often than app code, so they cache separately.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          data: ['@tanstack/react-query', 'oidc-client-ts', 'react-oidc-context'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
