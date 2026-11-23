import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createStartupHook } from './create-startup-hook.mjs';

const names = ['compose.yaml', 'configure-docker.mjs', 'deployment-config.mjs', 'deployment-preflight.mjs',
  'metadata-check.mjs', 'metadata-guard.sh', 'prepare-docker-and-start.sh', 'published.json', 'start-private-test.sh'];
function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), 'toonlira-hook-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const sha = createHash('sha256').update('fixture').digest('hex');
  for (const name of names) writeFileSync(join(dir, name), 'fixture');
  writeFileSync(join(dir, 'SHA256SUMS'), names.map(name => `${sha}  ${name}\n`).join(''));
  return dir;
}
test('generates a hook that pins the manifest and checks private settings', t => {
  const dir = fixture(t); const hook = createStartupHook(dir);
  assert.match(hook, /sha256sum -c SHA256SUMS/);
  assert.match(hook, /stat -c %a "\$ROOT\/settings.env"/);
  assert.match(hook, /exec bash "\$ROOT\/prepare-docker-and-start.sh"/);
  assert.doesNotMatch(hook, /POSTGRES_PASSWORD=/);
});
test('rejects a changed file or a changed manifest', t => {
  const dir = fixture(t); writeFileSync(join(dir, 'compose.yaml'), 'changed');
  assert.throws(() => createStartupHook(dir));
  writeFileSync(join(dir, 'SHA256SUMS'), 'invalid\n');
  assert.throws(() => createStartupHook(dir));
});
