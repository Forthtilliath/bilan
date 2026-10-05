// Verification complete du depot, dans l'ordre de la CI, avec un recapitulatif final.
//   node scripts/verify.mjs            tout (Docker requis : Testcontainers, scans, pile E2E)
//   node scripts/verify.mjs --quick    sans Docker : lint, types, tests unitaires, build, audit npm
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const frontend = join(root, 'frontend');
const backend = join(root, 'backend');
const quick = process.argv.includes('--quick');
const isWindows = process.platform === 'win32';
// Chemin absolu : cmd.exe lance par Node ne cherche pas dans le dossier courant.
const mvnw = join(backend, isWindows ? 'mvnw.cmd' : 'mvnw');

/** Volumes partages par les scans Docker (depot, cache Maven local, base de vulnerabilites). */
const trivy = (...args) => [
  'run',
  '--rm',
  '-v',
  `${root}:/repo`,
  '-v',
  `${join(homedir(), '.m2')}:/root/.m2:ro`,
  '-v',
  '/var/run/docker.sock:/var/run/docker.sock',
  '-v',
  'trivy-cache:/root/.cache',
  'aquasec/trivy:latest',
  ...args,
];
const trivyFs = trivy(
  'fs',
  '--quiet',
  '--offline-scan',
  '--scanners',
  'vuln,secret,misconfig',
  '--severity',
  'HIGH,CRITICAL',
  '--exit-code',
  '1',
  '--skip-dirs',
  'node_modules',
  '--skip-dirs',
  'frontend/node_modules',
  '--skip-dirs',
  'backend/target',
  '--skip-dirs',
  'frontend/dist',
  '/repo',
);
const trivyImage = (image) =>
  trivy(
    'image',
    '--quiet',
    '--scanners',
    'vuln',
    '--severity',
    'HIGH,CRITICAL',
    '--ignore-unfixed',
    '--exit-code',
    '1',
    image,
  );

const STEPS = [
  {
    group: 'Frontend',
    name: 'Formatage (Prettier)',
    cwd: frontend,
    cmd: 'npm',
    args: ['run', 'format:check'],
  },
  {
    group: 'Frontend',
    name: 'Lint TypeScript (ESLint)',
    cwd: frontend,
    cmd: 'npm',
    args: ['run', 'lint'],
  },
  {
    group: 'Frontend',
    name: 'Lint CSS (Stylelint)',
    cwd: frontend,
    cmd: 'npm',
    args: ['run', 'lint:css'],
  },
  {
    group: 'Frontend',
    name: 'Types (tsc app + tests)',
    cwd: frontend,
    cmd: 'npm',
    args: ['run', 'typecheck'],
  },
  {
    group: 'Frontend',
    name: 'Tests unitaires + couverture',
    cwd: frontend,
    cmd: 'npm',
    args: ['run', 'test:coverage'],
  },
  {
    group: 'Frontend',
    name: 'Build de production',
    cwd: frontend,
    cmd: 'npm',
    args: ['run', 'build'],
  },
  {
    group: 'Backend',
    name: 'Compilation stricte, PMD, tests, couverture',
    cwd: backend,
    cmd: mvnw,
    args: quick
      ? ['-B', '-q', 'verify', '-Dtest=!*ApiTest', '-Djacoco.skip=true']
      : ['-B', '-q', 'verify'],
  },
  {
    group: 'Sécurité',
    name: 'Audit npm (liste d’exceptions)',
    cwd: root,
    cmd: 'node',
    args: ['scripts/audit.mjs'],
  },
  {
    group: 'Sécurité',
    name: 'Secrets dans l’historique (Gitleaks)',
    cwd: root,
    docker: true,
    cmd: 'docker',
    args: [
      'run',
      '--rm',
      '-v',
      `${root}:/repo`,
      'zricethezav/gitleaks:latest',
      'git',
      '/repo',
      '--no-banner',
      '--redact',
    ],
  },
  {
    group: 'Sécurité',
    name: 'Dépendances, secrets, Dockerfiles (Trivy)',
    cwd: root,
    docker: true,
    cmd: 'docker',
    args: trivyFs,
  },
  {
    group: 'Docker',
    name: 'Construction et démarrage de la pile',
    cwd: root,
    docker: true,
    cmd: 'docker',
    args: ['compose', 'up', '-d', '--build', '--wait'],
  },
  {
    group: 'Sécurité',
    name: 'Image backend (Trivy)',
    cwd: root,
    docker: true,
    cmd: 'docker',
    args: trivyImage('bilan-backend'),
  },
  {
    group: 'Sécurité',
    name: 'Image frontend (Trivy)',
    cwd: root,
    docker: true,
    cmd: 'docker',
    args: trivyImage('bilan-frontend'),
  },
  {
    group: 'E2E',
    name: 'Types des tests (tsc)',
    cwd: root,
    cmd: 'npx',
    args: ['tsc', '-p', 'e2e/tsconfig.json'],
  },
  {
    group: 'E2E',
    name: 'Parcours, accessibilité, en-têtes (Playwright)',
    cwd: root,
    docker: true,
    cmd: 'npx',
    args: ['playwright', 'test'],
  },
];

const results = [];
for (const step of STEPS) {
  if (quick && step.docker) {
    results.push({ ...step, status: 'ignoré', seconds: 0 });
    continue;
  }
  console.log(`\n▶ [${step.group}] ${step.name}`);
  const started = Date.now();
  const run = spawnSync(step.cmd, step.args, {
    cwd: step.cwd,
    stdio: 'inherit',
    shell: isWindows,
  });
  const seconds = Math.round((Date.now() - started) / 1000);
  results.push({ ...step, status: run.status === 0 ? 'ok' : 'ÉCHEC', seconds });
}

console.log('\nRécapitulatif');
for (const r of results) {
  const icon = r.status === 'ok' ? '✓' : r.status === 'ignoré' ? '·' : '✗';
  console.log(
    `  ${icon} ${r.group.padEnd(9)} ${r.name.padEnd(48)} ${r.status.padEnd(7)} ${String(r.seconds).padStart(4)} s`,
  );
}
const failed = results.filter((r) => r.status === 'ÉCHEC');
console.log(failed.length ? `\n${failed.length} étape(s) en échec.` : '\nTout est vert.');
process.exit(failed.length ? 1 : 0);
