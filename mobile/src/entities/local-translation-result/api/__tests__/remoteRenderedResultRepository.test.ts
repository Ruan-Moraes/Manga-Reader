import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { AppDatabase, SqlExecutor } from '@/shared/storage';

import { CREATE_LOCAL_TRANSLATION_SCHEMA, createSqliteLocalTranslationResultRepository } from '../localTranslationResultRepository';
import { createRemoteRenderedResultRepository } from '../remoteRenderedResultRepository';
const PAGE = '10000000-0000-4000-8000-000000000001',
    ATTEMPT = '20000000-0000-4000-8000-000000000001',
    JOB = '30000000-0000-4000-8000-000000000001';
const PROJECT = '50000000-0000-4000-8000-000000000001';
function fixture(fail = false, abort?: AbortController) {
    const sql = new DatabaseSync(':memory:');
    sql.exec(`PRAGMA foreign_keys=ON; CREATE TABLE translation_projects(id TEXT PRIMARY KEY, source_language TEXT, target_language TEXT, status TEXT, updated_at INTEGER, status_updated_at INTEGER);
    CREATE TABLE translation_pages(id TEXT PRIMARY KEY, project_id TEXT, position INTEGER, status TEXT, width_px INTEGER, height_px INTEGER, updated_at INTEGER, status_updated_at INTEGER, UNIQUE(project_id,position));
    CREATE TABLE remote_processing_attempts(id TEXT PRIMARY KEY, page_id TEXT, remote_job_ref TEXT, status TEXT, remote_status TEXT, gateway_contract_version TEXT, volatile_receipt_status TEXT, error_code TEXT, updated_at INTEGER);`);
    sql.prepare('INSERT INTO translation_projects VALUES (?, ?, ?, ?, ?, ?)').run(PROJECT, 'en', 'pt-BR', 'PROCESSING', 100, 100);
    sql.prepare('INSERT INTO translation_pages VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(PAGE, PROJECT, 0, 'PROCESSING', 900, 600, 100, 100);
    sql.prepare(
        'INSERT INTO remote_processing_attempts(id,page_id,remote_job_ref,status,remote_status,gateway_contract_version,volatile_receipt_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(ATTEMPT, PAGE, JOB, 'ACCEPTED', 'READY', '2.0', 'FINISHED');
    sql.exec(CREATE_LOCAL_TRANSLATION_SCHEMA);
    const executor: SqlExecutor = {
        execAsync: async s => sql.exec(s),
        runAsync: async (s, p) => {
            const result = sql.prepare(s).run(...((p ?? []) as SQLInputValue[]));
            if (s.includes('INSERT INTO text_region_vertices')) abort?.abort();
            if (fail && s.includes('INSERT INTO text_region_vertices')) throw new Error('private SQL');
            return result;
        },
        getFirstAsync: async <T>(s: string, p?: unknown) => (sql.prepare(s).get(...((p ?? []) as SQLInputValue[])) as T) ?? null,
        getAllAsync: async <T>(s: string, p?: unknown) => sql.prepare(s).all(...((p ?? []) as SQLInputValue[])) as T[],
    };
    const db: AppDatabase = {
        ...executor,
        withExclusiveTransactionAsync: async task => {
            sql.exec('BEGIN IMMEDIATE');
            try {
                await task(executor);
                sql.exec('COMMIT');
            } catch (e) {
                sql.exec('ROLLBACK');
                throw e;
            }
        },
    };
    const manifest = {
        version: '1.0' as const,
        policyVersion: 'clean-box-1.1' as const,
        jobRef: JOB,
        sourceLanguage: 'en' as const,
        targetLanguage: 'pt-BR' as const,
        originalSha256: 'a'.repeat(64),
        ocrSha256: 'b'.repeat(64),
        translationSha256: 'c'.repeat(64),
        image: { mimeType: 'image/webp' as const, byteSize: 100, widthPx: 900, heightPx: 600, sha256: 'd'.repeat(64) },
        regions: [
            {
                id: '40000000-0000-4000-8000-000000000001',
                readingOrder: 0,
                sourceText: 'Hello!',
                translatedText: 'Olá!',
                polygon: [
                    { x: 0.1, y: 0.1 },
                    { x: 0.9, y: 0.1 },
                    { x: 0.9, y: 0.9 },
                    { x: 0.1, y: 0.9 },
                ],
                overflow: false,
                fontSizePx: 27,
            },
        ],
    };
    const command = { projectId: PROJECT, pageId: PAGE, attemptId: ATTEMPT, manifest, renderedFilename: 'verified_result', readyAt: 200 };
    return {
        sql,
        command,
        db,
        repository: createRemoteRenderedResultRepository(
            async () => db,
            async () => undefined,
        ),
    };
}
it('atomically stores REMOTE and regions then READY, preserving original schema and claiming auto-open once', async () => {
    const f = fixture();
    try {
        await expect(f.repository.commit(f.command)).resolves.toBe(true);
        expect(f.sql.prepare('SELECT source_kind, attempt_id FROM translation_page_results').get()).toMatchObject({
            source_kind: 'REMOTE',
            attempt_id: ATTEMPT,
        });
        expect(f.sql.prepare('SELECT translated_text, translation_model FROM text_regions').get()).toMatchObject({
            translated_text: 'Olá!',
            translation_model: null,
        });
        expect(f.sql.prepare('SELECT status FROM translation_pages').get()?.status).toBe('READY');
        expect(f.sql.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
        await expect(f.repository.claimAutoOpen(PAGE, 201)).resolves.toBe(true);
        await expect(f.repository.claimAutoOpen(PAGE, 202)).resolves.toBe(false);
        await expect(f.repository.commit(f.command)).resolves.toBe(false);
    } finally {
        f.sql.close();
    }
});
it('commits a pending page while preserving the saved result of a sibling', async () => {
    const f = fixture();
    try {
        const otherPage = 'prior-page';
        f.sql.prepare('INSERT INTO translation_pages VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(otherPage, PROJECT, 1, 'READY', 900, 600, 100, 100);
        f.sql
            .prepare(
                `INSERT INTO translation_page_results(page_id,source_kind,rendered_filename,mime_type,byte_size,width_px,height_px,sha256,ready_at)
            VALUES (?,'DEMO','prior-result','image/webp',100,900,600,?,150)`,
            )
            .run(otherPage, 'e'.repeat(64));
        const read = () => f.sql.prepare('SELECT * FROM translation_page_results WHERE page_id=?').get(otherPage);
        const saved = read();
        expect(await f.repository.commit(f.command)).toBe(true);
        expect(read()).toEqual(saved);
        expect(f.sql.prepare('SELECT status FROM translation_pages WHERE id=?').get(otherPage)?.status).toBe('READY');
    } finally {
        f.sql.close();
    }
});
it('retires the attempt of an invalidated local result and preserves an unrelated accepted attempt', async () => {
    const f = fixture();
    try {
        expect(await f.repository.commit(f.command)).toBe(true);
        f.sql.prepare("INSERT INTO remote_processing_attempts(id,page_id,status) VALUES ('other','other-page','ACCEPTED')").run();
        const local = createSqliteLocalTranslationResultRepository(
            async () => f.db,
            { initialize: async () => undefined, listAll: async () => [] },
            { initialize: async () => undefined },
        );
        await local.invalidate(PAGE, 300);
        expect(f.sql.prepare('SELECT status,error_code FROM remote_processing_attempts WHERE id=?').get(ATTEMPT)).toMatchObject({
            status: 'FAILED',
            error_code: 'storage-unavailable',
        });
        expect(f.sql.prepare("SELECT status FROM remote_processing_attempts WHERE id='other'").get()).toMatchObject({ status: 'ACCEPTED' });
        expect(f.sql.prepare('SELECT status FROM translation_pages WHERE id=?').get(PAGE)).toMatchObject({ status: 'FAILED' });
    } finally {
        f.sql.close();
    }
});
it('rolls back parent, regions and READY when vertex storage fails', async () => {
    const f = fixture(true);
    try {
        await expect(f.repository.commit(f.command)).rejects.toThrow('localTranslation.storageUnavailable');
        expect(f.sql.prepare('SELECT * FROM translation_page_results').all()).toEqual([]);
        expect(f.sql.prepare('SELECT status FROM translation_pages').get()?.status).toBe('PROCESSING');
    } finally {
        f.sql.close();
    }
});
it.each(['CANCEL_PENDING', 'CANCELLED', 'FAILED'])('refuses commit after %s wins', async status => {
    const f = fixture();
    try {
        f.sql.prepare('UPDATE remote_processing_attempts SET status=?').run(status);
        await expect(f.repository.commit(f.command)).rejects.toThrow('localTranslation.storageUnavailable');
        expect(f.sql.prepare('SELECT * FROM translation_page_results').all()).toEqual([]);
    } finally {
        f.sql.close();
    }
});

it.each(['STARTED', 'FAILED', null])('rejects publication without complete direct receipt (%s)', async receipt => {
    const f = fixture();
    try {
        f.sql.prepare('UPDATE remote_processing_attempts SET volatile_receipt_status=?').run(receipt);
        await expect(f.repository.commit(f.command)).rejects.toThrow('localTranslation.storageUnavailable');
        expect(f.sql.prepare('SELECT * FROM translation_page_results').all()).toEqual([]);
    } finally {
        f.sql.close();
    }
});
it('rejects new publication from the retired transport', async () => {
    const f = fixture();
    try {
        f.sql.prepare("UPDATE remote_processing_attempts SET gateway_contract_version='1.0'").run();
        await expect(f.repository.commit(f.command)).rejects.toThrow('localTranslation.storageUnavailable');
    } finally {
        f.sql.close();
    }
});
it.each(['before', 'vertices'])('rolls back an acquisition interrupted at %s', async point => {
    const abort = new AbortController(),
        f = fixture(false, point === 'vertices' ? abort : undefined);
    if (point === 'before') abort.abort();
    try {
        await expect(f.repository.commit({ ...f.command, signal: abort.signal })).rejects.toThrow('localTranslation.storageUnavailable');
        expect(f.sql.prepare('SELECT * FROM translation_page_results').all()).toEqual([]);
        expect(f.sql.prepare('SELECT * FROM text_regions').all()).toEqual([]);
        expect(f.sql.prepare('SELECT status FROM translation_pages').get()?.status).toBe('PROCESSING');
    } finally {
        f.sql.close();
    }
});

it('MOB-FEAT-023/AC-001: stores the chapter names of a 1.2 result with it; the first decision stays', async () => {
    const f = fixture();
    try {
        // Mirror of the project glossary table (translation-project v13).
        f.sql.exec(`CREATE TABLE translation_project_terms (project_id TEXT NOT NULL, source_term TEXT NOT NULL, target_term TEXT NOT NULL,
            created_at INTEGER NOT NULL, PRIMARY KEY (project_id, source_term))`);
        f.sql.prepare('INSERT INTO translation_project_terms VALUES (?, ?, ?, ?)').run(PROJECT, 'Coriander', 'Coriander', 50);
        const manifest = {
            ...f.command.manifest,
            version: '1.2' as const,
            policyVersion: 'clean-box-1.2' as const,
            regions: f.command.manifest.regions.map(region => ({ ...region, kept: false })),
            quality: { status: 'OK' as const, issues: [] },
            terms: [
                { source: 'Coriander', target: 'Coentro' },
                { source: 'Saffron', target: 'Saffron' },
            ],
        };
        await expect(f.repository.commit({ ...f.command, manifest })).resolves.toBe(true);
        expect(f.sql.prepare('SELECT source_term, target_term FROM translation_project_terms ORDER BY source_term').all()).toEqual([
            { source_term: 'Coriander', target_term: 'Coriander' },
            { source_term: 'Saffron', target_term: 'Saffron' },
        ]);
    } finally {
        f.sql.close();
    }
});
