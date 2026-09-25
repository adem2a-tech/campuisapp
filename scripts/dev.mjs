import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(name, command, args, env) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...env },
  });
  child.on('exit', (code) => {
    if (code && code !== 0) console.error(`[${name}] arrêté avec le code ${code}`);
  });
  return child;
}

const api = run('api', 'pnpm', ['--filter', '@workspace/api-server', 'run', 'dev'], {
  PORT: '8080',
  DATABASE_URL: process.env.DATABASE_URL || 'memory://campus',
});

const campus = run('campus', 'pnpm', ['--filter', '@workspace/campus', 'run', 'dev'], {
  PORT: '19802',
  BASE_PATH: '/',
});

function shutdown() {
  api.kill();
  campus.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('\n  CAMPUS — Frontend http://localhost:19802  |  API http://localhost:8080/api\n');
