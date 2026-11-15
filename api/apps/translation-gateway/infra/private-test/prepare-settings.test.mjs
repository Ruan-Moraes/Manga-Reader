import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareSettings } from './prepare-settings.mjs';
const registry = 'southamerica-east1-docker.pkg.dev/toonlira-rm/toonlira-translate-test-1103/';
const receipt = Object.fromEntries(['gateway', 'postgres', 'proxy', 'rate'].map(name => [name, { digest: `${registry}${name}@sha256:${'a'.repeat(64)}` }]));
const now = new Date('2026-11-04T12:00:00Z');
test('generates valid settings with distinct secrets and the matching hostname', () => {
  const values = ['a'.repeat(48), 'b'.repeat(48)];
  const result = prepareSettings({ ip: '192.0.2.1', attempts: 20, receipt, now, secret: () => values.shift() });
  assert.match(result, /^PUBLIC_HOST=toonlira-192-0-2-1\.sslip\.io$/m);
  assert.match(result, /^MAX_ATTEMPTS=20$/m);
  assert.match(result, /^DISCLOSURE_VERSION=volatile-/m);
  assert.match(result, /^TRAINING_POLICY=PT: .* EN: .* ES: /m);
  assert.doesNotMatch(result, /^VM_PUBLIC_IP=/m);
});
test('rejects invalid inputs and reused secrets', () => {
  for (const change of [{ ip: '300.0.2.1' }, { attempts: 0 }, { receipt: {} }, { secret: () => 'a'.repeat(48) }]) {
    assert.throws(() => prepareSettings({ ip: '192.0.2.1', attempts: 20, receipt, now, ...change }));
  }
});
