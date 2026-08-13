import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

import { validateFsdBoundaries } from './fsd-boundaries.mjs';

const mobileRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const errors = validateFsdBoundaries({ mobileRoot });

if (errors.length) {
    process.stderr.write(`FSD boundary validation failed:\n\n${errors.map(error => `- ${error}`).join('\n')}\n`);
    process.exitCode = 1;
} else {
    process.stdout.write('FSD boundary validation passed.\n');
}
