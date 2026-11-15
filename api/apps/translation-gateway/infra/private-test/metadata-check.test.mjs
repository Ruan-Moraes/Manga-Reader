import test from 'node:test';
import assert from 'node:assert/strict';
import { checkDns, checkMetadata } from './metadata-check.mjs';

test('requires both metadata addresses to be unreachable for denied containers', async () => {
  await checkMetadata('deny', async () => { throw Error('unreachable'); });
  await assert.rejects(checkMetadata('deny', async () => ({ status: 403 })));
  await assert.rejects(checkMetadata('invalid', async () => { }));
});

test('accepts the gateway only when both endpoints return authentic metadata headers', async () => {
  const good = async () => ({ status: 200, headers: new Headers({ 'metadata-flavor': 'Google' }) });
  await checkMetadata('allow', good);
  await assert.rejects(checkMetadata('allow', async () => ({ status: 200, headers: new Headers() })));
  await assert.rejects(checkMetadata('allow', async () => { throw Error('unreachable'); }));
});


test('requires usable metadata and public DNS while the metadata HTTP check remains separate', async () => {
  await checkDns(async host => ({ address: host === 'metadata.google.internal' ? '169.254.169.254' : '192.0.2.10' }));
  await assert.rejects(() => checkDns(async () => ({ address: '192.0.2.10' })));
  await assert.rejects(() => checkDns(async () => { throw Error('DNS unavailable'); }));
});
