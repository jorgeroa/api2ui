/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

function corsProxyPlugin(): Plugin {
  return {
    name: 'cors-proxy',
    configureServer(server) {
      server.middlewares.use('/api-proxy', async (req, res) => {
        const targetUrl = decodeURIComponent((req.url || '').replace(/^\//, ''))
        if (!targetUrl.startsWith('http')) {
          res.writeHead(400, { 'Content-Type': 'text/plain' })
          res.end('Missing target URL')
          return
        }
        try {
          const headers: Record<string, string> = {}
          const parsed = new URL(targetUrl)
          for (const [key, value] of Object.entries(req.headers)) {
            if (key === 'host' || key === 'origin' || key === 'cookie') continue
            if (key === 'referer') {
              headers['referer'] = parsed.origin + '/'
              continue
            }
            if (typeof value === 'string') headers[key] = value
          }
          const resp = await fetch(targetUrl, { method: req.method, headers })
          res.writeHead(resp.status, {
            'Content-Type': resp.headers.get('content-type') || 'application/json',
            'Access-Control-Allow-Origin': '*',
          })
          const buffer = Buffer.from(await resp.arrayBuffer())
          res.end(buffer)
        } catch (err) {
          res.writeHead(502, { 'Content-Type': 'text/plain' })
          res.end(`Proxy error: ${err instanceof Error ? err.message : 'unknown'}`)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), corsProxyPlugin()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      buffer: 'buffer',
    },
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
