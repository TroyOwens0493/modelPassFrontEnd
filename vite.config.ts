import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    proxy: {
      '/auth/authorize': { target: 'http://localhost:3000', changeOrigin: true },
      '/auth/exchange': { target: 'http://localhost:3000', changeOrigin: true },
      '/auth/refresh': { target: 'http://localhost:3000', changeOrigin: true },
      '/auth/logout': { target: 'http://localhost:3000', changeOrigin: true },
      '/auth/me': { target: 'http://localhost:3000', changeOrigin: true },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
