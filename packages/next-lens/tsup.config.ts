import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  sourcemap: true,
  clean: true,
  dts: true,
  target: 'node20',
  outDir: 'dist',
  splitting: false,
  skipNodeModulesBundle: true,
})
