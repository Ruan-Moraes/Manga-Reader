import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const mobileRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));

const skipped = new Set(['.expo', '.git', 'coverage', 'node_modules']);

function markdownFiles(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        if (entry.isDirectory() && skipped.has(entry.name)) return [];

        const path = resolve(directory, entry.name);

        if (entry.isDirectory()) return markdownFiles(path);

        return path.endsWith('.md') ? [path] : [];
    });
}

const errors = [];

for (const file of markdownFiles(mobileRoot)) {
    const content = readFileSync(file, 'utf8');

    const links = [...content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)];

    for (const [, rawTarget] of links) {
        const target = rawTarget.trim().replace(/^<|>$/g, '');

        if (!target || target.startsWith('#') || /^[a-z][a-z\d+.-]*:/i.test(target)) continue;

        const path = decodeURIComponent(target.split('#', 1)[0]);

        if (path && !existsSync(resolve(dirname(file), path))) {
            errors.push(`${file.slice(mobileRoot.length + 1)} -> ${target}`);
        }
    }
}

if (errors.length > 0) {
    process.stderr.write(`Broken relative documentation links:\n${errors.map(error => `- ${error}`).join('\n')}\n`);

    process.exitCode = 1;
} else {
    process.stdout.write('Documentation link validation passed.\n');
}
