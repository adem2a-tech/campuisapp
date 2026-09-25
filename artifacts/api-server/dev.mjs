import { spawn } from 'node:child_process';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
process.env.NODE_ENV = 'development';
process.env.PORT = process.env.PORT || '8080';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'memory://campus';
  console.log('[api-server] Base en mémoire (pg-mem) — définissez DATABASE_URL pour PostgreSQL réel.');
}

execSync('node ./build.mjs', { cwd: root, stdio: 'inherit' });

const child = spawn('node', ['--enable-source-maps', join(root, 'dist/index.mjs')], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => process.exit(code ?? 0));
