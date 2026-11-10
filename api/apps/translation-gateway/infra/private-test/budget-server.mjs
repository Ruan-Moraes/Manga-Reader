import http from 'node:http';
import { processBudgetPush } from './budget-stop.mjs';

// Authentication is enforced by Cloud Run IAM, not by this HTTP handler.
export function createBudgetServer(config, process = processBudgetPush) {
  return http.createServer(async (request, response) => {
    if (request.method !== 'POST' || request.url !== '/') {
      response.writeHead(404).end();
      return;
    }
    try {
      let size = 0;
      const chunks = [];
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 32768) { response.writeHead(413).end(); return; }
        chunks.push(chunk);
      }
      const event = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const outcome = await process(event, config);
      // Pub/Sub retries until the Compute API reports a terminal state.
      if (['stopped', 'absent', 'below-threshold'].includes(outcome)) response.writeHead(204).end();
      else response.writeHead(503).end();
    } catch {
      // No payload, credentials, or error details are written to logs.
      response.writeHead(503).end();
    }
  });
}

export function readBudgetConfig(env) {
  const config = {
    budgetId: env.BUDGET_ID, billingAccountId: env.BILLING_ACCOUNT_ID,
    currency: env.BUDGET_CURRENCY, threshold: Number(env.STOP_THRESHOLD),
    project: env.TARGET_PROJECT, zone: env.TARGET_ZONE,
    instance: env.TARGET_INSTANCE, instanceId: env.TARGET_INSTANCE_ID,
  };
  if (Object.entries(config).some(([key, value]) => key !== 'threshold' && (typeof value !== 'string' || !value)) ||
      !Number.isFinite(config.threshold) || config.threshold <= 0) throw new Error('Incomplete budget configuration');
  return config;
}
