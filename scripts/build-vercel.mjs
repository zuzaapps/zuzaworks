import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, cpSync, existsSync } from 'fs';
import { join } from 'path';

const OUT = '.vercel/output';

// Clean previous output
execSync(`rm -rf ${OUT}`);

// Create directory structure
mkdirSync(`${OUT}/functions/api.func`, { recursive: true });
mkdirSync(`${OUT}/static/static`, { recursive: true });

// Bundle the serverless function with esbuild
execSync(
  `npx esbuild api/index.ts --bundle --platform=node --format=esm --target=node20 --outfile=${OUT}/functions/api.func/index.js --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);"`,
  { stdio: 'inherit' }
);

// Write function config
writeFileSync(`${OUT}/functions/api.func/.vc-config.json`, JSON.stringify({
  runtime: 'nodejs20.x',
  handler: 'index.js',
  launcherType: 'Nodejs',
  maxDuration: 30,
}, null, 2));

// Copy static files
if (existsSync('public/static')) {
  cpSync('public/static', `${OUT}/static/static`, { recursive: true });
}

// Write output config with routing
writeFileSync(`${OUT}/config.json`, JSON.stringify({
  version: 3,
  routes: [
    { handle: 'filesystem' },
    { src: '/(.*)', dest: '/api' },
  ],
}, null, 2));

console.log('Vercel build complete!');
