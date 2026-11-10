import test from 'node:test';
import assert from 'node:assert/strict';
import { createBudgetServer, readBudgetConfig } from './budget-server.mjs';

test('acknowledges only a completed or unnecessary stop; retries all failures', async t => {
  let outcome = 'stop-requested';
  const server = createBudgetServer({}, async () => { if (outcome === 'error') throw Error('secret'); return outcome; });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  const url = `http://127.0.0.1:${server.address().port}/`;
  for (const [result, status] of [['stop-requested', 503], ['stop-pending', 503], ['stopped', 204], ['absent', 204], ['below-threshold', 204], ['unknown', 503], ['error', 503]]) {
    outcome = result;
    const response = await fetch(url, { method: 'POST', body: '{}' });
    assert.equal(response.status, status);
    assert.equal(await response.text(), '');
  }
  assert.equal((await fetch(url, { method: 'POST', body: 'x'.repeat(32769) })).status, 413);
  assert.equal((await fetch(url)).status, 404);
});

test('requires an explicit positive threshold and every target field', () => {
  assert.throws(() => readBudgetConfig({}));
  assert.throws(() => readBudgetConfig({ STOP_THRESHOLD: '-1' }));
});
