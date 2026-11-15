import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { AppDatabase } from '@/shared/storage';

import { createChapterBatchQueueRepository } from '../chapterBatchQueueRepository';

function setup() {
    const sql = new DatabaseSync(':memory:');
    sql.exec(
        "PRAGMA foreign_keys=ON; CREATE TABLE translation_projects(id TEXT PRIMARY KEY); CREATE TABLE translation_pages(id TEXT PRIMARY KEY,project_id TEXT NOT NULL REFERENCES translation_projects(id)); INSERT INTO translation_projects VALUES('p'),('other'); INSERT INTO translation_pages VALUES('a','p'),('b','p'),('x','other');",
    );
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
    const queue = createChapterBatchQueueRepository(async () => db, { initialize: async () => undefined });
    return { sql, queue };
}

it('persists ordered selected pages and pauses an interrupted page without resending', async () => {
    const { sql, queue } = setup();
    try {
        await queue.create('run', 'p', ['b', 'a'], 1);
        expect(await queue.stopRequested('run')).toBe(false);
        await queue.requestStop('run');
        expect(await queue.stopRequested('run')).toBe(true);
        await queue.setItem('run', 'b', 'processing');
        await queue.pauseInterrupted(2);
        expect(await queue.getOpen()).toEqual({
            id: 'run',
            projectId: 'p',
            state: 'paused',
            items: [
                { pageId: 'b', position: 0, state: 'unknown' },
                { pageId: 'a', position: 1, state: 'pending' },
            ],
        });
        expect(sql.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 11 });
    } finally {
        sql.close();
    }
});

it('rejects mixed projects, duplicate pages and concurrent open batches atomically', async () => {
    const { sql, queue } = setup();
    try {
        await expect(queue.create('invalid', 'p', ['a', 'x'], 1)).rejects.toThrow('batch.invalidSelection');
        expect(await queue.getOpen()).toBeNull();
        await expect(queue.create('duplicate', 'p', ['a', 'a'], 1)).rejects.toThrow('batch.invalidSelection');
        await queue.create('first', 'p', ['a'], 1);
        await expect(queue.create('second', 'p', ['b'], 2)).rejects.toThrow();
        expect((await queue.getOpen())?.id).toBe('first');
        await queue.setRun('first', 'paused', 3);
        await expect(queue.setItem('first', 'a', 'processing')).rejects.toThrow('batch.notActive');
    } finally {
        sql.close();
    }
});

it('does not complete a batch until every selected page is saved', async () => {
    const { sql, queue } = setup();
    try {
        await queue.create('run', 'p', ['a'], 1);
        await expect(queue.setRun('run', 'completed', 2)).rejects.toThrow('Invalid batch run transition');
        await queue.setItem('run', 'a', 'processing');
        await queue.setItem('run', 'a', 'saved');
        await queue.setRun('run', 'completed', 3);
        expect(await queue.getOpen()).toBeNull();
    } finally {
        sql.close();
    }
});
