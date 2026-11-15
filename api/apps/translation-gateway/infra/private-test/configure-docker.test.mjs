import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { disableLiveRestore } from './configure-docker.mjs';

function directory(t) {
  const dir = mkdtempSync(join(tmpdir(), 'toonlira-docker-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
test('disables live restore while preserving other options, and is idempotent', (t) => {
  const dir = directory(t); const file = join(dir, 'daemon.json');
  writeFileSync(file, JSON.stringify({ 'live-restore': true, 'log-level': 'warn' }));
  assert.equal(disableLiveRestore(dir), true);
  assert.deepEqual(JSON.parse(readFileSync(file)), { 'live-restore': false, 'log-level': 'warn' });
  assert.equal(disableLiveRestore(dir), false);
});
test('rejects unexpected config and leaves it intact', (t) => {
  const dir = directory(t); const file = join(dir, 'daemon.json');
  writeFileSync(file, '{"other":true}');
  assert.throws(() => disableLiveRestore(dir));
  assert.equal(readFileSync(file, 'utf8'), '{"other":true}');
});
test('rejects a symbolic-link config without touching its target', (t) => {
  const dir = directory(t); const target = join(dir, 'target');
  writeFileSync(target, '{"live-restore":true}');
  symlinkSync(target, join(dir, 'daemon.json'));
  assert.throws(() => disableLiveRestore(dir));
  assert.equal(readFileSync(target, 'utf8'), '{"live-restore":true}');
});
