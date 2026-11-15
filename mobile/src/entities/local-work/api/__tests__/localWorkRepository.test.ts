import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { AppDatabase } from '@/shared/storage';

import { createSqliteLocalWorkRepository } from '../localWorkRepository';

function fixture() {
    const sqlite = new DatabaseSync(':memory:');
    sqlite.exec(`PRAGMA foreign_keys = ON;
        CREATE TABLE translation_projects (id TEXT PRIMARY KEY NOT NULL);
        CREATE TABLE translation_pages (id TEXT PRIMARY KEY NOT NULL, project_id TEXT NOT NULL REFERENCES translation_projects(id) ON DELETE CASCADE, status TEXT NOT NULL DEFAULT 'DRAFT');
        CREATE TABLE remote_processing_attempts (id TEXT PRIMARY KEY NOT NULL, page_id TEXT NOT NULL REFERENCES translation_pages(id) ON DELETE CASCADE, status TEXT NOT NULL);
        INSERT INTO translation_projects VALUES ('legacy'), ('chapter-a'), ('chapter-b');
        INSERT INTO translation_pages(id, project_id) VALUES ('original-page', 'legacy');
        PRAGMA user_version = 10;`);
    const db: AppDatabase = {
        execAsync: async sql => {
            sqlite.exec(sql);
        },
        runAsync: async (sql, params = []) => sqlite.prepare(sql).run(...(params as SQLInputValue[])),
        getFirstAsync: async <T>(sql: string, params = []) => (sqlite.prepare(sql).get(...(params as SQLInputValue[])) ?? null) as T | null,
        getAllAsync: async <T>(sql: string, params = []) => sqlite.prepare(sql).all(...(params as SQLInputValue[])) as T[],
        async withExclusiveTransactionAsync(task) {
            sqlite.exec('BEGIN IMMEDIATE');
            try {
                await task(db);
                sqlite.exec('COMMIT');
            } catch (error) {
                sqlite.exec('ROLLBACK');
                throw error;
            }
        },
    };
    const repository = createSqliteLocalWorkRepository(async () => db, { initialize: async () => undefined });
    return { sqlite, repository };
}

it('adds works and chapter links without changing legacy projects or pages', async () => {
    const { sqlite, repository } = fixture();
    try {
        await repository.initialize();
        await repository.create({ id: 'work-a', name: 'A', coverFilename: null, createdAt: 1, updatedAt: 1 });
        await repository.attachChapter({ projectId: 'chapter-a', workId: 'work-a', label: '10', createdAt: 2, updatedAt: 2 }, 1);
        await expect(repository.attachChapter({ projectId: 'chapter-b', workId: 'work-a', label: '2', createdAt: 3, updatedAt: 3 }, 1)).rejects.toThrow(
            'localWork.notFoundOrStale',
        );
        await repository.attachChapter({ projectId: 'chapter-b', workId: 'work-a', label: '2', createdAt: 3, updatedAt: 3 }, 2);
        expect((await repository.listChapters('work-a')).map(chapter => chapter.label)).toEqual(['2', '10']);
        expect(await repository.listUnassignedProjectIds()).toEqual(['legacy']);
        expect(sqlite.prepare('SELECT id FROM translation_projects ORDER BY id').all()).toHaveLength(3);
        expect(sqlite.prepare('SELECT id FROM translation_pages WHERE project_id = ?').get('legacy')).toEqual({ id: 'original-page' });
        expect(sqlite.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 11 });
        expect(sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    } finally {
        sqlite.close();
    }
});

it('rejects invalid references, duplicate links and uncoordinated deletion', async () => {
    const { sqlite, repository } = fixture();
    try {
        await repository.initialize();
        await repository.create({ id: 'work-a', name: 'A', coverFilename: null, createdAt: 1, updatedAt: 1 });
        await expect(repository.create({ id: 'work-b', name: '   ', coverFilename: null, createdAt: 1, updatedAt: 1 })).rejects.toThrow();
        await expect(repository.attachChapter({ projectId: 'missing', workId: 'work-a', label: '1', createdAt: 2, updatedAt: 2 }, 1)).rejects.toThrow();
        await repository.attachChapter({ projectId: 'chapter-a', workId: 'work-a', label: '1', createdAt: 2, updatedAt: 2 }, 1);
        await expect(repository.attachChapter({ projectId: 'chapter-a', workId: 'work-a', label: '2', createdAt: 3, updatedAt: 3 }, 2)).rejects.toThrow();
        await expect(repository.deleteEmpty('work-a')).rejects.toThrow();
        expect(sqlite.prepare('SELECT id FROM translation_projects WHERE id = ?').get('chapter-a')).toEqual({ id: 'chapter-a' });
        sqlite.prepare('DELETE FROM translation_projects WHERE id = ?').run('chapter-a');
        expect(await repository.listChapters('work-a')).toEqual([]);
        await repository.deleteEmpty('work-a');
        expect(await repository.get('work-a')).toBeNull();
    } finally {
        sqlite.close();
    }
});

it('rolls back an invalid migration and permits retry after the data is repaired', async () => {
    const { sqlite, repository } = fixture();
    try {
        sqlite.exec("PRAGMA foreign_keys = OFF; INSERT INTO translation_pages(id, project_id) VALUES ('orphan', 'missing'); PRAGMA foreign_keys = ON;");
        await expect(repository.initialize()).rejects.toThrow('localWork.foreignKeyViolation');
        expect(sqlite.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 10 });
        expect(sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='local_works'").get()).toBeUndefined();
        sqlite.exec("DELETE FROM translation_pages WHERE id = 'orphan'");
        await repository.initialize();
        expect(sqlite.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 11 });
        expect(sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    } finally {
        sqlite.close();
    }
});

it('atomically removes only linked projects and refuses active or ambiguous attempts', async () => {
    const { sqlite, repository } = fixture();
    try {
        await repository.create({ id: 'work-a', name: 'A', coverFilename: null, createdAt: 1, updatedAt: 1 });
        await repository.attachChapter({ projectId: 'legacy', workId: 'work-a', label: '1', createdAt: 2, updatedAt: 2 }, 1);
        await expect(repository.deleteWithProjects('work-a', 1)).rejects.toThrow('localWork.notFoundOrStale');
        sqlite.exec("INSERT INTO remote_processing_attempts VALUES ('attempt', 'original-page', 'UNKNOWN');");
        await expect(repository.deleteWithProjects('work-a', 2)).rejects.toThrow('localWork.processingActive');
        expect(await repository.get('work-a')).not.toBeNull();
        expect(sqlite.prepare('SELECT id FROM translation_pages WHERE id = ?').get('original-page')).toEqual({ id: 'original-page' });
        sqlite.exec("UPDATE remote_processing_attempts SET status = 'FAILED' WHERE id = 'attempt';");
        expect(await repository.deleteWithProjects('work-a', 2)).toEqual(['legacy']);
        expect(await repository.get('work-a')).toBeNull();
        expect(sqlite.prepare('SELECT id FROM translation_projects ORDER BY id').all()).toHaveLength(2);
        expect(sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    } finally {
        sqlite.close();
    }
});

it('deletes one quiescent chapter without affecting its siblings', async () => {
    const { sqlite, repository } = fixture();
    try {
        await repository.create({ id: 'work-a', name: 'A', coverFilename: null, createdAt: 1, updatedAt: 1 });
        await repository.attachChapter({ projectId: 'legacy', workId: 'work-a', label: '1', createdAt: 2, updatedAt: 2 }, 1);
        await repository.attachChapter({ projectId: 'chapter-a', workId: 'work-a', label: '2', createdAt: 3, updatedAt: 3 }, 2);
        sqlite.exec("INSERT INTO remote_processing_attempts VALUES ('attempt', 'original-page', 'SUBMITTING');");
        await expect(repository.deleteChapter('work-a', 'legacy', 3, 4)).rejects.toThrow('localWork.processingActive');
        expect((await repository.listChapters('work-a')).map(chapter => chapter.projectId)).toEqual(['legacy', 'chapter-a']);
        sqlite.exec(
            "UPDATE remote_processing_attempts SET status = 'ACCEPTED' WHERE id = 'attempt'; UPDATE translation_pages SET status = 'READY' WHERE id = 'original-page';",
        );
        await repository.deleteChapter('work-a', 'legacy', 3, 4);
        expect((await repository.listChapters('work-a')).map(chapter => chapter.projectId)).toEqual(['chapter-a']);
        expect(await repository.get('work-a')).toMatchObject({ updatedAt: 4 });
        expect(sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    } finally {
        sqlite.close();
    }
});

it('updates names and labels without touching linked pages and rejects stale edits', async () => {
    const { sqlite, repository } = fixture();
    try {
        await repository.create({ id: 'work-a', name: 'Work', coverFilename: null, createdAt: 1, updatedAt: 1 });
        await repository.attachChapter({ projectId: 'legacy', workId: 'work-a', label: '1', createdAt: 2, updatedAt: 2 }, 1);
        await repository.rename('work-a', ' Renamed ', 2, 3);
        await repository.renameChapter('legacy', ' Chapter 2 ', 2, 3, 4);
        expect(await repository.get('work-a')).toMatchObject({ name: 'Renamed', updatedAt: 4 });
        expect(await repository.listChapters('work-a')).toMatchObject([{ label: 'Chapter 2', updatedAt: 4 }]);
        await expect(repository.rename('work-a', 'Stale', 1, 5)).rejects.toThrow('localWork.notFoundOrStale');
        await expect(repository.renameChapter('legacy', 'Stale', 2, 4, 5)).rejects.toThrow('localWork.notFoundOrStale');
        await expect(repository.renameChapter('legacy', 'Stale parent', 4, 3, 5)).rejects.toThrow('localWork.notFoundOrStale');
        await repository.setCoverFilename('work-a', 'cover_1', 4, 5);
        await expect(repository.setCoverFilename('work-a', '../unsafe', 5, 6)).rejects.toThrow('localWork.invalidWork');
        await expect(repository.setCoverFilename('work-a', null, 3, 6)).rejects.toThrow('localWork.notFoundOrStale');
        expect(await repository.get('work-a')).toMatchObject({ coverFilename: 'cover_1', updatedAt: 5 });
        await repository.setCoverFilename('work-a', null, 5, 6);
        expect(await repository.get('work-a')).toMatchObject({ coverFilename: null });
        expect(sqlite.prepare('SELECT id FROM translation_pages WHERE project_id = ?').get('legacy')).toEqual({ id: 'original-page' });
    } finally {
        sqlite.close();
    }
});

it('clears only work metadata while preserving projects and pages', async () => {
    const { sqlite, repository } = fixture();
    try {
        await repository.create({ id: 'work-a', name: 'Work', coverFilename: null, createdAt: 1, updatedAt: 1 });
        await repository.attachChapter({ projectId: 'legacy', workId: 'work-a', label: '1', createdAt: 2, updatedAt: 2 }, 1);
        expect(await repository.measureMetadataBytes()).toBeGreaterThan(0);
        await repository.clearMetadata();
        expect(await repository.list()).toEqual([]);
        expect(sqlite.prepare('SELECT id FROM translation_pages WHERE project_id = ?').get('legacy')).toEqual({ id: 'original-page' });
        expect(sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    } finally {
        sqlite.close();
    }
});

it('moves a chapter to another work or out of any work and keeps the translation project (2026-11-10)', async () => {
    const { sqlite, repository } = fixture();
    try {
        await repository.create({ id: 'work-a', name: 'A', coverFilename: null, createdAt: 1, updatedAt: 1 });
        await repository.create({ id: 'work-b', name: 'B', coverFilename: null, createdAt: 1, updatedAt: 1 });
        await repository.attachChapter({ projectId: 'chapter-a', workId: 'work-a', label: '1', createdAt: 2, updatedAt: 2 }, 1);
        await expect(repository.moveChapter('chapter-a', 'work-a', 'work-b', '7', 99, 100)).rejects.toThrow('localWork.notFoundOrStale');

        await repository.moveChapter('chapter-a', 'work-a', 'work-b', '7', 2, 5);
        expect(await repository.listChapters('work-a')).toEqual([]);
        expect(await repository.listChapters('work-b')).toEqual([expect.objectContaining({ projectId: 'chapter-a', label: '7', updatedAt: 5 })]);

        await repository.moveChapter('chapter-a', 'work-b', null, '', (await repository.get('work-b'))!.updatedAt, 10);
        expect(await repository.listChapters('work-b')).toEqual([]);
        expect(await repository.listUnassignedProjectIds()).toContain('chapter-a');
        expect(sqlite.prepare('SELECT id FROM translation_projects WHERE id = ?').get('chapter-a')).toEqual({ id: 'chapter-a' });
    } finally {
        sqlite.close();
    }
});
