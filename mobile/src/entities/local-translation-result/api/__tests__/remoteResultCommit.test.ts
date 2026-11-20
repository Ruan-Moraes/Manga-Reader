import { createHash } from 'node:crypto';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import { CREATE_PROJECT_TERMS_SCHEMA } from '@/entities/translation-project/@x/local-translation-result';
import type { SqlExecutor } from '@/shared/storage';

import { parseRemoteRenderManifest, parseRemoteRenderManifestBytes, type RemoteRenderManifest } from '../../model/remoteRenderManifest';
import { CREATE_LOCAL_TRANSLATION_SCHEMA, createSqliteLocalTranslationResultRepository } from '../localTranslationResultRepository';

jest.mock('@/shared/files', () => ({
    ...jest.requireActual('@/shared/files'),
    sha256Bytes: async (bytes: Uint8Array) => require('node:crypto').createHash('sha256').update(bytes).digest('hex'),
}));

const JOB = '30000000-0000-4000-8000-000000000001';
const REGION = '40000000-0000-4000-8000-000000000001';
const IMAGE = { sha256: 'b'.repeat(64), byteSize: 900, widthPx: 100, heightPx: 200 };

function manifest(overrides: Partial<RemoteRenderManifest> = {}): RemoteRenderManifest {
    return {
        version: '1.1',
        policyVersion: 'clean-box-1.2',
        jobRef: JOB,
        sourceLanguage: 'en',
        targetLanguage: 'pt-BR',
        originalSha256: 'a'.repeat(64),
        ocrSha256: 'c'.repeat(64),
        translationSha256: 'd'.repeat(64),
        image: { mimeType: 'image/webp', ...IMAGE },
        regions: [
            {
                id: REGION,
                readingOrder: 0,
                sourceText: 'Hello',
                translatedText: 'Olá',
                polygon: [
                    { x: 0.1, y: 0.1 },
                    { x: 0.5, y: 0.1 },
                    { x: 0.5, y: 0.2 },
                    { x: 0.1, y: 0.2 },
                ],
                overflow: false,
                fontSizePx: 18,
                kept: false,
            },
        ],
        quality: { status: 'OK', issues: [] },
        ...overrides,
    };
}

const expected = { jobRef: JOB, sourceLanguage: 'en' as const, targetLanguage: 'pt-BR' as const, image: IMAGE };

describe('MOB-FEAT-021/AC-002/006/007 remote render manifest', () => {
    it('accepts the renderer manifest that matches the announced job, languages and image', () => {
        expect(parseRemoteRenderManifest(manifest(), expected).regions).toHaveLength(1);
    });

    it('accepts a page without text (no regions)', () => {
        expect(parseRemoteRenderManifest(manifest({ regions: [] }), expected).regions).toEqual([]);
    });

    it.each([
        ['another job', manifest({ jobRef: '30000000-0000-4000-8000-000000000009' })],
        ['other languages', manifest({ targetLanguage: 'es' })],
        ['another image', manifest({ image: { mimeType: 'image/webp', ...IMAGE, sha256: 'e'.repeat(64) } })],
        ['out-of-order regions', manifest({ regions: [{ ...manifest().regions[0]!, readingOrder: 3 }] })],
        [
            'a polygon off the page',
            manifest({
                regions: [
                    {
                        ...manifest().regions[0]!,
                        polygon: [
                            { x: 2, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 1 },
                            { x: 1, y: 1 },
                        ],
                    },
                ],
            }),
        ],
        ['an unknown field', { ...manifest(), extra: true }],
    ])('rejects %s', (_, value) => {
        expect(() => parseRemoteRenderManifest(value, expected)).toThrow('localTranslation.invalidRemoteManifest');
    });

    it('checks the bytes against the announced hash before reading them', async () => {
        const bytes = new TextEncoder().encode(JSON.stringify(manifest()));
        const hash = createHash('sha256').update(bytes).digest('hex');
        await expect(parseRemoteRenderManifestBytes(bytes, hash, expected)).resolves.toMatchObject({ jobRef: JOB });
        await expect(parseRemoteRenderManifestBytes(bytes, 'f'.repeat(64), expected)).rejects.toThrow('localTranslation.invalidRemoteManifest');
    });
});

function fixture(pages = 1) {
    const sqlite = new DatabaseSync(':memory:');
    sqlite.exec(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE translation_projects (id TEXT PRIMARY KEY, status TEXT, updated_at INTEGER, status_updated_at INTEGER);
        CREATE TABLE translation_pages (id TEXT PRIMARY KEY, project_id TEXT, position INTEGER, status TEXT, updated_at INTEGER, status_updated_at INTEGER,
            UNIQUE(project_id, position), FOREIGN KEY(project_id) REFERENCES translation_projects(id) ON DELETE CASCADE);
        CREATE TABLE remote_processing_attempts (id TEXT PRIMARY KEY, page_id TEXT, remote_job_ref TEXT, status TEXT, remote_status TEXT,
            FOREIGN KEY(page_id) REFERENCES translation_pages(id) ON DELETE CASCADE);
        INSERT INTO translation_projects VALUES ('project', 'PROCESSING', 1, 1);
    `);
    sqlite.exec(CREATE_PROJECT_TERMS_SCHEMA);
    for (let index = 0; index < pages; index++) {
        sqlite.prepare('INSERT INTO translation_pages VALUES (?, ?, ?, ?, ?, ?)').run(`page-${index}`, 'project', index, 'PROCESSING', 1, 1);
    }
    sqlite.prepare('INSERT INTO remote_processing_attempts VALUES (?, ?, ?, ?, ?)').run('attempt', 'page-0', JOB, 'ACCEPTED', 'READY');
    sqlite.exec(CREATE_LOCAL_TRANSLATION_SCHEMA);
    const executor: SqlExecutor = {
        execAsync: async source => sqlite.exec(source),
        runAsync: async (source, params) => sqlite.prepare(source).run(...(params as SQLInputValue[])),
        getFirstAsync: async <T>(source: string, params?: unknown) =>
            (sqlite.prepare(source).get(...((params ?? []) as SQLInputValue[])) as T | undefined) ?? null,
        getAllAsync: async <T>(source: string, params?: unknown) => sqlite.prepare(source).all(...((params ?? []) as SQLInputValue[])) as T[],
    };
    const transaction = async (task: (transaction: SqlExecutor) => Promise<void>) => {
        sqlite.exec('BEGIN IMMEDIATE');
        try {
            await task(executor);
            sqlite.exec('COMMIT');
        } catch (error) {
            sqlite.exec('ROLLBACK');
            throw error;
        }
    };
    const repository = createSqliteLocalTranslationResultRepository(
        async () => ({ ...executor, withExclusiveTransactionAsync: transaction }),
        { initialize: async () => undefined, listAll: async () => [] },
        { initialize: async () => undefined },
    );
    // The repository runs its own migration; it must not touch the already created tables.
    const status = (table: string, id: string) => (sqlite.prepare(`SELECT status FROM ${table} WHERE id = ?`).get(id) as { status: string }).status;
    return { sqlite, repository, status };
}

const commit = (value = manifest()) => ({
    projectId: 'project',
    pageId: 'page-0',
    attemptId: 'attempt',
    renderedFilename: 'remote-page-0-attempt',
    ...IMAGE,
    readyAt: 50,
    manifest: value,
});

describe('MOB-FEAT-021/AC-002/004 remote result commit', () => {
    it('writes result, regions and geometry in one transaction and only then makes the page and project READY', async () => {
        const f = fixture();
        try {
            await f.repository.saveRemoteResult(commit());
            const result = await f.repository.getByPage('page-0');
            expect(result).toMatchObject({ sourceKind: 'REMOTE', attemptId: 'attempt', mimeType: 'image/webp', autoOpenedAt: null });
            expect(result?.regions[0]).toMatchObject({
                translatedText: 'Olá',
                translationMetadata: { contractVersion: '1.1', model: 'translation-gateway', translatedAt: 50 },
                vertices: [
                    { index: 0, x: 0.1, y: 0.1 },
                    { index: 1, x: 0.5, y: 0.1 },
                    { index: 2, x: 0.5, y: 0.2 },
                    { index: 3, x: 0.1, y: 0.2 },
                ],
            });
            expect(f.status('translation_pages', 'page-0')).toBe('READY');
            expect(f.status('translation_projects', 'project')).toBe('READY');
            // The same attempt again changes nothing.
            await f.repository.saveRemoteResult(commit());
            expect(f.sqlite.prepare('SELECT COUNT(*) AS total FROM text_regions').get()).toEqual({ total: 1 });
        } finally {
            f.sqlite.close();
        }
    });

    it('keeps the project processing while other pages are not ready', async () => {
        const f = fixture(2);
        try {
            await f.repository.saveRemoteResult(commit());
            expect(f.status('translation_pages', 'page-0')).toBe('READY');
            expect(f.status('translation_projects', 'project')).toBe('PROCESSING');
        } finally {
            f.sqlite.close();
        }
    });

    it('commits nothing for an attempt that is not READY or a manifest of another job', async () => {
        const f = fixture();
        try {
            await expect(f.repository.saveRemoteResult(commit(manifest({ jobRef: '30000000-0000-4000-8000-000000000009' })))).rejects.toThrow();
            f.sqlite.prepare("UPDATE remote_processing_attempts SET remote_status = 'RENDERING'").run();
            await expect(f.repository.saveRemoteResult(commit())).rejects.toThrow();
            expect(f.sqlite.prepare('SELECT COUNT(*) AS total FROM translation_page_results').get()).toEqual({ total: 0 });
            expect(f.status('translation_pages', 'page-0')).toBe('PROCESSING');
        } finally {
            f.sqlite.close();
        }
    });
});

describe('MOB-FEAT-023/AC-001 chapter glossary saved with the result', () => {
    const withTerms = (terms: RemoteRenderManifest['terms']) => manifest({ version: '1.2', terms });

    it('accepts 1.2 with terms and 1.1 without, and nothing in between', () => {
        expect(parseRemoteRenderManifest(withTerms([{ source: 'Coriander', target: 'Coriander' }]), expected).terms).toHaveLength(1);
        expect(() => parseRemoteRenderManifest(manifest({ version: '1.2' }), expected)).toThrow();
        expect(() => parseRemoteRenderManifest(manifest({ terms: [] }), expected)).toThrow();
        expect(() => parseRemoteRenderManifest(withTerms([{ source: 'two\nlines', target: 'x' }]), expected)).toThrow();
        expect(() =>
            parseRemoteRenderManifest(
                withTerms([
                    { source: 'Coriander', target: 'Coriander' },
                    { source: 'Coriander', target: 'Coentro' },
                ]),
                expected,
            ),
        ).toThrow();
    });

    it('stores the page terms in the same commit; the first decision of the project stays', async () => {
        const f = fixture();
        try {
            f.sqlite.prepare('INSERT INTO translation_project_terms VALUES (?, ?, ?, ?)').run('project', 'Pepper', 'Pepper', 10);
            await f.repository.saveRemoteResult(
                commit(
                    withTerms([
                        { source: 'Pepper', target: 'Pimenta' },
                        { source: 'Coriander', target: 'Coentro' },
                    ]),
                ),
            );
            expect(f.sqlite.prepare('SELECT source_term, target_term FROM translation_project_terms ORDER BY source_term').all()).toEqual([
                { source_term: 'Coriander', target_term: 'Coentro' },
                { source_term: 'Pepper', target_term: 'Pepper' },
            ]);
            await f.repository.removeProject('project');
            expect(f.sqlite.prepare('SELECT COUNT(*) AS total FROM translation_project_terms').get()).toEqual({ total: 0 });
        } finally {
            f.sqlite.close();
        }
    });

    it('a result that cannot be committed leaves no terms behind', async () => {
        const f = fixture();
        try {
            f.sqlite.prepare("UPDATE remote_processing_attempts SET remote_status = 'RENDERING'").run();
            await expect(f.repository.saveRemoteResult(commit(withTerms([{ source: 'Pepper', target: 'Pepper' }])))).rejects.toThrow();
            expect(f.sqlite.prepare('SELECT COUNT(*) AS total FROM translation_project_terms').get()).toEqual({ total: 0 });
        } finally {
            f.sqlite.close();
        }
    });
});
