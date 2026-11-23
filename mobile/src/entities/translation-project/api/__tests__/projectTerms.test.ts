import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { AppDatabase, SqlExecutor } from '@/shared/storage';

import { createSqliteTranslationProjectRepository, MAX_PROJECT_TERMS } from '../translationProjectRepository';

function fixture() {
    const sqlite = new DatabaseSync(':memory:');
    let version = 11;
    const executor: SqlExecutor = {
        execAsync: async source => {
            const match = source.match(/PRAGMA user_version = (\d+)/);
            if (match) version = Number(match[1]);
            else sqlite.exec(source.replace('PRAGMA journal_mode = WAL;', ''));
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
    return { sqlite, repository: createSqliteTranslationProjectRepository(async () => database), version: () => version };
}

describe('MOB-FEAT-023/AC-003 SQLite v13 project glossary', () => {
    it('creates the glossary on v13 and lists it oldest first, bounded, per project', async () => {
        const f = fixture();
        try {
            await f.repository.initialize();
            expect(f.version()).toBe(13);
            f.sqlite.exec(`INSERT INTO translation_projects (id, source_language, target_language, status, created_at, updated_at, status_updated_at)
                VALUES ('project', 'en', 'pt-BR', 'PROCESSING', 1, 1, 1), ('other', 'en', 'pt-BR', 'DRAFT', 1, 1, 1)`);
            const insert = f.sqlite.prepare('INSERT INTO translation_project_terms VALUES (?, ?, ?, ?)');
            for (let index = 0; index < MAX_PROJECT_TERMS + 5; index++)
                insert.run('project', `Name${String(index).padStart(3, '0')}`, `Nome${index}`, 100 + index);
            insert.run('other', 'Pepper', 'Pepper', 1);
            const terms = await f.repository.listTerms('project');
            expect(terms).toHaveLength(MAX_PROJECT_TERMS);
            expect(terms[0]).toEqual({ source: 'Name000', target: 'Nome0' });
            expect(await f.repository.listTerms('other')).toEqual([{ source: 'Pepper', target: 'Pepper' }]);
            expect(() => insert.run('project', 'two\nlines', 'x', 1)).toThrow();
            expect(() => insert.run('project', ' padded', 'x', 1)).toThrow();
            f.sqlite.exec("DELETE FROM translation_projects WHERE id = 'project'");
            expect(await f.repository.listTerms('project')).toEqual([]);
        } finally {
            f.sqlite.close();
        }
    });
});
