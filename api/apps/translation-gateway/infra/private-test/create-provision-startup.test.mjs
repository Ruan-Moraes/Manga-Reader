import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createProvisionStartup } from './create-provision-startup.mjs';
const names = ['compose.yaml', 'configure-docker.mjs', 'deployment-config.mjs', 'deployment-preflight.mjs',
  'metadata-check.mjs', 'metadata-guard.sh', 'prepare-docker-and-start.sh', 'published.json', 'start-private-test.sh'];
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'toonlira-provision-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const sha = createHash('sha256').update('fixture').digest('hex');
  for (const name of names) writeFileSync(join(dir, name), 'fixture');
  writeFileSync(join(dir, 'SHA256SUMS'), names.map(name => `${sha}  ${name}\n`).join(''));
  return dir;
}
test('emits valid shell that requires sealed settings and a fixed bundle', t => {
  const dir = fixture(t); const script = createProvisionStartup(dir, 'fixture code', 'fixture smoke');
  assert.equal(spawnSync('bash', ['-n'], { input: script }).status, 0);
  assert.match(script, /instance\/attributes\/toonlira-envelope/);
  assert.match(script, /node_tool open \/state\/bootstrap-private.pem/);
  assert.match(script, /TOONLIRA_PUBLIC_KEY_V1/);
  assert.doesNotMatch(script, /POSTGRES_PASSWORD=/);
});
test('refuses changed bundle', t => {
  const dir = fixture(t); writeFileSync(join(dir, 'compose.yaml'), 'changed');
  assert.throws(() => createProvisionStartup(dir, 'fixture code', 'fixture smoke'));
});
