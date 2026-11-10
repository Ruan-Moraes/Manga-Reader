// Run only in an isolated synthetic fixture with provider egress blocked.
import { randomBytes } from 'node:crypto';
const base = 'http://rate:8085';
const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC', 'base64');
const common = { 'X-Toonlira-Client': '192.0.2.43' };
function key() {
  const bytes = randomBytes(16); bytes.writeUIntBE(Date.now(), 0, 6);
  bytes[6] = (bytes[6] & 15) | 0x70; bytes[8] = (bytes[8] & 63) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
async function request(path, options = {}, timeout = 5000) {
  return fetch(base + path, { ...options, headers: { ...common, ...options.headers }, signal: AbortSignal.timeout(timeout) });
}
try {
  const created = await request('/v1/anonymous/installations', { method: 'POST' });
  if (created.status !== 201) throw Error(`installation-${created.status}`);
  const installation = await created.json();
  const sessionResponse = await request('/v1/anonymous/sessions', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${installation.credential}` },
    body: JSON.stringify({ installationRef: installation.installationRef }) });
  if (sessionResponse.status !== 201) throw Error(`session-${sessionResponse.status}`);
  const session = await sessionResponse.json();
  async function page() {
    return request('/v2/page-translations', { method: 'POST', headers: {
      Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'image/png', 'Idempotency-Key': key(),
      'X-Image-Byte-Size': String(image.length), 'X-Image-Width': '1', 'X-Image-Height': '1',
      'X-Source-Language': 'ja', 'X-Target-Language': 'pt-BR', 'X-Disclosure-Version': 'volatile-synthetic',
    }, body: image }, 100000);
  }
  const first = await page();
  if (first.status !== 503) throw Error(`first-${first.status}`);
  const next = await page();
  if (next.status !== 429) throw Error(`second-${next.status}`);
  process.stdout.write('synthetic-attempt-limit-passed\n');
} catch (error) {
  process.stderr.write(`synthetic-attempt-limit-failed: ${error.message}\n`);
  process.exitCode = 1;
}
