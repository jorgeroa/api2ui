import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  // Don't bundle dependencies — let consumers handle them
  external: ['@apidevtools/swagger-parser', 'openapi-types'],
})
