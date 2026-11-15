import test from 'node:test';
import assert from 'node:assert/strict';
import { supportedPairs, validateDeployment } from './deployment-config.mjs';

const registry = 'southamerica-east1-docker.pkg.dev/toonlira-rm/toonlira-translate-test-1103/';
const config = { PROJECT_ID: 'toonlira-rm', PROJECT_NUMBER: '322587816101', PUBLIC_HOST: 'toonlira-34-1-2-3.sslip.io', VM_PUBLIC_IP: '34.1.2.3',
  GATEWAY_IMAGE: `${registry}gateway@sha256:${'a'.repeat(64)}`, PROXY_IMAGE: `${registry}proxy@sha256:${'b'.repeat(64)}`,
  POSTGRES_IMAGE: `${registry}postgres@sha256:${'c'.repeat(64)}`, RATE_IMAGE: `${registry}rate@sha256:${'d'.repeat(64)}`, MAX_ATTEMPTS: 50, DEADLINE: '2026-12-06T15:00:00Z',
  POSTGRES_PASSWORD: 'a'.repeat(32), GATEWAY_KEY: 'b'.repeat(32), TRANSLATION_PAIRS: supportedPairs().join(','),
  OPERATOR_NAME: 'Synthetic', OPERATOR_CONTACT: 'synthetic@example.test', DISCLOSURE_VERSION: 'volatile-test', TRAINING_POLICY: 'synthetic' };
const now = new Date('2026-11-03T00:00:00Z');
test('accepts pinned images, deadline and all 42 supported language pairs', () => {
  assert.equal(supportedPairs().length, 42);
  assert.equal(validateDeployment(config, now), true);
});
test('rejects an unsafe or incomplete deployment', () => {
  for (const change of [{ PUBLIC_HOST: 'toonlira-300-1-2-3.sslip.io' }, { VM_PUBLIC_IP: '34.1.2.4' }, { GATEWAY_IMAGE: 'gateway:latest' },
    { DEADLINE: '2026-12-07T00:00:00Z' }, { MAX_ATTEMPTS: 0 }, { POSTGRES_PASSWORD: 'weak' },
    { GATEWAY_KEY: config.POSTGRES_PASSWORD }, { GATEWAY_KEY: 'A'.repeat(32) }, { DISCLOSURE_VERSION: 'synthetic' },
    { OPERATOR_CONTACT: 'example.test' }, { OPERATOR_NAME: 'x'.repeat(161) }, { TRAINING_POLICY: 'x'.repeat(501) }, { TRANSLATION_PAIRS: 'ja:pt-BR' }, { PROJECT_ID: 'other' }]) {
    assert.throws(() => validateDeployment({ ...config, ...change }, now));
  }
});
