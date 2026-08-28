import { defineConfig } from 'vite';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function injectPrecacheAssets() {
  return {
    name: 'inject-precache-assets',
    closeBundle() {
      const output = resolve('dist');
      const html = readFileSync(resolve(output, 'index.html'), 'utf8');
      const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"#?]+)"/g)].map((match) => match[1]);
      const workerPath = resolve(output, 'sw.js');
      const worker = readFileSync(workerPath, 'utf8');
      writeFileSync(workerPath, worker.replace('const APP_ASSETS = []; // injected by Vite build', `const APP_ASSETS = ${JSON.stringify([...new Set(assets)])};`));
    },
  };
}

export default defineConfig({
  plugins: [injectPrecacheAssets()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsInlineLimit: 2048,
  },
});
