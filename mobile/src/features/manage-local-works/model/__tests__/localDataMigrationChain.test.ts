import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import { createSqliteLocalMediaImportRepository } from '@/entities/local-media-import';
import { createSqliteLocalTranslationResultRepository } from '@/entities/local-translation-result';
import { createSqliteLocalWorkRepository } from '@/entities/local-work';
import { createSqliteRemoteProcessingAttemptRepository } from '@/entities/remote-processing-attempt';
import { createSqliteTranslationProjectRepository } from '@/entities/translation-project';
import type { AppDatabase, SqlExecutor } from '@/shared/storage';

function sqliteDatabase() {
    const sqlite = new DatabaseSync(':memory:');
    const bindings = (params: unknown): SQLInputValue[] => {
        if (params === undefined) return [];
        if (!Array.isArray(params)) throw new Error('test requires positional bindings');
        return params as SQLInputValue[];
    };
    const executor: SqlExecutor = {
        execAsync: async source => {
            sqlite.exec(source);
        },
        runAsync: async (source, params) => sqlite.prepare(source).run(...bindings(params)),
        getFirstAsync: async <T>(source: string, params?: unknown) => (sqlite.prepare(source).get(...bindings(params)) as T | undefined) ?? null,
        getAllAsync: async <T>(source: string, params?: unknown) => sqlite.prepare(source).all(...bindings(params)) as T[],
    };
    const database: AppDatabase = {
        ...executor,
        async withExclusiveTransactionAsync(task) {
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
    sqlite.exec('PRAGMA foreign_keys = ON;');
    return { sqlite, open: async () => database };
}

function repositories(open: () => Promise<AppDatabase>) {
    const projects = createSqliteTranslationProjectRepository(open);
    const imports = createSqliteLocalMediaImportRepository(open);
    const attempts = createSqliteRemoteProcessingAttemptRepository(open, projects);
    const results = createSqliteLocalTranslationResultRepository(open, projects, attempts);
    const works = createSqliteLocalWorkRepository(open, results);
    return { projects, imports, attempts, results, works };
}

const page = (id: string, position: number) => ({
    id,
    projectId: 'legacy-project',
    position,
    originalFilename: `${id}.jpg`,
    originalByteSize: 42,
    originalMimeType: 'image/jpeg' as const,
    widthPx: 800,
    heightPx: 1200,
    mediaValidatedAt: 19,
    mediaValidationPolicyVersion: 1,
    status: 'DRAFT' as const,
    createdAt: 20,
    updatedAt: 20,
    statusUpdatedAt: 20,
});

describe('MOB-FEAT-055/AC-001 cadeia completa de migrações locais', () => {
    it('leva um banco da versão de projetos até obras sem perder projetos, páginas nem integridade', async () => {
        const { sqlite, open } = sqliteDatabase();
        try {
            const legacy = repositories(open);
            await legacy.projects.initialize();
            await legacy.imports.initialize();
            await legacy.projects.create({
                id: 'legacy-project',
                sourceLanguage: 'ja',
                targetLanguage: 'pt-BR',
                status: 'DRAFT',
                createdAt: 20,
                updatedAt: 20,
                statusUpdatedAt: 20,
                pages: [page('page-a', 0), page('page-b', 1)],
            });
            expect(sqlite.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 6 });

            await legacy.attempts.initialize();
            await legacy.results.initialize();
            await legacy.works.initialize();
            expect(sqlite.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 11 });
            expect(sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([]);

            const reopened = repositories(open);
            await reopened.works.initialize();
            const project = await reopened.projects.getById('legacy-project');
            expect(project?.pages.map(item => item.id)).toEqual(['page-a', 'page-b']);
            expect(await reopened.works.listUnassignedProjectIds()).toEqual(['legacy-project']);

            await reopened.works.create({ id: 'work-1', name: 'Obra', coverFilename: null, createdAt: 30, updatedAt: 30 });
            await reopened.works.attachChapter({ projectId: 'legacy-project', workId: 'work-1', label: '1', createdAt: 31, updatedAt: 31 }, 30);
            expect(await reopened.works.listUnassignedProjectIds()).toEqual([]);
            expect((await reopened.projects.getById('legacy-project'))?.pages).toHaveLength(2);
            expect(sqlite.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 11 });
            expect(sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
        } finally {
            sqlite.close();
        }
    });

    it('reabrir um banco já migrado é idempotente e não rebaixa a versão', async () => {
        const { sqlite, open } = sqliteDatabase();
        try {
            await repositories(open).works.initialize();
            const schema = sqlite.prepare("SELECT name, sql FROM sqlite_master WHERE type IN ('table','index','trigger') ORDER BY name").all();
            await repositories(open).works.initialize();
            await repositories(open).projects.initialize();
            expect(sqlite.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 11 });
            expect(sqlite.prepare("SELECT name, sql FROM sqlite_master WHERE type IN ('table','index','trigger') ORDER BY name").all()).toEqual(schema);
        } finally {
            sqlite.close();
        }
    });
});
