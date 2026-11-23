const languages = ['ja', 'en', 'es', 'ko', 'zh-Hans', 'zh-Hant', 'pt-BR'];
const registry = 'southamerica-east1-docker.pkg.dev/toonlira-rm/toonlira-translate-test-1103/';

export function supportedPairs() {
  return languages.flatMap(source => languages.filter(target => source !== target).map(target => `${source}:${target}`));
}

// Validate before the VM accepts traffic; never log this object (it holds secrets).
export function validateDeployment(config, now = new Date()) {
  for (const [key, image] of Object.entries({ gateway: config.GATEWAY_IMAGE, proxy: config.PROXY_IMAGE, postgres: config.POSTGRES_IMAGE, rate: config.RATE_IMAGE })) {
    const prefix = `${registry}${key}@sha256:`;
    if (typeof image !== 'string' || !image.startsWith(prefix) || !/^[0-9a-f]{64}$/.test(image.slice(prefix.length))) throw Error(`Invalid ${key} image`);
  }
  if (config.PROJECT_ID !== 'toonlira-rm' || config.PROJECT_NUMBER !== '322587816101') throw Error('Unexpected project');
  if (!/^toonlira-(?:\d{1,3}-){3}\d{1,3}\.sslip\.io$/.test(config.PUBLIC_HOST ?? '')) throw Error('Invalid test hostname');
  const ip = config.PUBLIC_HOST.slice('toonlira-'.length, -'.sslip.io'.length).split('-').map(Number);
  if (ip.some(octet => octet > 255)) throw Error('Invalid address');
  if (config.VM_PUBLIC_IP !== ip.join('.')) throw Error('Hostname and VM address disagree');
  if (!Number.isInteger(config.MAX_ATTEMPTS) || config.MAX_ATTEMPTS < 1 || config.MAX_ATTEMPTS > 1000) throw Error('Invalid attempt limit');
  const deadline = Date.parse(config.DEADLINE);
  if (!Number.isFinite(deadline) || deadline <= now.getTime() || deadline > Date.parse('2026-12-06T15:00:00Z')) throw Error('Invalid deadline');
  for (const key of ['POSTGRES_PASSWORD', 'GATEWAY_KEY']) {
    if (typeof config[key] !== 'string' || config[key].length < 32 || !/^[A-Za-z0-9_-]+$/.test(config[key])) throw Error(`Invalid ${key}`);
  }
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(config.GATEWAY_KEY)) throw Error('Invalid gateway key');
  if (config.POSTGRES_PASSWORD === config.GATEWAY_KEY) throw Error('Secrets must be distinct');
  const pairs = config.TRANSLATION_PAIRS?.split(',');
  if (!pairs || pairs.length !== 42 || new Set(pairs).size !== 42 || supportedPairs().some(pair => !pairs.includes(pair))) throw Error('Incomplete language pairs');
  for (const key of ['OPERATOR_NAME', 'OPERATOR_CONTACT', 'DISCLOSURE_VERSION', 'TRAINING_POLICY']) {
    if (typeof config[key] !== 'string' || !config[key].trim()) throw Error(`Missing ${key}`);
  }
  if (config.OPERATOR_NAME.length > 160 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(config.OPERATOR_CONTACT)
      || !/^volatile-[A-Za-z0-9._-]{1,55}$/.test(config.DISCLOSURE_VERSION) || config.TRAINING_POLICY.length > 500) {
    throw Error('Invalid volatile disclosure');
  }
  return true;
}
