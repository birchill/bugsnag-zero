import { defineConfig } from 'tsdown';

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  fixedExtension: false,
  sourcemap: true,
  outputOptions: {
    // Indicate that we are intentionally mixing named and default exports in
    // order to mimick the official Bugsnag client.
    //
    // Without this we'll get a MIXED_EXPORTS warning.
    exports: 'named',
  },
});
