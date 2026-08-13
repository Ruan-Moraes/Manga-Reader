import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';

import { validateCoverage } from './spec-coverage.mjs';

const artifact = {
    content: '### OBS-001 — Exemplo\n',
    metadata: { id: 'MOB-BASE-001', type: 'baseline' },
};

function fixture({ extraFiles = [], mutate } = {}) {
    const root = mkdtempSync(resolve(tmpdir(), 'mobile-spec-coverage-'));

    const files = ['app/index.tsx', 'src/example.ts', 'README.md', ...extraFiles];

    for (const file of files) {
        mkdirSync(resolve(root, file, '..'), { recursive: true });
        writeFileSync(resolve(root, file), 'fixture');
    }

    const coverage = {
        version: 1,
        ignored: [],
        patterns: [],
        entries: [
            {
                path: 'app/index.tsx',
                category: 'behavior',
                specs: ['MOB-BASE-001'],
                observations: ['MOB-BASE-001/OBS-001'],
            },
            {
                path: 'src/example.ts',
                category: 'behavior',
                specs: ['MOB-BASE-001'],
                observations: ['MOB-BASE-001/OBS-001'],
            },
            {
                path: 'README.md',
                category: 'governance',
                specs: ['MOB-BASE-001'],
                rationale: 'Fixture de governança.',
            },
        ],
    };

    mutate?.(coverage);

    const errors = [];

    const summary = validateCoverage({ mobileRoot: root, coverage, artifactsById: new Map([['MOB-BASE-001', artifact]]), errors });

    return { errors, summary };
}

test('aceita cobertura completa', () => {
    const { errors, summary } = fixture();

    assert.deepEqual(errors, []);

    assert.equal(summary.behavior, 2);
});

test('rejeita arquivo runtime novo sem mapa individual', () => {
    const { errors } = fixture({ extraFiles: ['src/new-feature.ts'] });

    assert.ok(errors.some(error => error.includes('src/new-feature.ts: arquivo sem classificação')));
});

test('rejeita caminho obsoleto', () => {
    const { errors } = fixture({ mutate: coverage => coverage.entries.push({ ...coverage.entries[0], path: 'app/missing.tsx' }) });

    assert.ok(errors.some(error => error.includes('app/missing.tsx: caminho mapeado inexistente')));
});

test('rejeita spec ou observação desconhecida', () => {
    const { errors } = fixture({
        mutate: coverage => {
            coverage.entries[0].specs = ['MOB-BASE-999'];
            coverage.entries[0].observations = ['MOB-BASE-999/OBS-999'];
        },
    });

    assert.ok(errors.some(error => error.includes("ID relacionado inexistente 'MOB-BASE-999'")));
    assert.ok(errors.some(error => error.includes("artefato inexistente 'MOB-BASE-999'")));
});

test('rejeita evidência sem referência comportamental', () => {
    const { errors } = fixture({
        mutate: coverage => {
            coverage.entries[0].category = 'evidence';

            delete coverage.entries[0].observations;
        },
    });

    assert.ok(errors.some(error => error.includes("categoria 'evidence' exige observations")));
});

test('rejeita suporte sem classificação', () => {
    const { errors } = fixture({ extraFiles: ['tooling.config.js'] });

    assert.ok(errors.some(error => error.includes('tooling.config.js: arquivo sem classificação')));
});

test('rejeita observação sem arquivo relacionado', () => {
    const { errors } = fixture({
        mutate: coverage => {
            coverage.entries[0].observations = [];
            coverage.entries[1].observations = [];
        },
    });

    assert.ok(errors.some(error => error.includes('MOB-BASE-001/OBS-001: observação sem arquivo relacionado')));
});

test('mapeamento exato prevalece sobre pattern amplo', () => {
    const { errors, summary } = fixture({
        mutate: coverage => {
            coverage.patterns.push({
                pattern: '**/*.md',
                category: 'governance',
                specs: ['MOB-BASE-001'],
                rationale: 'Documentação da fixture.',
            });
            coverage.entries[2] = {
                ...coverage.entries[2],
                category: 'evidence',
                observations: ['MOB-BASE-001/OBS-001'],
            };
            delete coverage.entries[2].rationale;
        },
    });

    assert.deepEqual(errors, []);
    assert.equal(summary.evidence, 1);
});
