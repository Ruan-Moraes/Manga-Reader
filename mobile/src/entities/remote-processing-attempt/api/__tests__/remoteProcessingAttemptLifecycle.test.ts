import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { AppDatabase, SqlExecutor } from '@/shared/storage';

import { CREATE_REMOTE_PROCESSING_SCHEMA, createSqliteRemoteProcessingAttemptRepository } from '../remoteProcessingAttemptRepository';

const JOB = '30000000-0000-4000-8000-000000000001';

function fixture(pages = 1) {
    const sqlite = new DatabaseSync(':memory:');
    sqlite.exec(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE translation_projects (id TEXT PRIMARY KEY, status TEXT, language_review_required INTEGER, updated_at INTEGER, status_updated_at INTEGER);
        CREATE TABLE translation_pages (id TEXT PRIMARY KEY, project_id TEXT, position INTEGER, status TEXT, updated_at INTEGER, status_updated_at INTEGER,
            FOREIGN KEY(project_id) REFERENCES translation_projects(id) ON DELETE CASCADE);
        INSERT INTO translation_projects VALUES ('project', 'DRAFT', 0, 1, 1);
    `);
    for (let index = 0; index < pages; index++) {
        sqlite.prepare('INSERT INTO translation_pages VALUES (?, ?, ?, ?, ?, ?)').run(`page-${index}`, 'project', index, 'DRAFT', 1, 1);
    }
    let version = 9;
    const executor: SqlExecutor = {
        execAsync: async source => {
            const match = source.match(/PRAGMA user_version = (\d+)/);
            if (match) version = Number(match[1]);
            else sqlite.exec(source);
        },
        runAsync: async (source, params) => sqlite.prepare(source).run(...(params as SQLInputValue[])),
        getFirstAsync: async <T>(source: string, params?: unknown) =>
            source === 'PRAGMA user_version'
                ? ({ user_version: version } as T)
                : ((sqlite.prepare(source).get(...((params ?? []) as SQLInputValue[])) as T | undefined) ?? null),
        getAllAsync: async <T>(source: string, params?: unknown) => sqlite.prepare(source).all(...((params ?? []) as SQLInputValue[])) as T[],
    };
    const database: AppDatabase = {
        ...executor,
        withExclusiveTransactionAsync: async task => {
            sqlite.exec('BEGIN IMMEDIATE');
            try {
                await task(executor);
                sqlite.exec('COMMIT');
            } catch (error) {
                sqlite.exec('ROLLBACK');
                throw error;
            }
        },
    };
    const repository = createSqliteRemoteProcessingAttemptRepository(async () => database, { initialize: async () => undefined });
    const status = (table: string, id: string) => (sqlite.prepare(`SELECT status FROM ${table} WHERE id = ?`).get(id) as { status: string }).status;
    return { sqlite, repository, status, version: () => version };
}

async function accepted(repository: ReturnType<typeof fixture>['repository'], pageId: string, jobRef: string) {
    const attempt = await repository.createOrGetActive({
        id: `attempt-${pageId}`,
        pageId,
        idempotencyKey: `key-${pageId}`,
        gatewayKey: 'local',
        gatewayContractVersion: '1.0',
        createdAt: 10,
    });
    await repository.markSubmitting(attempt.id, 11);
    return repository.acceptAndQueue(attempt.id, 'project', pageId, jobRef, 'QUEUED', 12);
}

describe('MOB-FEAT-021 SQLite v10 remote attempt lifecycle', () => {
    it('adds the ACK column to a v7 table without losing attempts and advances to v10', async () => {
        const f = fixture();
        try {
            f.sqlite.exec(CREATE_REMOTE_PROCESSING_SCHEMA);
            f.sqlite.exec(`INSERT INTO remote_processing_attempts (id, page_id, attempt_number, idempotency_key, gateway_key, gateway_contract_version,
                status, created_at, updated_at) VALUES ('old', 'page-0', 1, 'old-key', 'local', '1.0', 'CREATED', 5, 5)`);
            await f.repository.initialize();
            expect(f.version()).toBe(10);
            expect((await f.repository.getById('old'))?.resultAcknowledgedAt).toBeNull();
        } finally {
            f.sqlite.close();
        }
    });

    it('follows accepted attempts through confirmed stages: queued page becomes PROCESSING, never back', async () => {
        const f = fixture();
        try {
            const attempt = await accepted(f.repository, 'page-0', JOB);
            expect((await f.repository.listActive()).map(item => item.id)).toEqual([attempt.id]);
            expect(f.status('translation_projects', 'project')).toBe('QUEUED');
            await f.repository.advance(attempt.id, 'TRANSLATING', 20);
            expect(f.status('translation_pages', 'page-0')).toBe('PROCESSING');
            expect(f.status('translation_projects', 'project')).toBe('PROCESSING');
            expect((await f.repository.getById(attempt.id))?.remoteStatus).toBe('TRANSLATING');
            await f.repository.markAcknowledged(attempt.id, 30);
            expect(await f.repository.listActive()).toEqual([]);
            expect((await f.repository.getById(attempt.id))?.resultAcknowledgedAt).toBe(30);
        } finally {
            f.sqlite.close();
        }
    });

    it('a remote failure fails the page; the project fails only once no page is left to run', async () => {
        const f = fixture(2);
        try {
            const first = await accepted(f.repository, 'page-0', JOB);
            await f.repository.markRemoteFailed(first.id, 'RESULT_EXPIRED', 20);
            expect(f.status('translation_pages', 'page-0')).toBe('FAILED');
            expect(f.status('translation_projects', 'project')).toBe('QUEUED');
            const failed = await f.repository.getById(first.id);
            expect(failed?.status).toBe('FAILED');
            expect(failed?.remoteStatus).toBe('RESULT_EXPIRED');
            expect(await f.repository.listActive()).toEqual([]);

            f.sqlite.prepare("UPDATE translation_pages SET status = 'QUEUED' WHERE id = 'page-1'").run();
            const second = await f.repository.createOrGetActive({
                id: 'attempt-page-1',
                pageId: 'page-1',
                idempotencyKey: 'key-page-1',
                gatewayKey: 'local',
                gatewayContractVersion: '1.0',
                createdAt: 21,
            });
            f.sqlite
                .prepare("UPDATE remote_processing_attempts SET status = 'ACCEPTED', remote_job_ref = ?, accepted_at = 21 WHERE id = ?")
                .run('30000000-0000-4000-8000-000000000002', second.id);
            await f.repository.markRemoteFailed(second.id, 'FAILED', 22);
            expect(f.status('translation_projects', 'project')).toBe('FAILED');
        } finally {
            f.sqlite.close();
        }
    });
});

describe('MOB-FEAT-022 several pages of one project', () => {
    it('accepts page 2 while the project is already processing and lists the latest attempt of each page in order', async () => {
        const f = fixture(2);
        try {
            const first = await accepted(f.repository, 'page-0', JOB);
            await f.repository.advance(first.id, 'RENDERING', 20);
            expect(f.status('translation_projects', 'project')).toBe('PROCESSING');
            const second = await accepted(f.repository, 'page-1', '30000000-0000-4000-8000-000000000002');
            expect(second.status).toBe('ACCEPTED');
            expect(f.status('translation_pages', 'page-1')).toBe('QUEUED');
            expect(f.status('translation_projects', 'project')).toBe('PROCESSING');
            expect((await f.repository.listLatestByProject('project')).map(item => item.pageId)).toEqual(['page-0', 'page-1']);
        } finally {
            f.sqlite.close();
        }
    });

    it('reopens only a failed page, and a failed project resumes', async () => {
        const f = fixture();
        try {
            const first = await accepted(f.repository, 'page-0', JOB);
            await f.repository.markRemoteFailed(first.id, 'FAILED', 20);
            expect(f.status('translation_projects', 'project')).toBe('FAILED');
            await f.repository.reopenFailedPage('page-0', 30);
            expect(f.status('translation_pages', 'page-0')).toBe('DRAFT');
            expect(f.status('translation_projects', 'project')).toBe('PROCESSING');
            const retry = await f.repository.createOrGetActive({
                id: 'retry',
                pageId: 'page-0',
                idempotencyKey: 'retry-key',
                gatewayKey: 'local',
                gatewayContractVersion: '1.0',
                createdAt: 31,
            });
            expect(retry.attemptNumber).toBe(2);
        } finally {
            f.sqlite.close();
        }
    });
});
