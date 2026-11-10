// Pure decision logic for a future authenticated Cloud Billing Pub/Sub receiver.
// A caller must separately authenticate the sender and decode Pub/Sub data.
export function shouldStopForBudget(message, attributes, { budgetId, billingAccountId, currency, threshold }) {
  if (!message || !attributes || attributes.budgetId !== budgetId ||
      attributes.billingAccountId !== billingAccountId || attributes.schemaVersion !== '1.0' ||
      message.currencyCode !== currency) {
    throw new Error('Unexpected budget or currency');
  }
  const cost = message.costAmount;
  if (typeof cost !== 'number' || !Number.isFinite(cost) || cost < 0 ||
      typeof threshold !== 'number' || !Number.isFinite(threshold) || threshold <= 0) {
    throw new Error('Invalid cost or threshold');
  }
  return cost >= threshold;
}
