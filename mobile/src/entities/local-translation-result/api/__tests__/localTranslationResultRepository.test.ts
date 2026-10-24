import type { PrivateBatchFiles } from '@/shared/files';
import type { AppDatabase, SqlExecutor } from '@/shared/storage';

import { CREATE_LOCAL_TRANSLATION_SCHEMA, createSqliteLocalTranslationResultRepository } from '../localTranslationResultRepository';

const mockFiles = { clearNamespace: jest.fn(async () => undefined) } as unknown as PrivateBatchFiles;

function databaseFixture(projectPageIds: readonly string[] = [], existingMetadataColumns: readonly string[] = []) {
    const statements: string[] = [];

    let version = 8;
    const metadataColumns = new Set(existingMetadataColumns);

    const executor: SqlExecutor = {
        execAsync: async source => {
            statements.push(source);

            const addedColumn = source.match(/ALTER TABLE text_regions ADD COLUMN (\w+)/);
            if (addedColumn) metadataColumns.add(addedColumn[1]!);

            const match = source.match(/PRAGMA user_version = (\d+)/);

            if (match) version = Number(match[1]);
        },
        runAsync: async source => {
            statements.push(source);

            return {};
        },
        getFirstAsync: async <T>(source: string) => (source === 'PRAGMA user_version' ? ({ user_version: version } as T) : null),
        getAllAsync: async <T>(source: string) =>
            (source === 'PRAGMA table_info(text_regions)'
                ? [...metadataColumns].map(name => ({ name }))
                : source.includes('SELECT id FROM translation_pages WHERE project_id = ?')
                  ? projectPageIds.map(id => ({ id }))
                  : []) as T[],
    };

    const withExclusiveTransactionAsync = jest.fn(async (task: (transaction: SqlExecutor) => Promise<void>) => task(executor));

    const database: AppDatabase = { ...executor, withExclusiveTransactionAsync };

    return { database, statements, version: () => version, withExclusiveTransactionAsync };
}

describe('MOB-FEAT-025/026/027 SQLite results and MOB-FEAT-019 translation metadata', () => {
    it('defines normalized results, regions, vertices and reading progress with cascading integrity', () => {
        expect(CREATE_LOCAL_TRANSLATION_SCHEMA).toContain('REFERENCES translation_pages(id) ON DELETE CASCADE');
        expect(CREATE_LOCAL_TRANSLATION_SCHEMA).toContain('REFERENCES remote_processing_attempts(id) ON DELETE CASCADE');
        expect(CREATE_LOCAL_TRANSLATION_SCHEMA).toContain('UNIQUE (page_id, reading_order)');
        expect(CREATE_LOCAL_TRANSLATION_SCHEMA).toContain('PRIMARY KEY (region_id, vertex_index)');
        expect(CREATE_LOCAL_TRANSLATION_SCHEMA).toContain('FOREIGN KEY (project_id, page_position)');
        expect(CREATE_LOCAL_TRANSLATION_SCHEMA).not.toContain('idx_text_regions_page');
        expect(CREATE_LOCAL_TRANSLATION_SCHEMA).toContain('translation_contract_version TEXT');
        expect(CREATE_LOCAL_TRANSLATION_SCHEMA).toContain('translation_model TEXT');
        expect(CREATE_LOCAL_TRANSLATION_SCHEMA).toContain('translated_at INTEGER');
        expect(CREATE_LOCAL_TRANSLATION_SCHEMA).toContain('chk_text_regions_translation_metadata');
    });

    it('runs after project and remote schemas, adds translation metadata to v8, and advances to v9', async () => {
        const fixture = databaseFixture();

        const projects = { initialize: jest.fn(async () => undefined), listAll: jest.fn(async () => []) };

        const attempts = { initialize: jest.fn(async () => undefined) };

        const repository = createSqliteLocalTranslationResultRepository(async () => fixture.database, projects, attempts);

        await repository.initialize();

        expect(projects.initialize).toHaveBeenCalledTimes(1);
        expect(attempts.initialize).toHaveBeenCalledTimes(1);
        expect(fixture.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
        expect(fixture.statements.some(statement => statement.includes('CREATE TABLE IF NOT EXISTS translation_page_results'))).toBe(true);
        expect(fixture.statements.filter(statement => statement.includes('ALTER TABLE text_regions ADD COLUMN'))).toHaveLength(3);
        expect(fixture.statements.some(statement => statement.includes('CREATE TRIGGER IF NOT EXISTS chk_text_regions_translation_metadata_insert'))).toBe(
            true,
        );
        expect(fixture.version()).toBe(9);
    });

    it('does not repeat ALTER TABLE on a database that already has all v9 columns', async () => {
        const fixture = databaseFixture([], ['translation_contract_version', 'translation_model', 'translated_at']);
        const repository = createSqliteLocalTranslationResultRepository(
            async () => fixture.database,
            { initialize: jest.fn(async () => undefined), listAll: jest.fn(async () => []) },
            { initialize: jest.fn(async () => undefined) },
        );

        await repository.initialize();
        expect(fixture.statements.some(statement => statement.includes('ALTER TABLE text_regions ADD COLUMN'))).toBe(false);
        expect(fixture.version()).toBe(9);
    });

    it('clears only result metadata so the project participant remains the single parent owner', async () => {
        const fixture = databaseFixture();

        const repository = createSqliteLocalTranslationResultRepository(
            async () => fixture.database,
            { initialize: jest.fn(async () => undefined), listAll: jest.fn(async () => []) },
            { initialize: jest.fn(async () => undefined) },
            mockFiles,
        );

        await repository.clear();

        expect(fixture.statements).toContain('DELETE FROM translation_page_results');
        expect(fixture.statements).not.toContain('DELETE FROM translation_projects');
    });

    it('replaces demo metadata child-first even when legacy connections did not cascade deletes', async () => {
        const fixture = databaseFixture(['page-1']);

        const repository = createSqliteLocalTranslationResultRepository(
            async () => fixture.database,
            { initialize: jest.fn(async () => undefined), listAll: jest.fn(async () => []) },
            { initialize: jest.fn(async () => undefined) },
            mockFiles,
        );

        await repository.saveDemoResults(
            'project-1',
            [
                {
                    pageId: 'page-1',
                    attemptId: null,
                    sourceKind: 'DEMO',
                    renderedFilename: 'demo-page-1',
                    mimeType: 'image/jpeg',
                    byteSize: 10,
                    widthPx: 100,
                    heightPx: 200,
                    sha256: 'a'.repeat(64),
                    readyAt: 20,
                    autoOpenedAt: null,
                    regions: [],
                },
            ],
            20,
        );

        const vertices = fixture.statements.findIndex(statement => statement.startsWith('DELETE FROM text_region_vertices'));

        const regions = fixture.statements.findIndex(statement => statement.startsWith('DELETE FROM text_regions'));

        const results = fixture.statements.findIndex(statement => statement.startsWith('DELETE FROM translation_page_results'));

        expect(vertices).toBeGreaterThanOrEqual(0);
        expect(regions).toBeGreaterThan(vertices);
        expect(results).toBeGreaterThan(regions);
    });
});
