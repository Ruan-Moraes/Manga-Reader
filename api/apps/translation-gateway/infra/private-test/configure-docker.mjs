import { lstatSync, readFileSync, writeFileSync, renameSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Called only on a dedicated VM with no running containers. Keep all other
// daemon options intact and replace the file atomically within its directory.
export function disableLiveRestore(directory) {
  const file = join(directory, 'daemon.json');
  const stat = lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Invalid Docker configuration');
  const config = JSON.parse(readFileSync(file, 'utf8'));
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Invalid Docker configuration');
  if (config['live-restore'] === false) return false;
  if (config['live-restore'] !== true) throw new Error('Unexpected live-restore setting');
  config['live-restore'] = false;
  const temporary = join(directory, `daemon.json.toonlira-${process.pid}.tmp`);
  let created = false;
  try {
    writeFileSync(temporary, `${JSON.stringify(config, null, 2)}\n`, { mode: stat.mode & 0o777, flag: 'wx' });
    created = true;
    renameSync(temporary, file);
    created = false;
  } finally {
    if (created) unlinkSync(temporary);
  }
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { disableLiveRestore('/config'); }
  catch { process.stderr.write('Docker configuration rejected\n'); process.exitCode = 1; }
}
