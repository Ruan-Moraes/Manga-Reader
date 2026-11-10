import test from 'node:test';
import assert from 'node:assert/strict';
import { processBudgetPush } from './budget-stop.mjs';

const config = { budgetId: 'budget', billingAccountId: 'account', currency: 'BRL', threshold: 750,
  project: 'toonlira-rm', zone: 'southamerica-east1-a', instance: 'test-vm', instanceId: '123' };
const event = costAmount => ({ message: { attributes: { budgetId: 'budget', billingAccountId: 'account', schemaVersion: '1.0' },
  data: Buffer.from(JSON.stringify({ currencyCode: 'BRL', costAmount })).toString('base64') } });
const response = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body });

test('threshold requests stop for the exact labelled VM', async () => {
  const calls = [];
  const fake = async (url, options) => {
    calls.push([url, options]);
    return calls.length === 1 ? response(200, { access_token: 'secret' }) : calls.length === 2
      ? response(200, { id: '123', labels: { toonlira_test: 'translation' }, status: 'RUNNING' }) : response(200, {});
  };
  assert.equal(await processBudgetPush(event(750), config, fake), 'stop-requested');
  assert.equal(calls.length, 3);
  assert.equal(calls[2][1].method, 'POST');
});

test('ignores low cost and refuses changed ownership or failed lookup', async () => {
  assert.equal(await processBudgetPush(event(10), config, () => { throw Error('unexpected'); }), 'below-threshold');
  for (const instance of [response(200, { id: '999', labels: { toonlira_test: 'translation' } }), response(403, {})]) {
    let calls = 0;
    await assert.rejects(processBudgetPush(event(800), config, async () => ++calls === 1 ? response(200, { access_token: 'secret' }) : instance));
    assert.equal(calls, 2);
  }
});

test('duplicates do not issue another stop when already terminating', async () => {
  let calls = 0;
  assert.equal(await processBudgetPush(event(800), config, async () => ++calls === 1
    ? response(200, { access_token: 'secret' }) : response(200, { id: '123', labels: { toonlira_test: 'translation' }, status: 'TERMINATED' })), 'stopped');
  assert.equal(calls, 2);
});
