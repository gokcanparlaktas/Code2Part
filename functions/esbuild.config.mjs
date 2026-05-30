import * as esbuild from 'esbuild';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes('--watch');
const outFile = resolve(__dirname, 'lib/index.js');

if (!existsSync(resolve(__dirname, 'lib'))) {
  mkdirSync(resolve(__dirname, 'lib'), { recursive: true });
}

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints: [resolve(__dirname, 'src/index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: outFile,
  format: 'cjs',
  sourcemap: true,
  logLevel: 'info',
  external: ['firebase-admin', 'firebase-functions'],
  alias: {
    '@': resolve(__dirname, '../src'),
    '@catalog-data': resolve(__dirname, '../data/catalog-data'),
  },
  loader: {
    '.json': 'json',
  },
};

if (watch) {
  const context = await esbuild.context(buildOptions);
  await context.watch();
  console.log('Watching functions bundle...');
} else {
  await esbuild.build(buildOptions);
}
