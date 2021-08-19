import typescript from '@rollup/plugin-typescript';

export default [
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist/esm',
      exports: 'named', // Disable warning for default imports
      format: 'es',
      sourcemap: true,
    },
    external: [],
    plugins: [
      typescript({
        outDir: 'dist/esm',
      }),
    ],
  },
  {
    input: 'src/index.ts',
    output: {
      exports: 'named', // Disable warning for default imports
      file: 'dist/cjs/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    external: [],
    plugins: [
      typescript({
        declaration: false,
      }),
    ],
  },
  {
    input: 'src/lambda-context.ts',
    output: {
      dir: 'dist/esm',
      exports: 'named', // Disable warning for default imports
      format: 'es',
      sourcemap: true,
    },
    external: ['aws-lambda', 'os', 'ua-parser-js'],
    plugins: [
      typescript({
        outDir: 'dist/esm',
        declaration: false,
      }),
    ],
  },
  {
    input: 'src/lambda-context.ts',
    output: {
      exports: 'named', // Disable warning for default imports
      file: 'dist/cjs/lambda-context.js',
      format: 'cjs',
      sourcemap: true,
    },
    external: ['aws-lambda', 'os', 'ua-parser-js'],
    plugins: [
      typescript({
        declaration: false,
      }),
    ],
  },
];
