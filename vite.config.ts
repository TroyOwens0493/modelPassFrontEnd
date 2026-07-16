import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

const proxyPaths = ['/auth', '/api', '/chats'] as const

function normalizeTarget(target: string) {
  return target.replace(/\/+$/, '')
}

function getProxyTarget(environment: Record<string, string>) {
  return normalizeTarget(environment.API_PROXY_URL || 'http://localhost:3000')
}

function writeNetlifyRedirects(proxyTarget: string): Plugin {
  return {
    name: 'write-netlify-proxy-redirects',
    apply: 'build',
    async closeBundle() {
      const proxyRules = proxyPaths.map(
        (path) => `${path}/*  ${proxyTarget}${path}/:splat  200`,
      )
      const redirects = [...proxyRules, '/*  /index.html  200', ''].join('\n')
      const outputDirectory = resolve(import.meta.dirname, 'dist')

      await mkdir(outputDirectory, { recursive: true })
      await writeFile(resolve(outputDirectory, '_redirects'), redirects)
    },
  }
}

// Browser requests always use the frontend origin. Vite proxies them locally,
// while the generated Netlify rules proxy the same paths after deployment.
export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, import.meta.dirname, '')
  const proxyTarget = getProxyTarget(environment)
  const proxy = Object.fromEntries(proxyPaths.map((path) => [
    path,
    { target: proxyTarget, changeOrigin: true },
  ]))

  return {
    plugins: [svelte(), writeNetlifyRedirects(proxyTarget)],
    server: { proxy },
  }
})
