import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: [
    '@modelcontextprotocol/sdk',
    '@modelcontextprotocol/sdk/server',
    'zod',
  ],
})
