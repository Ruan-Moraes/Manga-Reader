import { readFile } from 'node:fs/promises';
import { validateDeployment } from './deployment-config.mjs';

// Supply the environment privately, and a read-only copy of the publication
// receipt. Failure output deliberately omits environment values and secrets.
try {
  const config = { ...process.env, MAX_ATTEMPTS: Number(process.env.MAX_ATTEMPTS) };
  validateDeployment(config);
  const receipt = JSON.parse(await readFile('/input/published.json', 'utf8'));
  for (const [key, variable] of [['gateway', 'GATEWAY_IMAGE'], ['proxy', 'PROXY_IMAGE'], ['postgres', 'POSTGRES_IMAGE'], ['rate', 'RATE_IMAGE']]) {
    if (receipt[key]?.digest !== config[variable]) throw Error('Published digest mismatch');
  }
  process.stdout.write('deployment-preflight-passed\n');
} catch {
  process.stderr.write('deployment-preflight-failed\n');
  process.exitCode = 1;
}
