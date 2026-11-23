import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldStopForBudget } from './budget-notification.mjs';

const config = { budgetId: 'test', billingAccountId: 'example', currency: 'BRL', threshold: 750 };
const attributes = { budgetId: 'test', billingAccountId: 'example', schemaVersion: '1.0' };
const message = { currencyCode: 'BRL', costAmount: 749.99 };

test('stops at the threshold, independently of notification order', () => {
  assert.equal(shouldStopForBudget(message, attributes, config), false);
  assert.equal(shouldStopForBudget({ ...message, costAmount: 750 }, attributes, config), true);
  assert.equal(shouldStopForBudget({ ...message, costAmount: 900 }, attributes, config), true);
});

test('rejects unrelated budgets, currencies and invalid amounts', () => {
  assert.throws(() => shouldStopForBudget(message, { ...attributes, budgetId: 'other' }, config));
  for (const change of [{ currencyCode: 'USD' }, { costAmount: -1 }, { costAmount: NaN }, { costAmount: '800' }]) {
    assert.throws(() => shouldStopForBudget({ ...message, ...change }, attributes, config));
  }
});
