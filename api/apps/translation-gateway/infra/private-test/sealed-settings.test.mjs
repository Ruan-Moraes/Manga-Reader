import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeys, sealSettings, openSettings } from './sealed-settings.mjs';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const pair = generateKeys();
test('round trips without exposing plaintext in the envelope', () => {
  const secret = Buffer.from('SYNTHETIC_PASSWORD=example-only\n');
  const encoded = sealSettings(secret, pair.publicKey);
  assert.ok(!encoded.includes(secret.toString()));
  assert.deepEqual(openSettings(encoded, pair.privateKey), secret);
});
test('rejects tampering, wrong recipient and malformed envelope', () => {
  const encoded = sealSettings(Buffer.from('fixture'), pair.publicKey);
  const value = JSON.parse(encoded); const tag = Buffer.from(value.tag, 'base64'); tag[0] ^= 1; value.tag = tag.toString('base64');
  assert.throws(() => openSettings(JSON.stringify(value), pair.privateKey));
  assert.throws(() => openSettings(encoded, generateKeys().privateKey));
  assert.throws(() => openSettings('{"version":2}', pair.privateKey));
});

test('CLI keeps private files restricted and refuses overwrites', t => {
  const dir = mkdtempSync(join(tmpdir(), 'toonlira-sealed-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const script = fileURLToPath(new URL('./sealed-settings.mjs', import.meta.url));
  const privateKey = join(dir, 'private.pem'); const publicKey = join(dir, 'public.pem');
  const input = join(dir, 'input'); const envelope = join(dir, 'envelope'); const output = join(dir, 'output');
  writeFileSync(input, 'SYNTHETIC_SECRET=fixture\n', { mode: 0o600 });
  execFileSync(process.execPath, [script, 'generate', privateKey, publicKey]);
  execFileSync(process.execPath, [script, 'seal', publicKey, input, envelope]);
  execFileSync(process.execPath, [script, 'open', privateKey, envelope, output]);
  assert.equal(readFileSync(output, 'utf8'), 'SYNTHETIC_SECRET=fixture\n');
  assert.equal(statSync(privateKey).mode & 0o777, 0o600);
  assert.equal(statSync(output).mode & 0o777, 0o600);
  assert.notEqual(spawnSync(process.execPath, [script, 'open', privateKey, envelope, output]).status, 0);
});
