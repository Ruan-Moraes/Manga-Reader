import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { SqlExecutor } from '@/shared/storage';

import { CREATE_LOCAL_TRANSLATION_SCHEMA, createSqliteLocalTranslationResultRepository } from '../localTranslationResultRepository';
import { insertRemoteTranslationRegions, type RemoteTranslationRegionsInsert } from '../remoteTranslationRegionsStorage';

const PAGE = '10000000-0000-4000-8000-000000000001';
const ATTEMPT = '20000000-0000-4000-8000-000000000001';
const JOB = '30000000-0000-4000-8000-000000000001';
const REGION_A = '40000000-0000-4000-8000-000000000001';
const REGION_B = '40000000-0000-4000-8000-000000000002';
const OTHER = '90000000-0000-4000-8000-000000000001';

function command(): RemoteTranslationRegionsInsert {
    return {
        pageId: PAGE,
        attemptId: ATTEMPT,
        acquiredAt: 200,
        expected: {
            jobRef: JOB,
            sourceLanguage: 'zh-Hant',
            targetLanguage: 'zh-Hans',
            ocrManifestSha256: 'a'.repeat(64),
            regions: [
                {
                    id: REGION_A,
                    readingOrder: 0,
                    sourceText: '繁體\n<b>原文</b> 😀',
                    polygon: [
                        { x: 0.1, y: 0.2 },
                        { x: 0.4, y: 0.2 },
                        { x: 0.4, y: 0.3 },
                        { x: 0.1, y: 0.3 },
                    ],
                },
                {
                    id: REGION_B,
                    readingOrder: 1,
                    sourceText: '第二段',
                    polygon: [
                        { x: 0.5, y: 0.6 },
                        { x: 0.8, y: 0.6 },
                        { x: 0.8, y: 0.9 },
                        { x: 0.5, y: 0.9 },
                    ],
                },
            ],
        },
        manifest: {
            version: '1.0',
            jobRef: JOB,
            sourceLanguage: 'zh-Hant',
            targetLanguage: 'zh-Hans',
            ocrManifestSha256: 'a'.repeat(64),
            model: 'general/translation-llm',
            regions: [
                { id: REGION_B, readingOrder: 1, translatedText: '第二段译文' },
                { id: REGION_A, readingOrder: 0, translatedText: '简体\n<b>译文</b> 😀' },
            ],
        },
        overflow: [
            { regionId: REGION_B, overflow: true },
            { regionId: REGION_A, overflow: false },
        ],
    };
}

function fixture(failure?: 'region' | 'vertex' | 'commit') {
    const sqlite = new DatabaseSync(':memory:');
    sqlite.exec(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE translation_projects (id TEXT PRIMARY KEY, source_language TEXT, target_language TEXT, status TEXT);
        CREATE TABLE translation_pages (id TEXT PRIMARY KEY, project_id TEXT, position INTEGER, status TEXT,
            UNIQUE(project_id, position), FOREIGN KEY(project_id) REFERENCES translation_projects(id) ON DELETE CASCADE);
        CREATE TABLE remote_processing_attempts (id TEXT PRIMARY KEY, page_id TEXT, remote_job_ref TEXT, status TEXT, remote_status TEXT,
            FOREIGN KEY(page_id) REFERENCES translation_pages(id) ON DELETE CASCADE);
        INSERT INTO translation_projects VALUES ('project', 'zh-Hant', 'zh-Hans', 'PROCESSING');
    `);
    sqlite.prepare('INSERT INTO translation_pages VALUES (?, ?, ?, ?)').run(PAGE, 'project', 0, 'PROCESSING');
    sqlite.prepare('INSERT INTO remote_processing_attempts VALUES (?, ?, ?, ?, ?)').run(ATTEMPT, PAGE, JOB, 'ACCEPTED', 'READY');
    sqlite.exec(CREATE_LOCAL_TRANSLATION_SCHEMA);
    const executor: SqlExecutor = {
        execAsync: async source => sqlite.exec(source),
        runAsync: async (source, params) => {
            const result = sqlite.prepare(source).run(...(params as SQLInputValue[]));
            if (source.includes('INSERT INTO text_regions') && failure === 'region') throw new Error('private source SQL');
            if (source.includes('INSERT INTO text_region_vertices') && failure === 'vertex') throw new Error('private vertex SQL');
            return result;
        },
        getFirstAsync: async <T>(source: string, params?: unknown) =>
            (sqlite.prepare(source).get(...((params ?? []) as SQLInputValue[])) as T | undefined) ?? null,
        getAllAsync: async <T>(source: string, params?: unknown) => sqlite.prepare(source).all(...((params ?? []) as SQLInputValue[])) as T[],
    };
    const insertParent = (source = 'REMOTE', attemptId: string | null = ATTEMPT) => {
        sqlite
            .prepare('INSERT INTO translation_page_results VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
            .run(PAGE, attemptId, source, 'verified.webp', 'image/webp', 100, 100, 200, 'b'.repeat(64), 200, null);
    };
    const transaction = async (task: (transaction: SqlExecutor) => Promise<void>) => {
        sqlite.exec('BEGIN IMMEDIATE');
        try {
            await task(executor);
            if (failure === 'commit') throw new Error('injected commit failure');
            sqlite.exec('COMMIT');
        } catch (error) {
            sqlite.exec('ROLLBACK');
            throw error;
        }
    };
    return { sqlite, executor, insertParent, transaction };
}

describe('MOB-FEAT-019/AC-002/003/004 local remote translation region storage', () => {
    it('writes exact text, metadata, geometry and renderer-provided overflow in the caller transaction without changing state', async () => {
        const f = fixture();
        try {
            await f.transaction(async transaction => {
                f.insertParent();
                await insertRemoteTranslationRegions(transaction, command());
            });
            const repository = createSqliteLocalTranslationResultRepository(
                async () => ({ ...f.executor, withExclusiveTransactionAsync: f.transaction }),
                { initialize: async () => undefined, listAll: async () => [] },
                { initialize: async () => undefined },
            );
            const result = await repository.getByPage(PAGE);
            expect(result?.regions).toEqual(
                command().expected.regions.map((region, index) => ({
                    id: region.id,
                    pageId: PAGE,
                    readingOrder: index,
                    sourceText: region.sourceText,
                    translatedText: index === 0 ? '简体\n<b>译文</b> 😀' : '第二段译文',
                    translationMetadata: { contractVersion: '1.0', model: 'general/translation-llm', translatedAt: 200 },
                    overflow: index === 1,
                    createdAt: 200,
                    vertices: region.polygon.map((point, vertexIndex) => ({ index: vertexIndex, ...point })),
                })),
            );
            expect(f.sqlite.prepare('SELECT status FROM translation_pages').get()?.status).toBe('PROCESSING');
            expect(f.sqlite.prepare('SELECT status FROM translation_projects').get()?.status).toBe('PROCESSING');
            expect(f.sqlite.prepare('SELECT auto_opened_at FROM translation_page_results').get()?.auto_opened_at).toBeNull();
            expect(f.sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
            await repository.removeProject('project');
            expect(f.sqlite.prepare('SELECT * FROM text_regions').all()).toEqual([]);
            expect(f.sqlite.prepare('SELECT * FROM text_region_vertices').all()).toEqual([]);
        } finally {
            f.sqlite.close();
        }
    });

    it.each([
        ['missing parent', 'DELETE FROM translation_page_results'],
        ['demo parent', "UPDATE translation_page_results SET source_kind = 'DEMO', attempt_id = NULL"],
        ['wrong job', `UPDATE remote_processing_attempts SET remote_job_ref = '${OTHER}'`],
        [
            'wrong page',
            `INSERT INTO translation_pages VALUES ('${OTHER}', 'project', 1, 'PROCESSING'); UPDATE remote_processing_attempts SET page_id = '${OTHER}'`,
        ],
        ['wrong source variant', "UPDATE translation_projects SET source_language = 'zh-Hans'"],
        ['wrong target variant', "UPDATE translation_projects SET target_language = 'zh-Hant'"],
        ['cancelled', "UPDATE remote_processing_attempts SET status = 'CANCELLED', remote_status = 'CANCELLED'"],
        ['cancel pending', "UPDATE remote_processing_attempts SET status = 'CANCEL_PENDING', remote_status = 'CANCEL_PENDING'"],
        ['not rendered', "UPDATE remote_processing_attempts SET remote_status = 'RENDERING'"],
        ['acquisition predates result', 'UPDATE translation_page_results SET ready_at = 201'],
    ])('rejects %s without inserting any regions', async (_name, sql) => {
        const f = fixture();
        try {
            f.insertParent();
            f.sqlite.exec(sql);
            await expect(f.transaction(tx => insertRemoteTranslationRegions(tx, command()))).rejects.toThrow('localTranslation.invalidRemoteManifest');
            expect(f.sqlite.prepare('SELECT * FROM text_regions').all()).toEqual([]);
        } finally {
            f.sqlite.close();
        }
    });

    it.each([
        [
            'wrong attempt',
            (c: RemoteTranslationRegionsInsert) => {
                c.attemptId = OTHER;
            },
        ],
        [
            'wrong page reference',
            (c: RemoteTranslationRegionsInsert) => {
                c.pageId = OTHER;
            },
        ],
        [
            'invalid page',
            (c: RemoteTranslationRegionsInsert) => {
                c.pageId = '../private';
            },
        ],
        [
            'timestamp',
            (c: RemoteTranslationRegionsInsert) => {
                c.acquiredAt = 0;
            },
        ],
        [
            'missing overflow',
            (c: RemoteTranslationRegionsInsert) => {
                c.overflow = [];
            },
        ],
        [
            'extra overflow',
            (c: RemoteTranslationRegionsInsert) => {
                c.overflow = [...c.overflow, { regionId: OTHER, overflow: false }];
            },
        ],
        [
            'duplicate overflow',
            (c: RemoteTranslationRegionsInsert) => {
                c.overflow = [c.overflow[0]!, c.overflow[0]!];
            },
        ],
        [
            'invalid overflow',
            (c: RemoteTranslationRegionsInsert) => {
                c.overflow = [{ regionId: REGION_A, overflow: 'false' as unknown as boolean }, c.overflow[0]!];
            },
        ],
        [
            'invalid response',
            (c: RemoteTranslationRegionsInsert) => {
                c.manifest = {};
            },
        ],
        [
            'invalid geometry',
            (c: RemoteTranslationRegionsInsert) => {
                c.expected = { ...c.expected, regions: [{ ...c.expected.regions[0]!, polygon: [] }, c.expected.regions[1]!] };
            },
        ],
    ])('rejects %s before writing data', async (_name, mutate) => {
        const f = fixture();
        try {
            f.insertParent();
            const c = command();
            mutate(c);
            await expect(f.transaction(tx => insertRemoteTranslationRegions(tx, c))).rejects.toThrow('localTranslation.invalidRemoteManifest');
            expect(f.sqlite.prepare('SELECT * FROM text_regions').all()).toEqual([]);
            expect(f.sqlite.prepare('SELECT * FROM text_region_vertices').all()).toEqual([]);
        } finally {
            f.sqlite.close();
        }
    });

    it('does not overwrite an existing result on replay', async () => {
        const f = fixture();
        try {
            f.insertParent();
            await f.transaction(tx => insertRemoteTranslationRegions(tx, command()));
            const before = f.sqlite.prepare('SELECT * FROM text_regions ORDER BY reading_order').all();
            await expect(f.transaction(tx => insertRemoteTranslationRegions(tx, command()))).rejects.toThrow('localTranslation.invalidRemoteManifest');
            expect(f.sqlite.prepare('SELECT * FROM text_regions ORDER BY reading_order').all()).toEqual(before);
        } finally {
            f.sqlite.close();
        }
    });

    it.each(['region', 'vertex', 'commit'] as const)('rolls back the parent, text, metadata and vertices on %s failure', async failure => {
        const f = fixture(failure);
        try {
            await expect(
                f.transaction(async tx => {
                    f.insertParent();
                    await insertRemoteTranslationRegions(tx, command());
                }),
            ).rejects.toThrow();
            expect(f.sqlite.prepare('SELECT * FROM translation_page_results').all()).toEqual([]);
            expect(f.sqlite.prepare('SELECT * FROM text_regions').all()).toEqual([]);
            expect(f.sqlite.prepare('SELECT * FROM text_region_vertices').all()).toEqual([]);
            expect(f.sqlite.prepare('SELECT status FROM translation_pages').get()?.status).toBe('PROCESSING');
        } finally {
            f.sqlite.close();
        }
    });

    it('snapshots caller-owned manifest, reference, flags and timestamp before the first await', async () => {
        const f = fixture();
        try {
            f.insertParent();
            const c = command();
            const original = f.executor.getFirstAsync;
            let mutated = false;
            f.executor.getFirstAsync = async <T>(sql: string, params?: Parameters<SqlExecutor['getFirstAsync']>[1]) => {
                if (!mutated) {
                    mutated = true;
                    c.acquiredAt = 999;
                    (c.manifest as { regions: { translatedText: string }[] }).regions[0]!.translatedText = 'tampered';
                    c.overflow[0]!.overflow = false;
                    c.overflow = [];
                    c.expected.sourceLanguage = 'en';
                    (c.expected.regions[0]!.polygon[0] as { x: number; y: number }).x = 0.9;
                    c.manifest = {};
                }
                return original<T>(sql, params);
            };
            await f.transaction(tx => insertRemoteTranslationRegions(tx, c));
            expect(f.sqlite.prepare('SELECT translated_at FROM text_regions').get()?.translated_at).toBe(200);
            expect(f.sqlite.prepare('SELECT translated_text, overflow FROM text_regions WHERE id = ?').get(REGION_B)).toMatchObject({
                translated_text: '第二段译文',
                overflow: 1,
            });
            expect(f.sqlite.prepare('SELECT x FROM text_region_vertices WHERE region_id = ? AND vertex_index = 0').get(REGION_A)?.x).toBe(0.1);
        } finally {
            f.sqlite.close();
        }
    });

    it('persists a genuinely empty manifest with no invented regions', async () => {
        const f = fixture();
        try {
            f.insertParent();
            const c = command();
            c.expected.regions = [];
            c.manifest = { ...(c.manifest as object), regions: [] };
            c.overflow = [];
            await f.transaction(tx => insertRemoteTranslationRegions(tx, c));
            expect(f.sqlite.prepare('SELECT * FROM text_regions').all()).toEqual([]);
        } finally {
            f.sqlite.close();
        }
    });

    it('sanitizes SQL exceptions without leaking text, IDs, job or causes', async () => {
        const f = fixture('region');
        try {
            f.insertParent();
            const error = await f.transaction(tx => insertRemoteTranslationRegions(tx, command())).catch((e: unknown) => e);
            expect(String(error)).toBe('Error: localTranslation.invalidRemoteManifest');
            expect((error as Error).cause).toBeUndefined();
            expect(f.sqlite.prepare('SELECT * FROM text_regions').all()).toEqual([]);
        } finally {
            f.sqlite.close();
        }
    });

    it('writes the maximum region count in bounded batches rather than thousands of native calls', async () => {
        const f = fixture();
        try {
            f.insertParent();
            const c = command();
            c.expected.regions = Array.from({ length: 1024 }, (_, index) => ({
                ...c.expected.regions[0]!,
                id: `40000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
                readingOrder: index,
                sourceText: '原文',
            }));
            c.manifest = {
                ...(c.manifest as object),
                regions: c.expected.regions.map(region => ({ id: region.id, readingOrder: region.readingOrder, translatedText: '译文' })),
            };
            c.overflow = c.expected.regions.map(region => ({ regionId: region.id, overflow: false }));
            const execute = f.executor.runAsync;
            let writes = 0;
            f.executor.runAsync = async (sql, params) => {
                writes++;
                expect(Array.isArray(params) ? params.length : Object.keys(params).length).toBeLessThanOrEqual(800);
                return execute(sql, params);
            };
            await f.transaction(tx => insertRemoteTranslationRegions(tx, c));
            expect(writes).toBeLessThanOrEqual(40);
            expect(f.sqlite.prepare('SELECT COUNT(*) AS total FROM text_regions').get()?.total).toBe(1024);
            expect(f.sqlite.prepare('SELECT COUNT(*) AS total FROM text_region_vertices').get()?.total).toBe(4096);
            expect(f.sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
        } finally {
            f.sqlite.close();
        }
    });

    it('rejects foreign-key-disabled executors before any insert', async () => {
        const f = fixture();
        try {
            f.insertParent();
            f.sqlite.exec('PRAGMA foreign_keys = OFF');
            await expect(f.transaction(tx => insertRemoteTranslationRegions(tx, command()))).rejects.toThrow('localTranslation.invalidRemoteManifest');
            expect(f.sqlite.prepare('SELECT * FROM text_regions').all()).toEqual([]);
        } finally {
            f.sqlite.close();
        }
    });
});
