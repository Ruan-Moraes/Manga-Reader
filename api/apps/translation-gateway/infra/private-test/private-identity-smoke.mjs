// Synthetic private-network smoke. Never print installation or session credentials.
const base = 'http://rate:8085';
const headers = { 'X-Toonlira-Client': '192.0.2.42' };
async function request(path, options = {}) {
  return fetch(base + path, { ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(5000) });
}
try {
  let capabilities;
  let lastFailure = 'none';
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const response = await request('/v2/capabilities');
      if (response.status === 200) { capabilities = await response.json(); break; }
      lastFailure = `http-${response.status}`;
      if (![502, 503].includes(response.status)) throw new Error(`Unexpected capabilities status ${response.status}`);
    } catch (error) {
      if (error.message.startsWith('Unexpected')) throw error;
      const code = error.cause?.code;
      lastFailure = ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT'].includes(code) ? code : error.name === 'TimeoutError' ? 'timeout' : 'network-error';
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  if (!capabilities || capabilities.contractVersion !== '2.0' || !capabilities.generatedAt) throw new Error(`Capabilities unavailable (${lastFailure})`);
  const installationResponse = await request('/v1/anonymous/installations', { method: 'POST' });
  if (installationResponse.status !== 201) throw new Error(`Installation status ${installationResponse.status}`);
  const installation = await installationResponse.json();
  if (!installation.installationRef || !installation.credential) throw new Error('Invalid installation response');
  const sessionResponse = await request('/v1/anonymous/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${installation.credential}` },
    body: JSON.stringify({ installationRef: installation.installationRef }),
  });
  if (sessionResponse.status !== 201) throw new Error(`Session status ${sessionResponse.status}`);
  const session = await sessionResponse.json();
  if (!session.accessToken || !session.expiresAt) throw new Error('Invalid session response');
  const denied = await request('/v1/anonymous/sessions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer invalid' },
    body: JSON.stringify({ installationRef: installation.installationRef }),
  });
  if (denied.status !== 401) throw new Error(`Invalid-credential status ${denied.status}`);
  process.stdout.write('private-identity-capabilities-passed\n');
} catch (error) {
  process.stderr.write(`private-identity-capabilities-failed: ${error.message}\n`);
  process.exitCode = 1;
}
