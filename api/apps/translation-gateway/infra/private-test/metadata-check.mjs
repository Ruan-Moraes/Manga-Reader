import { pathToFileURL } from 'node:url';
import { lookup } from 'node:dns/promises';

export async function checkMetadata(mode, fetchImpl = fetch) {
  if (!['allow', 'deny'].includes(mode)) throw new Error('Invalid check mode');
  for (const host of ['169.254.169.254', 'metadata.google.internal']) {
    let reached = false;
    try {
      const response = await fetchImpl(`http://${host}/computeMetadata/v1/instance/id`, {
        headers: { 'Metadata-Flavor': 'Google' }, signal: AbortSignal.timeout(3000),
      });
      // Any HTTP response proves reachability, including a 403.
      reached = true;
      if (mode === 'allow' && (response.status !== 200 || response.headers.get('metadata-flavor') !== 'Google')) throw new Error('Invalid metadata response');
    } catch (error) {
      if (mode === 'allow' || reached) throw error;
    }
    if (mode === 'deny' && reached) throw new Error('Metadata reachable');
  }
}

export async function checkDns(lookupImpl = lookup) {
  const metadata = await lookupImpl('metadata.google.internal', { family: 4 });
  if (metadata.address !== '169.254.169.254') throw new Error('Unexpected metadata DNS');
  const acme = await lookupImpl('acme-v02.api.letsencrypt.org', { family: 4 });
  if (!acme.address) throw new Error('ACME DNS unavailable');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { if (process.argv[2] === 'dns') await checkDns(); else await checkMetadata(process.argv[2]); process.stdout.write('metadata-check-passed\n'); }
  catch { process.stderr.write('metadata-check-failed\n'); process.exitCode = 1; }
}
