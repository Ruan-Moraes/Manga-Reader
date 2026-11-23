import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { supportedPairs, validateDeployment } from './deployment-config.mjs';

// Keep the policy understandable in each supported UI language. The Google
// data-use FAQs must be checked again before enabling real provider traffic.
const training = 'PT: Google Cloud Vision e Translation não usam o conteúdo enviado para treinar seus modelos. EN: Google Cloud Vision and Translation do not use submitted content to train their models. ES: Google Cloud Vision y Translation no usan el contenido enviado para entrenar sus modelos.';

export function prepareSettings({ ip, attempts, receipt, now = new Date(), secret = () => randomBytes(24).toString('hex') }) {
  if (typeof ip !== 'string' || !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip)) throw Error('Invalid IP');
  const config = {
    PROJECT_ID: 'toonlira-rm', PROJECT_NUMBER: '322587816101',
    PUBLIC_HOST: `toonlira-${ip.replaceAll('.', '-')}.sslip.io`, VM_PUBLIC_IP: ip,
    MAX_ATTEMPTS: attempts, DEADLINE: '2026-12-06T15:00:00Z',
    POSTGRES_PASSWORD: secret(), GATEWAY_KEY: secret(), TRANSLATION_PAIRS: supportedPairs().join(','),
    OPERATOR_NAME: 'Ruan Moraes', OPERATOR_CONTACT: 'ruanmoraessantosbarbosa@gmail.com',
    DISCLOSURE_VERSION: 'volatile-2026-11-04.v1', TRAINING_POLICY: training,
  };
  for (const name of ['gateway', 'postgres', 'proxy', 'rate']) config[`${name.toUpperCase()}_IMAGE`] = receipt?.[name]?.digest;
  validateDeployment(config, now);
  delete config.VM_PUBLIC_IP; // Checked against metadata by the VM preflight.
  return Object.entries(config).map(([key, value]) => {
    if (/[\r\n]/.test(String(value))) throw Error('Invalid settings value');
    return `${key}=${value}`;
  }).join('\n') + '\n';
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [output, receiptFile, ip, count] = process.argv.slice(2);
    if (!output || !receiptFile || !ip || !/^\d+$/.test(count ?? '') || process.argv.length !== 6) throw Error('Invalid arguments');
    const receipt = JSON.parse(readFileSync(receiptFile, 'utf8'));
    const settings = prepareSettings({ ip, attempts: Number(count), receipt });
    writeFileSync(output, settings, { flag: 'wx', mode: 0o600 });
    process.stdout.write('settings-created\n');
  } catch {
    process.stderr.write('settings-creation-failed\n');
    process.exitCode = 1;
  }
}
