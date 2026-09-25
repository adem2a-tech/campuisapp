import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dbUrl = process.env.DATABASE_URL || 'postgresql://campus:campus@localhost:5432/campus';

console.log('Démarrage de PostgreSQL (Docker)…');
try {
  execSync('docker compose up -d db', { cwd: root, stdio: 'inherit' });
} catch {
  console.warn('Docker non disponible — assurez-vous que PostgreSQL tourne et que DATABASE_URL est défini.');
}

console.log('Application du schéma Drizzle…');
execSync('pnpm --filter @workspace/db run push', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: dbUrl },
});

console.log('Base prête.');
