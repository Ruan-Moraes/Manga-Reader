import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const names = ['compose.yaml', 'configure-docker.mjs', 'deployment-config.mjs', 'deployment-preflight.mjs',
  'metadata-check.mjs', 'metadata-guard.sh', 'prepare-docker-and-start.sh', 'published.json', 'start-private-test.sh'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

// Only operational scripts go into the manifest; settings.env is private and
// is provisioned separately. No secret is embedded in instance metadata.
export function createStartupHook(directory) {
  const manifestPath = join(directory, 'SHA256SUMS');
  if (!lstatSync(manifestPath).isFile() || lstatSync(manifestPath).isSymbolicLink()) throw Error('Invalid manifest');
  const manifest = readFileSync(manifestPath);
  const lines = manifest.toString('utf8').trimEnd().split('\n');
  if (lines.length !== names.length) throw Error('Invalid manifest');
  for (const [index, name] of names.entries()) {
    const match = /^([0-9a-f]{64})  ([a-z0-9.-]+)$/.exec(lines[index]);
    const path = join(directory, name);
    if (!match || match[2] !== name || !lstatSync(path).isFile() || lstatSync(path).isSymbolicLink() || hash(readFileSync(path)) !== match[1]) {
      throw Error('Bundle mismatch');
    }
  }
  const digest = hash(manifest);
  return `#!/bin/bash\nset -Eeuo pipefail\numask 077\nROOT=/var/lib/toonlira-translation-test\n[ "$(id -u)" = 0 ] && [ -d "$ROOT" ] && [ ! -L "$ROOT" ]\n[ -f "$ROOT/SHA256SUMS" ] && [ ! -L "$ROOT/SHA256SUMS" ]\n[ "$(sha256sum "$ROOT/SHA256SUMS" | cut -d' ' -f1)" = '${digest}' ]\n(cd "$ROOT" && sha256sum -c SHA256SUMS >/dev/null)\n[ -f "$ROOT/settings.env" ] && [ ! -L "$ROOT/settings.env" ]\n[ "$(stat -c %a "$ROOT/settings.env")" = 600 ]\nexec bash "$ROOT/prepare-docker-and-start.sh" "$ROOT"\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [directory, output] = process.argv.slice(2);
    if (!directory || !output || process.argv.length !== 4) throw Error('Invalid arguments');
    writeFileSync(output, createStartupHook(directory), { flag: 'wx', mode: 0o600 });
    process.stdout.write('startup-hook-created\n');
  } catch {
    process.stderr.write('startup-hook-creation-failed\n');
    process.exitCode = 1;
  }
}
