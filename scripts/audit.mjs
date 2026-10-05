// Audit npm de la racine et du frontend : echoue sur toute vulnerabilite moderee ou plus
// qui n'est pas dans security/audit-allowlist.json (ou dont l'exception a expire).
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const { advisories } = JSON.parse(
  readFileSync(new URL('../security/audit-allowlist.json', import.meta.url), 'utf8'),
);
const today = new Date().toISOString().slice(0, 10);
const allowed = new Map(advisories.filter((a) => a.expires >= today).map((a) => [a.id, a]));
const expired = advisories.filter((a) => a.expires < today);
const SEVERITIES = new Set(['moderate', 'high', 'critical']);

function audit(dir) {
  let output;
  try {
    output = execFileSync('npm', ['audit', '--json'], {
      cwd: dir,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
  } catch (error) {
    // npm audit sort en code 1 des qu'il trouve quelque chose : le JSON reste sur stdout.
    output = error.stdout;
  }
  const report = JSON.parse(output);
  const findings = [];
  for (const vulnerability of Object.values(report.vulnerabilities ?? {})) {
    for (const via of vulnerability.via) {
      if (typeof via === 'object' && SEVERITIES.has(via.severity)) {
        const id = via.url.split('/').pop();
        findings.push({
          id,
          package: via.name,
          severity: via.severity,
          title: via.title,
        });
      }
    }
  }
  return findings;
}

let failed = expired.length > 0;
for (const { id, package: name } of expired) {
  console.error(`✗ Exception expiree pour ${id} (${name}) : reverifier et mettre a jour la liste.`);
}
for (const [label, dir] of [
  ['racine', root],
  ['frontend', `${root}frontend`],
]) {
  const findings = audit(dir);
  const blocking = findings.filter((f) => !allowed.has(f.id));
  const accepted = new Set(findings.filter((f) => allowed.has(f.id)).map((f) => f.id));
  console.log(
    `${blocking.length ? '✗' : '✓'} ${label} : ${blocking.length} bloquante(s), ${accepted.size} acceptee(s)`,
  );
  for (const f of blocking) {
    console.error(`    ${f.severity.toUpperCase()} ${f.package} — ${f.title} (${f.id})`);
  }
  failed ||= blocking.length > 0;
}
process.exit(failed ? 1 : 0);
