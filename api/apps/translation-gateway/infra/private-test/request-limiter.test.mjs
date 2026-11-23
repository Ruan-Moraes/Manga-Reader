import test from 'node:test';
import assert from 'node:assert/strict';
import { RequestLimiter } from './request-limiter.mjs';

test('limits a client and restores capacity on the next window', () => {
  let time = 0;
  const limit = new RequestLimiter({ windowMs: 100, perClient: 2, global: 4, maxClients: 2, now: () => time });
  assert.equal(limit.allow('192.0.2.1'), true);
  assert.equal(limit.allow('192.0.2.1'), true);
  assert.equal(limit.allow('192.0.2.1'), false);
  assert.equal(limit.allow('192.0.2.2'), true);
  assert.equal(limit.allow('192.0.2.3'), false);
  time = 100;
  assert.equal(limit.allow('192.0.2.3'), true);
});

test('enforces a global bound and rejects missing identities', () => {
  const limit = new RequestLimiter({ perClient: 3, global: 2, maxClients: 10 });
  assert.equal(limit.allow(''), false);
  assert.equal(limit.allow('192.0.2.1'), true);
  assert.equal(limit.allow('192.0.2.2'), true);
  assert.equal(limit.allow('192.0.2.3'), false);
  assert.throws(() => new RequestLimiter({ global: 0 }));
});
