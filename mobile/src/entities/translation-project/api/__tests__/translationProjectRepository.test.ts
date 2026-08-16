import type { AppDatabase, SqlExecutor } from '@/src/shared/storage';

import type { NewTranslationProject } from '../../model/translationProject';
import { createSqliteTranslationProjectRepository } from '../translationProjectRepository';

interface ProjectRow {
    id: string;
    source_language: string;
    target_language: string;
    status: string;
    created_at: number;
    updated_at: number;
    status_updated_at: number;
    language_review_required: number;
}

interface PageRow {
    id: string;
    project_id: string;
    position: number;
    original_filename: string;
    original_byte_size: number;
    original_mime_type: 'image/jpeg' | 'image/png' | 'image/webp';
    width_px: number;
    height_px: number;
    media_validated_at: number;
    media_validation_policy_version: number;
    status: string;
    created_at: number;
    updated_at: number;
    status_updated_at: number;
}

function databaseFixture(options: { initialVersion?: number; legacyV5?: boolean; foreignKeyViolation?: boolean } = {}) {
    const projects: ProjectRow[] = [];
    const pages: PageRow[] = [];
    const statements: string[] = [];
    let userVersion = options.initialVersion ?? 4;
    let hasLanguageReviewRequired = !options.legacyV5;
    const executor: SqlExecutor = {
        execAsync: async source => {
            statements.push(source);
            const version = source.match(/PRAGMA user_version = (\d+)/);
            if (version) userVersion = Number(version[1]);
            if (source.includes('CREATE TABLE translation_projects_v6')) {
                hasLanguageReviewRequired = true;
                for (const project of projects) {
                    const hadLegacyChinese = project.source_language === 'zh' || project.target_language === 'zh';
                    if (project.source_language === 'zh') project.source_language = 'zh-Hans';
                    if (project.target_language === 'zh') project.target_language = 'zh-Hans';
                    project.language_review_required = hadLegacyChinese ? 1 : 0;
                }
            }
        },
        runAsync: async (source, params = []) => {
            statements.push(source);
            const values = params as unknown[];
            if (source.includes('INSERT INTO translation_projects')) {
                projects.push({
                    id: String(values[0]),
                    source_language: String(values[1]),
                    target_language: String(values[2]),
                    status: String(values[3]),
                    created_at: Number(values[4]),
                    updated_at: Number(values[5]),
                    status_updated_at: Number(values[6]),
                    language_review_required: Number(values[7]),
                });
            } else if (source.includes('INSERT INTO translation_pages')) {
                pages.push({
                    id: String(values[0]),
                    project_id: String(values[1]),
                    position: Number(values[2]),
                    original_filename: String(values[3]),
                    original_byte_size: Number(values[4]),
                    original_mime_type: values[5] as PageRow['original_mime_type'],
                    width_px: Number(values[6]),
                    height_px: Number(values[7]),
                    media_validated_at: Number(values[8]),
                    media_validation_policy_version: Number(values[9]),
                    status: String(values[10]),
                    created_at: Number(values[11]),
                    updated_at: Number(values[12]),
                    status_updated_at: Number(values[13]),
                });
            } else if (source.includes('UPDATE translation_pages SET status')) {
                const page = pages.find(candidate => candidate.project_id === String(values[3]) && candidate.id === String(values[4]));
                if (page) {
                    page.status = String(values[0]);
                    page.updated_at = Number(values[1]);
                    page.status_updated_at = Number(values[2]);
                }
            } else if (source.includes('UPDATE translation_projects SET status')) {
                const project = projects.find(candidate => candidate.id === String(values[3]));
                if (project) {
                    project.status = String(values[0]);
                    project.updated_at = Number(values[1]);
                    project.status_updated_at = Number(values[2]);
                }
            } else if (source.includes('DELETE FROM translation_projects')) {
                projects.splice(0);
                pages.splice(0);
            }
            return {};
        },
        getFirstAsync: async <T>(source: string, params = []) => {
            if (source === 'PRAGMA user_version') return { user_version: userVersion } as T;
            if (source.includes('SUM(original_byte_size)')) {
                return { total: pages.reduce((sum, page) => sum + page.original_byte_size, 0) } as T;
            }
            if (source.includes('FROM translation_projects WHERE id')) {
                return (projects.find(project => project.id === String((params as unknown[])[0])) ?? null) as T | null;
            }
            if (source.includes('FROM translation_projects ORDER BY')) {
                return ([...projects].sort((left, right) => right.updated_at - left.updated_at || right.id.localeCompare(left.id))[0] ?? null) as T | null;
            }
            return null;
        },
        getAllAsync: async <T>(source: string, params = []) => {
            statements.push(source);
            if (source.includes('PRAGMA table_info(translation_projects)')) {
                return [{ name: 'id' }, ...(hasLanguageReviewRequired ? [{ name: 'language_review_required' }] : [])] as T[];
            }
            if (source.includes('PRAGMA foreign_key_check')) return (options.foreignKeyViolation ? [{}] : []) as T[];
            if (source.includes('FROM translation_pages')) {
                return pages.filter(page => page.project_id === String((params as unknown[])[0])).sort((left, right) => left.position - right.position) as T[];
            }
            if (source.includes('SELECT id FROM translation_projects')) return projects.map(project => ({ id: project.id })) as T[];
            return [];
        },
    };
    const database: AppDatabase = { ...executor, withExclusiveTransactionAsync: async task => task(executor) };
    return { database, projects, pages, statements, userVersion: () => userVersion };
}

function snapshot(overrides: Partial<NewTranslationProject> = {}): NewTranslationProject {
    return {
        id: 'project-1',
        sourceLanguage: 'ja',
        targetLanguage: 'pt-BR',
        status: 'DRAFT',
        createdAt: 20,
        updatedAt: 20,
        statusUpdatedAt: 20,
        pages: [
            {
                id: 'page-1',
                projectId: 'project-1',
                position: 0,
                originalFilename: 'page-1.jpg',
                originalByteSize: 42,
                originalMimeType: 'image/jpeg',
                widthPx: 800,
                heightPx: 1200,
                mediaValidatedAt: 19,
                mediaValidationPolicyVersion: 1,
                status: 'DRAFT',
                createdAt: 20,
                updatedAt: 20,
                statusUpdatedAt: 20,
            },
        ],
        ...overrides,
    };
}

describe('MOB-FEAT-016 SQLite translation project repository', () => {
    it('creates v6 with relational constraints, language review marker and a deterministic latest index', async () => {
        const fixture = databaseFixture();
        const repository = createSqliteTranslationProjectRepository(async () => fixture.database);

        await repository.initialize();

        expect(fixture.userVersion()).toBe(6);
        expect(fixture.statements.some(statement => statement.includes('FOREIGN KEY (project_id) REFERENCES translation_projects(id) ON DELETE CASCADE'))).toBe(
            true,
        );
        expect(fixture.statements.some(statement => statement.includes('UNIQUE (project_id, position)'))).toBe(true);
        expect(fixture.statements.some(statement => statement.includes('idx_translation_projects_latest'))).toBe(true);
        expect(fixture.statements.some(statement => statement.includes('language_review_required'))).toBe(true);
    });

    it('migrates a v5 zh project to zh-Hans and blocks processing until language review', async () => {
        const fixture = databaseFixture({ initialVersion: 5, legacyV5: true });
        fixture.projects.push({
            id: 'legacy-project',
            source_language: 'zh',
            target_language: 'en',
            status: 'DRAFT',
            created_at: 10,
            updated_at: 10,
            status_updated_at: 10,
            language_review_required: 0,
        });
        const repository = createSqliteTranslationProjectRepository(async () => fixture.database);

        await repository.initialize();

        await expect(repository.getById('legacy-project')).resolves.toMatchObject({
            sourceLanguage: 'zh-Hans',
            targetLanguage: 'en',
            languageReviewRequired: true,
        });
        await expect(repository.transitionProject('legacy-project', 'DRAFT', 10, 'QUEUED', 11)).rejects.toThrow('translationProject.languageReviewRequired');
        expect(fixture.statements.some(statement => statement.includes('PRAGMA foreign_key_check'))).toBe(true);
    });

    it('rolls back the project rebuild when foreign key verification fails', async () => {
        const fixture = databaseFixture({ initialVersion: 5, legacyV5: true, foreignKeyViolation: true });
        const repository = createSqliteTranslationProjectRepository(async () => fixture.database);

        await expect(repository.initialize()).rejects.toThrow('translationProject.foreignKeyViolation');
        expect(fixture.statements).toContain('ROLLBACK;');
        expect(fixture.statements).not.toContain('PRAGMA user_version = 6;');
    });

    it('round-trips a stable snapshot and treats an equivalent repeat as idempotent', async () => {
        const fixture = databaseFixture();
        const repository = createSqliteTranslationProjectRepository(async () => fixture.database);

        await expect(repository.create(snapshot())).resolves.toMatchObject({ created: true, project: { id: 'project-1', pages: [{ id: 'page-1' }] } });
        await expect(repository.create(snapshot({ createdAt: 99, updatedAt: 99, statusUpdatedAt: 99 }))).resolves.toMatchObject({ created: false });
        await expect(repository.getLatest()).resolves.toMatchObject({ id: 'project-1', sourceLanguage: 'ja', targetLanguage: 'pt-BR' });
        await expect(repository.measureBytes()).resolves.toBe(42);
    });

    it('rejects a divergent snapshot with the same identity without overwriting it', async () => {
        const fixture = databaseFixture();
        const repository = createSqliteTranslationProjectRepository(async () => fixture.database);
        await repository.create(snapshot());

        await expect(repository.create(snapshot({ targetLanguage: 'en' }))).rejects.toThrow('translationProject.projectConflict');
        await expect(repository.getById('project-1')).resolves.toMatchObject({ targetLanguage: 'pt-BR' });
    });

    it('requires every page READY before the project can become READY', async () => {
        const fixture = databaseFixture();
        const repository = createSqliteTranslationProjectRepository(async () => fixture.database);
        await repository.create(snapshot());
        await repository.transitionProject('project-1', 'DRAFT', 20, 'QUEUED', 21);
        await repository.transitionProject('project-1', 'QUEUED', 21, 'PROCESSING', 22);
        await repository.transitionPage('project-1', 'page-1', 'DRAFT', 20, 'QUEUED', 21);
        await repository.transitionPage('project-1', 'page-1', 'QUEUED', 21, 'PROCESSING', 22);

        await expect(repository.transitionProject('project-1', 'PROCESSING', 22, 'READY', 23)).rejects.toThrow('translationProject.pagesNotReady');
        await repository.transitionPage('project-1', 'page-1', 'PROCESSING', 22, 'READY', 23);
        await expect(repository.transitionProject('project-1', 'PROCESSING', 22, 'READY', 24)).resolves.toMatchObject({
            status: 'READY',
            pages: [{ status: 'READY' }],
        });
    });

    it('cancels non-terminal pages atomically and rejects stale state', async () => {
        const fixture = databaseFixture();
        const repository = createSqliteTranslationProjectRepository(async () => fixture.database);
        await repository.create(snapshot());

        await expect(repository.transitionProject('project-1', 'DRAFT', 999, 'CANCELLED', 1000)).rejects.toThrow('translationProject.staleState');
        await expect(repository.transitionProject('project-1', 'DRAFT', 20, 'CANCELLED', 30)).resolves.toMatchObject({
            status: 'CANCELLED',
            pages: [{ status: 'CANCELLED' }],
        });
        await expect(repository.transitionProject('project-1', 'CANCELLED', 30, 'QUEUED', 31)).rejects.toThrow('translationProject.invalidTransition');
    });
});
