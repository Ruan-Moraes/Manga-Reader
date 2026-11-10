import { shouldStopForBudget } from './budget-notification.mjs';

// The HTTP ingress must be private, with Cloud Run IAM granting invoke only to
// the dedicated Pub/Sub push identity. This module does not authenticate HTTP.
export async function processBudgetPush(envelope, config, fetchImpl = fetch) {
  const push = envelope?.message;
  if (!push || typeof push.data !== 'string' || push.data.length > 16384) throw new Error('Invalid push');
  let data;
  try { data = JSON.parse(Buffer.from(push.data, 'base64').toString('utf8')); }
  catch { throw new Error('Invalid push data'); }
  if (!shouldStopForBudget(data, push.attributes, config)) return 'below-threshold';

  for (const value of [config.project, config.zone, config.instance, config.instanceId]) {
    if (typeof value !== 'string' || !/^[a-zA-Z0-9-]+$/.test(value)) throw new Error('Invalid target');
  }
  const metadata = await fetchImpl('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
    headers: { 'Metadata-Flavor': 'Google' }, signal: AbortSignal.timeout(5000),
  });
  if (!metadata.ok) throw new Error('Metadata token unavailable');
  const token = (await metadata.json()).access_token;
  if (typeof token !== 'string' || !token) throw new Error('Invalid metadata token');
  const headers = { Authorization: `Bearer ${token}` };
  const target = `https://compute.googleapis.com/compute/v1/projects/${config.project}/zones/${config.zone}/instances/${config.instance}`;
  const instance = await fetchImpl(target, { headers, signal: AbortSignal.timeout(10000) });
  if (instance.status === 404) return 'absent';
  if (!instance.ok) throw new Error('Instance lookup failed');
  const actual = await instance.json();
  if (String(actual.id) !== config.instanceId || actual.labels?.toonlira_test !== 'translation') throw new Error('Instance identity mismatch');
  if (actual.status === 'TERMINATED') return 'stopped';
  if (actual.status === 'STOPPING') return 'stop-pending';
  const stop = await fetchImpl(`${target}/stop`, { method: 'POST', headers, signal: AbortSignal.timeout(10000) });
  if (!stop.ok) throw new Error('Stop request failed');
  // Compute operation is asynchronous. The caller must not claim completion
  // until it independently observes the VM stopped, and must retry failures.
  return 'stop-requested';
}
