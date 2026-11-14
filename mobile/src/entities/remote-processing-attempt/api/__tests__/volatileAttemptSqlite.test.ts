import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import { createSqliteTranslationProjectRepository } from '@/entities/translation-project/@x/remote-processing-attempt';
import type { AppDatabase } from '@/shared/storage';

import { CREATE_REMOTE_PROCESSING_SCHEMA, createSqliteRemoteProcessingAttemptRepository } from '../remoteProcessingAttemptRepository';

function database() {
    const sql = new DatabaseSync(':memory:');
    const db: AppDatabase = {
        execAsync: async query => {
            sql.exec(query);
        },
        runAsync: async (query, params) => sql.prepare(query).run(...(params as SQLInputValue[])),
        getFirstAsync: async <T>(query: string, params = []) => (sql.prepare(query).get(...(params as SQLInputValue[])) ?? null) as T | null,
        getAllAsync: async <T>(query: string, params = []) => sql.prepare(query).all(...(params as SQLInputValue[])) as T[],
        async withExclusiveTransactionAsync(work) {
            sql.exec('BEGIN IMMEDIATE');
            try {
                await work(db);
                sql.exec('COMMIT');
            } catch (error) {
                sql.exec('ROLLBACK');
                throw error;
            }
        },
    };
    return { sql, db };
}
it.each(['PROCESSING', 'READY'] as const)('accepts a pending page beside a saved page in a %s project', async chapterStatus => {
    const { sql, db } = database();
    try {
        const projects = createSqliteTranslationProjectRepository(async () => db);
        const attempts = createSqliteRemoteProcessingAttemptRepository(async () => db, projects);
        await attempts.initialize();
        sql.exec(
            "INSERT INTO translation_projects(id,source_language,target_language,status,created_at,updated_at,status_updated_at) VALUES('project','ja','pt-BR','PROCESSING',1,1,1)",
        );
        sql.exec(
            "INSERT INTO translation_pages(id,project_id,position,original_filename,original_byte_size,original_mime_type,width_px,height_px,media_validated_at,media_validation_policy_version,status,created_at,updated_at,status_updated_at) VALUES('first','project',0,'first',10,'image/png',32,16,1,1,'READY',1,1,1),('second','project',1,'second',10,'image/png',32,16,1,1,'DRAFT',1,1,1)",
        );
        sql.prepare('UPDATE translation_projects SET status=?').run(chapterStatus);
        const attempt = await attempts.createOrGetActive({
            id: 'second-attempt',
            pageId: 'second',
            idempotencyKey: 'second-key',
            gatewayKey: 'gateway',
            gatewayContractVersion: '2.0',
            createdAt: 2,
        });
        await attempts.markSubmitting(attempt.id, 3);
        await expect(attempts.acceptDirectResponse(attempt.id, 'project', 'second', 'operation', 4)).resolves.toMatchObject({ status: 'ACCEPTED' });
        expect(sql.prepare('SELECT status FROM translation_projects').get()).toMatchObject({ status: 'PROCESSING' });
        expect(sql.prepare("SELECT status FROM translation_pages WHERE id='first'").get()).toMatchObject({ status: 'READY' });
        expect(sql.prepare("SELECT status FROM translation_pages WHERE id='second'").get()).toMatchObject({ status: 'PROCESSING' });
    } finally {
        sql.close();
    }
});

it('binds direct delivery atomically without a queue and preserves the original on interruption', async () => {
    const { sql, db } = database();
    try {
        const projects = createSqliteTranslationProjectRepository(async () => db);
        const attempts = createSqliteRemoteProcessingAttemptRepository(async () => db, projects);
        await attempts.initialize();
        sql.exec(
            "INSERT INTO translation_projects(id,source_language,target_language,status,created_at,updated_at,status_updated_at) VALUES('project','ja','pt-BR','DRAFT',1,1,1)",
        );
        sql.exec(
            "INSERT INTO translation_pages(id,project_id,position,original_filename,original_byte_size,original_mime_type,width_px,height_px,media_validated_at,media_validation_policy_version,status,created_at,updated_at,status_updated_at) VALUES('page','project',0,'original',10,'image/png',32,16,1,1,'DRAFT',1,1,1)",
        );
        const attempt = await attempts.createOrGetActive({
            id: 'attempt',
            pageId: 'page',
            idempotencyKey: 'key',
            gatewayKey: 'gateway',
            gatewayContractVersion: '2.0',
            createdAt: 2,
        });
        await attempts.markSubmitting(attempt.id, 3);
        const accepted = await attempts.acceptDirectResponse(attempt.id, 'project', 'page', 'operation', 4);
        expect(accepted.remoteJobRef).toBe('operation');
        expect(sql.prepare("SELECT status FROM translation_pages WHERE id='page'").get()).toMatchObject({ status: 'PROCESSING' });
        await attempts.failVolatileAttempt(attempt.id, 5, 'submission-unknown');
        expect(sql.prepare("SELECT original_filename,status FROM translation_pages WHERE id='page'").get()).toMatchObject({
            original_filename: 'original',
            status: 'FAILED',
        });
        expect(sql.prepare("SELECT status FROM translation_projects WHERE id='project'").get()).toMatchObject({ status: 'PROCESSING' });
        const retry = await attempts.createOrGetActive({
            id: 'new-attempt',
            pageId: 'page',
            idempotencyKey: 'new-key',
            gatewayKey: 'gateway',
            gatewayContractVersion: '2.0',
            createdAt: 6,
        });
        expect(retry.idempotencyKey).toBe('new-key');
        await attempts.acceptDirectResponse(retry.id, 'project', 'page', 'new-operation', 7);
        expect(sql.prepare("SELECT status FROM translation_pages WHERE id='page'").get()).toMatchObject({ status: 'PROCESSING' });
        for (const status of ['READY', 'CANCELLED']) {
            sql.prepare('UPDATE translation_pages SET status=?').run(status);
            sql.prepare('UPDATE translation_projects SET status=?').run(status);
            await attempts.failVolatileAttempt(retry.id, 8, 'cancellation-unavailable');
            expect(sql.prepare("SELECT status FROM translation_pages WHERE id='page'").get()).toMatchObject({ status });
            expect(sql.prepare("SELECT status FROM translation_projects WHERE id='project'").get()).toMatchObject({ status });
            expect((await attempts.getById(retry.id))?.status).toBe('ACCEPTED');
        }
    } finally {
        sql.close();
    }
});
it.each(['CREATED', 'ACCEPTED', 'CANCEL_PENDING'] as const)(
    'preserves a restored %s attempt history and allows a confirmed fresh execution from a legacy QUEUED project',
    async status => {
        const { sql, db } = database();
        try {
            const projects = createSqliteTranslationProjectRepository(async () => db);
            const attempts = createSqliteRemoteProcessingAttemptRepository(async () => db, projects);
            await attempts.initialize();
            sql.exec(
                "INSERT INTO translation_projects(id,source_language,target_language,status,created_at,updated_at,status_updated_at) VALUES('project','ja','pt-BR','QUEUED',1,1,1)",
            );
            sql.exec(
                "INSERT INTO translation_pages(id,project_id,position,original_filename,original_byte_size,original_mime_type,width_px,height_px,media_validated_at,media_validation_policy_version,status,created_at,updated_at,status_updated_at) VALUES('page','project',0,'private-original',10,'image/png',32,16,1,1,'QUEUED',1,1,1)",
            );
            await attempts.createOrGetActive({
                id: 'old',
                pageId: 'page',
                idempotencyKey: 'old-key',
                gatewayKey: 'gateway',
                gatewayContractVersion: '1.0',
                createdAt: 2,
            });
            if (status !== 'CREATED')
                sql.prepare(
                    "UPDATE remote_processing_attempts SET status=?,remote_status='QUEUED',remote_job_ref='old-operation',accepted_at=2 WHERE id='old'",
                ).run(status);
            await attempts.failVolatileAttempt('old', 3, 'submission-unknown');
            expect(sql.prepare('SELECT status FROM translation_projects').get()).toMatchObject({ status: 'QUEUED' });
            expect(sql.prepare('SELECT original_filename,status FROM translation_pages').get()).toMatchObject({
                original_filename: 'private-original',
                status: 'FAILED',
            });
            expect(await attempts.getById('old')).toMatchObject({ status: 'FAILED', gatewayContractVersion: '1.0', idempotencyKey: 'old-key' });
            await attempts.createOrGetActive({
                id: 'fresh',
                pageId: 'page',
                idempotencyKey: 'fresh-key',
                gatewayKey: 'gateway',
                gatewayContractVersion: '2.0',
                createdAt: 4,
            });
            await attempts.acceptDirectResponse('fresh', 'project', 'page', 'fresh-operation', 5);
            expect(sql.prepare('SELECT status FROM translation_projects').get()).toMatchObject({ status: 'PROCESSING' });
            expect(sql.prepare('SELECT status FROM translation_pages').get()).toMatchObject({ status: 'PROCESSING' });
            expect(sql.prepare('SELECT count(*) AS total FROM remote_processing_attempts').get()).toMatchObject({ total: 2 });
            expect(sql.prepare("SELECT count(*) AS total FROM remote_processing_attempts WHERE status='ACCEPTED'").get()).toMatchObject({ total: 1 });
        } finally {
            sql.close();
        }
    },
);
it.each(['STARTED', 'FINISHED', 'FAILED'] as const)('persists the known %s receipt without claiming local READY', async status => {
    const { sql, db } = database();
    try {
        const projects = createSqliteTranslationProjectRepository(async () => db);
        const attempts = createSqliteRemoteProcessingAttemptRepository(async () => db, projects);
        await attempts.initialize();
        sql.exec(
            "INSERT INTO translation_projects(id,source_language,target_language,status,created_at,updated_at,status_updated_at) VALUES('project','ja','pt-BR','DRAFT',1,1,1)",
        );
        sql.exec(
            "INSERT INTO translation_pages(id,project_id,position,original_filename,original_byte_size,original_mime_type,width_px,height_px,media_validated_at,media_validation_policy_version,status,created_at,updated_at,status_updated_at) VALUES('page','project',0,'original',10,'image/png',32,16,1,1,'DRAFT',1,1,1)",
        );
        await attempts.createOrGetActive({
            id: 'attempt',
            pageId: 'page',
            idempotencyKey: 'key',
            gatewayKey: 'gateway',
            gatewayContractVersion: '2.0',
            createdAt: 2,
        });
        await attempts.markSubmitting('attempt', 3);
        const observed = await attempts.observeVolatileReceipt('attempt', { operationRef: 'operation', status }, 4);
        expect(observed).toMatchObject({ remoteJobRef: 'operation', volatileReceiptStatus: status, status: status === 'STARTED' ? 'UNKNOWN' : 'FAILED' });
        expect(await attempts.getById('attempt')).toMatchObject({ volatileReceiptStatus: status });
        expect(sql.prepare('SELECT status,original_filename FROM translation_pages').get()).toMatchObject({
            status: status === 'STARTED' ? 'DRAFT' : 'FAILED',
            original_filename: 'original',
        });
        expect(sql.prepare('SELECT status FROM translation_projects').get()).toMatchObject({ status: 'DRAFT' });
        await expect(attempts.observeVolatileReceipt('attempt', { operationRef: 'another-operation', status }, 5)).rejects.toThrow();
        expect(await attempts.getById('attempt')).toMatchObject({ remoteJobRef: 'operation', volatileReceiptStatus: status });
        if (status === 'STARTED') {
            await attempts.observeVolatileReceipt('attempt', null, 6);
            expect(await attempts.getById('attempt')).toMatchObject({ status: 'UNKNOWN', remoteJobRef: 'operation', volatileReceiptStatus: null });
            await attempts.observeVolatileReceipt('attempt', { operationRef: 'operation', status: 'FINISHED' }, 7);
            await expect(attempts.observeVolatileReceipt('attempt', { operationRef: 'operation', status: 'STARTED' }, 8)).rejects.toThrow();
        } else {
            await attempts.observeVolatileReceipt('attempt', null, 6);
            expect(await attempts.getById('attempt')).toMatchObject({ volatileReceiptStatus: status });
            await expect(
                attempts.observeVolatileReceipt('attempt', { operationRef: 'operation', status: status === 'FAILED' ? 'FINISHED' : 'FAILED' }, 7),
            ).rejects.toThrow();
        }
    } finally {
        sql.close();
    }
});

it.each([7, 42])('upgrades old attempt tables at global version %s additively without destroying history or downgrading', async version => {
    const { sql, db } = database();
    try {
        const projects = createSqliteTranslationProjectRepository(async () => db);
        await projects.initialize();
        const oldSchema = CREATE_REMOTE_PROCESSING_SCHEMA.replace(/\s+volatile_receipt_status TEXT CHECK[\s\S]*?\n\s*error_code TEXT/, '\n    error_code TEXT');
        expect(oldSchema).not.toContain('volatile_receipt_status');
        sql.exec(oldSchema);
        sql.exec(
            "INSERT INTO translation_projects(id,source_language,target_language,status,created_at,updated_at,status_updated_at) VALUES('project','ja','pt-BR','QUEUED',1,1,1)",
        );
        sql.exec(
            "INSERT INTO translation_pages(id,project_id,position,original_filename,original_byte_size,original_mime_type,width_px,height_px,media_validated_at,media_validation_policy_version,status,created_at,updated_at,status_updated_at) VALUES('page','project',0,'private-original',10,'image/png',32,16,1,1,'QUEUED',1,1,1)",
        );
        sql.exec(
            "INSERT INTO remote_processing_attempts(id,page_id,attempt_number,idempotency_key,gateway_key,gateway_contract_version,status,remote_status,remote_job_ref,created_at,updated_at,accepted_at) VALUES('old','page',1,'old-key','gateway','1.0','ACCEPTED','QUEUED','legacy-operation',2,2,2)",
        );
        sql.exec(`PRAGMA user_version=${version}`);
        const attempts = createSqliteRemoteProcessingAttemptRepository(async () => db, projects);
        await attempts.initialize();
        expect(sql.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: Math.max(version, 10) });
        expect(await attempts.getById('old')).toMatchObject({
            idempotencyKey: 'old-key',
            gatewayContractVersion: '1.0',
            status: 'ACCEPTED',
            remoteJobRef: 'legacy-operation',
            volatileReceiptStatus: null,
        });
        expect(sql.prepare('SELECT original_filename,status FROM translation_pages').get()).toMatchObject({
            original_filename: 'private-original',
            status: 'QUEUED',
        });
        expect(() => sql.exec("UPDATE remote_processing_attempts SET volatile_receipt_status='FINISHED' WHERE id='old'")).toThrow();
        await createSqliteRemoteProcessingAttemptRepository(async () => db, projects).initialize();
        expect(sql.prepare('SELECT count(*) AS total FROM remote_processing_attempts').get()).toMatchObject({ total: 1 });
        expect(sql.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    } finally {
        sql.close();
    }
});
it('rolls back receipt, operation binding and local failure together if the page update fails', async () => {
    const { sql, db } = database();
    try {
        const projects = createSqliteTranslationProjectRepository(async () => db);
        const attempts = createSqliteRemoteProcessingAttemptRepository(async () => db, projects);
        await attempts.initialize();
        sql.exec(
            "INSERT INTO translation_projects(id,source_language,target_language,status,created_at,updated_at,status_updated_at) VALUES('project','ja','pt-BR','DRAFT',1,1,1)",
        );
        sql.exec(
            "INSERT INTO translation_pages(id,project_id,position,original_filename,original_byte_size,original_mime_type,width_px,height_px,media_validated_at,media_validation_policy_version,status,created_at,updated_at,status_updated_at) VALUES('page','project',0,'original',10,'image/png',32,16,1,1,'DRAFT',1,1,1)",
        );
        await attempts.createOrGetActive({
            id: 'attempt',
            pageId: 'page',
            idempotencyKey: 'key',
            gatewayKey: 'gateway',
            gatewayContractVersion: '2.0',
            createdAt: 2,
        });
        await attempts.markSubmitting('attempt', 3);
        const run = db.runAsync;
        db.runAsync = async (query, params) => {
            if (query.includes('UPDATE translation_pages')) throw new Error('synthetic disk failure');
            return run(query, params);
        };
        await expect(attempts.observeVolatileReceipt('attempt', { operationRef: 'operation', status: 'FINISHED' }, 4)).rejects.toThrow();
        expect(await attempts.getById('attempt')).toMatchObject({ status: 'SUBMITTING', remoteJobRef: null, volatileReceiptStatus: null });
        expect(sql.prepare('SELECT status FROM translation_pages').get()).toMatchObject({ status: 'DRAFT' });
    } finally {
        sql.close();
    }
});

it('returns the latest attempt of many pages in one batch, leaving pages without attempts out (revisão 2026-11-13)', async () => {
    const { sql, db } = database();
    try {
        const projects = createSqliteTranslationProjectRepository(async () => db);
        const attempts = createSqliteRemoteProcessingAttemptRepository(async () => db, projects);
        await attempts.initialize();
        sql.exec(
            "INSERT INTO translation_projects(id,source_language,target_language,status,created_at,updated_at,status_updated_at) VALUES('project','ja','pt-BR','PROCESSING',1,1,1)",
        );
        sql.exec(
            "INSERT INTO translation_pages(id,project_id,position,original_filename,original_byte_size,original_mime_type,width_px,height_px,media_validated_at,media_validation_policy_version,status,created_at,updated_at,status_updated_at) VALUES('first','project',0,'first',10,'image/png',32,16,1,1,'DRAFT',1,1,1),('second','project',1,'second',10,'image/png',32,16,1,1,'DRAFT',1,1,1),('third','project',2,'third',10,'image/png',32,16,1,1,'DRAFT',1,1,1)",
        );
        const create = (id: string, pageId: string) =>
            attempts.createOrGetActive({ id, pageId, idempotencyKey: `${id}-key`, gatewayKey: 'gateway', gatewayContractVersion: '2.0', createdAt: 2 });
        const firstTry = await create('second-1', 'second');
        await attempts.failVolatileAttempt(firstTry.id, 3, 'submission-unknown');
        await create('second-2', 'second');
        await create('third-1', 'third');

        const latest = await attempts.listLatestByPages(['first', 'second', 'third', 'second']);

        expect([...latest.keys()].sort()).toEqual(['second', 'third']);
        expect(latest.get('second')?.id).toBe('second-2');
        expect(latest.get('third')?.id).toBe('third-1');
        for (const pageId of ['first', 'second', 'third']) expect(latest.get(pageId) ?? null).toEqual(await attempts.getLatestByPage(pageId));
        expect((await attempts.listLatestByPages([])).size).toBe(0);
    } finally {
        sql.close();
    }
});
