import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import type { AppDatabase, SqlExecutor } from '@/shared/storage';

import { createSqliteLocalTranslationResultRepository } from '../localTranslationResultRepository';

const PARENTS = `
PRAGMA foreign_keys = ON;
CREATE TABLE translation_projects (id TEXT PRIMARY KEY);
CREATE TABLE translation_pages (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL, position INTEGER NOT NULL,
    UNIQUE (project_id, position),
    FOREIGN KEY (project_id) REFERENCES translation_projects(id) ON DELETE CASCADE
);
CREATE TABLE remote_processing_attempts (id TEXT PRIMARY KEY);
INSERT INTO translation_projects VALUES ('project-1');
INSERT INTO translation_pages VALUES ('page-1', 'project-1', 0);
`;

// Frozen v8 fixture: no translation metadata columns or triggers.
const LEGACY_V8 = `
CREATE TABLE translation_page_results (
    page_id TEXT PRIMARY KEY, attempt_id TEXT UNIQUE, source_kind TEXT NOT NULL,
    rendered_filename TEXT UNIQUE NOT NULL, mime_type TEXT NOT NULL, byte_size INTEGER NOT NULL,
    width_px INTEGER NOT NULL, height_px INTEGER NOT NULL, sha256 TEXT NOT NULL,
    ready_at INTEGER NOT NULL, auto_opened_at INTEGER,
    FOREIGN KEY (page_id) REFERENCES translation_pages(id) ON DELETE CASCADE,
    FOREIGN KEY (attempt_id) REFERENCES remote_processing_attempts(id) ON DELETE CASCADE
);
CREATE TABLE text_regions (
    id TEXT PRIMARY KEY, page_id TEXT NOT NULL, reading_order INTEGER NOT NULL,
    source_text TEXT NOT NULL, translated_text TEXT NOT NULL, overflow INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL, UNIQUE (page_id, reading_order),
    FOREIGN KEY (page_id) REFERENCES translation_page_results(page_id) ON DELETE CASCADE
);
CREATE TABLE text_region_vertices (
    region_id TEXT NOT NULL, vertex_index INTEGER NOT NULL, x REAL NOT NULL, y REAL NOT NULL,
    PRIMARY KEY (region_id, vertex_index),
    FOREIGN KEY (region_id) REFERENCES text_regions(id) ON DELETE CASCADE
);
PRAGMA user_version = 8;
`;

function fixture(legacy = true, failMigration = false) {
    const sqlite = new DatabaseSync(':memory:');
    sqlite.exec(PARENTS);
    if (legacy) {
        sqlite.exec(LEGACY_V8);
        sqlite
            .prepare('INSERT INTO translation_page_results VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, NULL)')
            .run('page-1', 'DEMO', 'demo.jpg', 'image/jpeg', 12, 100, 200, 'a'.repeat(64), 20);
        sqlite
            .prepare('INSERT INTO text_regions VALUES (?, ?, ?, ?, ?, ?, ?)')
            .run('region-1', 'page-1', 0, '繁體 简体\n日本語 😀 <b>fonte</b>', 'Português\n<b>texto</b>', 0, 20);
        sqlite.exec("INSERT INTO text_region_vertices VALUES ('region-1', 0, 0.1, 0.2);");
    }

    const bindings = (params: unknown): SQLInputValue[] => {
        if (params === undefined) return [];
        if (!Array.isArray(params)) throw new Error('test requires positional bindings');
        return params as SQLInputValue[];
    };
    const executor: SqlExecutor = {
        execAsync: async source => {
            if (failMigration && source.includes('CREATE TRIGGER')) throw new Error('injected migration failure');
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
    const repository = createSqliteLocalTranslationResultRepository(
        async () => database,
        { initialize: async () => undefined, listAll: async () => [] },
        { initialize: async () => undefined },
    );
    return { sqlite, database, repository };
}

describe('MOB-FEAT-019/AC-003/004 SQLite v8 → v9', () => {
    it('preserves legacy text, variants, order and vertices and reads metadata after reinitialization', async () => {
        const { sqlite, database, repository } = fixture();
        try {
            await repository.initialize();
            const result = await repository.getByPage('page-1');
            expect(result?.regions[0]).toMatchObject({
                id: 'region-1',
                readingOrder: 0,
                translationMetadata: null,
                sourceText: '繁體 简体\n日本語 😀 <b>fonte</b>',
                translatedText: 'Português\n<b>texto</b>',
                vertices: [{ index: 0, x: 0.1, y: 0.2 }],
            });
            sqlite.exec("UPDATE text_regions SET translation_contract_version = '1.0', translation_model = 'general/translation-llm', translated_at = 30;");
            const reopened = createSqliteLocalTranslationResultRepository(
                async () => database,
                { initialize: async () => undefined, listAll: async () => [] },
                { initialize: async () => undefined },
            );
            expect((await reopened.getByPage('page-1'))?.regions[0]?.translationMetadata).toEqual({
                contractVersion: '1.0',
                model: 'general/translation-llm',
                translatedAt: 30,
            });
            const withProviderMetadata = await reopened.getByPage('page-1');
            expect(withProviderMetadata).not.toBeNull();
            await expect(reopened.saveDemoResults('project-1', [withProviderMetadata!], 30)).rejects.toThrow('localTranslation.invalidDemoResult');
            expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(9);
            expect(sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
            await reopened.removeProject('project-1');
            expect(sqlite.prepare('SELECT * FROM text_regions').all()).toEqual([]);
            expect(sqlite.prepare('SELECT * FROM text_region_vertices').all()).toEqual([]);
        } finally {
            sqlite.close();
        }
    });

    it.each([true, false])('rejects incomplete metadata and invalid timestamps in legacy=%s schema', async legacy => {
        const { sqlite, repository } = fixture(legacy);
        try {
            await repository.initialize();
            if (!legacy) {
                sqlite
                    .prepare('INSERT INTO translation_page_results VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, NULL)')
                    .run('page-1', 'DEMO', 'demo.jpg', 'image/jpeg', 12, 100, 200, 'a'.repeat(64), 20);
                sqlite.exec(
                    "INSERT INTO text_regions (id, page_id, reading_order, source_text, translated_text, created_at) VALUES ('region-1', 'page-1', 0, 'source', 'target', 20);",
                );
            }
            expect(() => sqlite.exec("UPDATE text_regions SET translation_model = 'general/translation-llm';")).toThrow();
            expect(() =>
                sqlite.exec(
                    "INSERT INTO text_regions (id, page_id, reading_order, source_text, translated_text, created_at, translated_at) VALUES ('region-2', 'page-1', 1, 's', 't', 20, 30);",
                ),
            ).toThrow();
            expect(() =>
                sqlite.exec("UPDATE text_regions SET translation_contract_version = '1.0', translation_model = 'general/translation-llm', translated_at = 0;"),
            ).toThrow();
            expect(sqlite.prepare('SELECT translation_model FROM text_regions').get()?.translation_model).toBeNull();
        } finally {
            sqlite.close();
        }
    });

    it('rolls back schema, version and existing data when migration fails', async () => {
        const { sqlite, repository } = fixture(true, true);
        try {
            await expect(repository.initialize()).rejects.toThrow('injected migration failure');
            expect(sqlite.prepare('PRAGMA user_version').get()?.user_version).toBe(8);
            expect(
                sqlite
                    .prepare('PRAGMA table_info(text_regions)')
                    .all()
                    .map(column => column.name),
            ).not.toContain('translation_model');
            expect(sqlite.prepare('SELECT source_text FROM text_regions').get()?.source_text).toBe('繁體 简体\n日本語 😀 <b>fonte</b>');
        } finally {
            sqlite.close();
        }
    });

    it('rejects malformed stored metadata with a sanitized error', async () => {
        const { sqlite, repository } = fixture();
        try {
            await repository.initialize();
            sqlite.exec("UPDATE text_regions SET translation_contract_version = ' ', translation_model = 'private-provider-details', translated_at = 30;");
            await expect(repository.getByPage('page-1')).rejects.toThrow('localTranslation.invalidStoredValue');
        } finally {
            sqlite.close();
        }
    });
});
