// TODO: REFATORAR TUDO AQUI, DIVIDIR POR RESPONSABILIDADES, RETIRAR SQL E COLOCAR EM UM ARQUIVO, COLOCAR AS TIPAGENS EM LUGARES CORRETOS e etc.

import { remoteProcessingAttemptRepository } from '@/entities/remote-processing-attempt/@x/local-translation-result';
import {
    TRANSLATION_PROJECT_NAMESPACE,
    type TranslationProject,
    translationProjectRepository,
} from '@/entities/translation-project/@x/local-translation-result';
import { appPrivateBatchFiles, type PrivateBatchFiles } from '@/shared/files';
import {
    advanceAppSchemaVersion,
    type AppDatabase,
    openAppDatabase,
    registerLocalDataParticipant,
    runAppDatabaseMigration,
    type SqlExecutor,
} from '@/shared/storage';

import { isLocalResultSource, type LocalTranslationResult, type NewLocalTranslationResult, type TextRegion } from '../model/localTranslationResult';

export const TRANSLATION_RESULT_NAMESPACE = 'translation-results';
const CURRENT_SCHEMA_VERSION = 9;

export const CREATE_LOCAL_TRANSLATION_SCHEMA = `
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS translation_page_results (
    page_id TEXT PRIMARY KEY NOT NULL,
    attempt_id TEXT UNIQUE,
    source_kind TEXT NOT NULL CHECK (source_kind IN ('DEMO', 'REMOTE')),
    rendered_filename TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    byte_size INTEGER NOT NULL CHECK (byte_size > 0),
    width_px INTEGER NOT NULL CHECK (width_px > 0),
    height_px INTEGER NOT NULL CHECK (height_px > 0),
    sha256 TEXT NOT NULL CHECK (length(sha256) = 64 AND sha256 = lower(sha256)),
    ready_at INTEGER NOT NULL CHECK (ready_at > 0),
    auto_opened_at INTEGER CHECK (auto_opened_at IS NULL OR auto_opened_at >= ready_at),
    CONSTRAINT fk_translation_page_results_page FOREIGN KEY (page_id) REFERENCES translation_pages(id) ON DELETE CASCADE,
    CONSTRAINT fk_translation_page_results_attempt FOREIGN KEY (attempt_id) REFERENCES remote_processing_attempts(id) ON DELETE CASCADE,
    CONSTRAINT chk_translation_page_results_source CHECK (
        (source_kind = 'DEMO' AND attempt_id IS NULL) OR (source_kind = 'REMOTE' AND attempt_id IS NOT NULL)
    )
);
CREATE TABLE IF NOT EXISTS text_regions (
    id TEXT PRIMARY KEY NOT NULL,
    page_id TEXT NOT NULL,
    reading_order INTEGER NOT NULL CHECK (reading_order >= 0),
    source_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    translation_contract_version TEXT CHECK (translation_contract_version IS NULL OR length(translation_contract_version) BETWEEN 1 AND 32),
    translation_model TEXT CHECK (translation_model IS NULL OR length(translation_model) BETWEEN 1 AND 128),
    translated_at INTEGER CHECK (translated_at IS NULL OR translated_at > 0),
    overflow INTEGER NOT NULL DEFAULT 0 CHECK (overflow IN (0, 1)),
    created_at INTEGER NOT NULL CHECK (created_at > 0),
    CONSTRAINT fk_text_regions_result FOREIGN KEY (page_id) REFERENCES translation_page_results(page_id) ON DELETE CASCADE,
    CONSTRAINT uk_text_regions_order UNIQUE (page_id, reading_order),
    CONSTRAINT chk_text_regions_translation_metadata CHECK (
        (translation_contract_version IS NULL AND translation_model IS NULL AND translated_at IS NULL) OR
        (translation_contract_version IS NOT NULL AND translation_model IS NOT NULL AND translated_at IS NOT NULL)
    )
);
CREATE TABLE IF NOT EXISTS text_region_vertices (
    region_id TEXT NOT NULL,
    vertex_index INTEGER NOT NULL CHECK (vertex_index BETWEEN 0 AND 7),
    x REAL NOT NULL CHECK (x BETWEEN 0 AND 1),
    y REAL NOT NULL CHECK (y BETWEEN 0 AND 1),
    CONSTRAINT pk_text_region_vertices PRIMARY KEY (region_id, vertex_index),
    CONSTRAINT fk_text_region_vertices_region FOREIGN KEY (region_id) REFERENCES text_regions(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS local_translation_reading_progress (
    project_id TEXT PRIMARY KEY NOT NULL,
    page_position INTEGER NOT NULL CHECK (page_position >= 0),
    updated_at INTEGER NOT NULL CHECK (updated_at > 0),
    CONSTRAINT fk_local_translation_progress_project FOREIGN KEY (project_id) REFERENCES translation_projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_local_translation_progress_page FOREIGN KEY (project_id, page_position)
        REFERENCES translation_pages(project_id, position) ON DELETE CASCADE
);
`;

interface ResultRow {
    page_id: string;
    attempt_id: string | null;
    source_kind: string;
    rendered_filename: string;
    mime_type: LocalTranslationResult['mimeType'];
    byte_size: number;
    width_px: number;
    height_px: number;
    sha256: string;
    ready_at: number;
    auto_opened_at: number | null;
}

interface RegionRow {
    id: string;
    page_id: string;
    reading_order: number;
    source_text: string;
    translated_text: string;
    translation_contract_version: string | null;
    translation_model: string | null;
    translated_at: number | null;
    overflow: number;
    created_at: number;
}

interface VertexRow {
    region_id: string;
    vertex_index: number;
    x: number;
    y: number;
}

export interface LocalTranslationLibraryItem {
    project: TranslationProject;
    readyPages: number;
    currentPosition: number | null;
    coverUri: string;
    demo: boolean;
}

export interface LocalTranslationResultRepository {
    initialize(): Promise<void>;
    saveDemoResults(projectId: string, results: readonly NewLocalTranslationResult[], updatedAt: number): Promise<void>;
    getByPage(pageId: string): Promise<LocalTranslationResult | null>;
    listByProject(projectId: string): Promise<LocalTranslationResult[]>;
    listLibrary(): Promise<LocalTranslationLibraryItem[]>;
    markAutoOpened(pageId: string, openedAt: number): Promise<void>;
    invalidate(pageId: string, updatedAt: number): Promise<void>;
    removeProject(projectId: string): Promise<void>;
    reconcileFiles(): Promise<void>;
    measureBytes(): Promise<number>;
    clear(): Promise<void>;
}

const RESULT_COLUMNS = `page_id, attempt_id, source_kind, rendered_filename, mime_type, byte_size,
    width_px, height_px, sha256, ready_at, auto_opened_at`;
const JOINED_RESULT_COLUMNS = `r.page_id, r.attempt_id, r.source_kind, r.rendered_filename, r.mime_type, r.byte_size,
    r.width_px, r.height_px, r.sha256, r.ready_at, r.auto_opened_at`;

function mapTranslationMetadata(region: RegionRow): TextRegion['translationMetadata'] {
    const version = region.translation_contract_version;
    const model = region.translation_model;
    const translatedAt = region.translated_at;

    if (version === null && model === null && translatedAt === null) return null;

    if (
        typeof version !== 'string' ||
        version.trim().length === 0 ||
        version.length > 32 ||
        typeof model !== 'string' ||
        model.trim().length === 0 ||
        model.length > 128 ||
        typeof translatedAt !== 'number' ||
        !Number.isSafeInteger(translatedAt) ||
        translatedAt <= 0
    ) {
        throw new Error('localTranslation.invalidStoredValue');
    }

    return { contractVersion: version, model, translatedAt };
}

async function mapResults(executor: SqlExecutor, rows: readonly ResultRow[]): Promise<LocalTranslationResult[]> {
    if (rows.length === 0) return [];

    const pagePlaceholders = rows.map(() => '?').join(', ');

    const regionRows = await executor.getAllAsync<RegionRow>(
        `SELECT id, page_id, reading_order, source_text, translated_text,
                translation_contract_version, translation_model, translated_at, overflow, created_at
         FROM text_regions WHERE page_id IN (${pagePlaceholders}) ORDER BY page_id ASC, reading_order ASC`,
        rows.map(row => row.page_id),
    );

    const regionIds = regionRows.map(region => region.id);

    const vertexRows =
        regionIds.length === 0
            ? []
            : await executor.getAllAsync<VertexRow>(
                  `SELECT region_id, vertex_index, x, y FROM text_region_vertices
                   WHERE region_id IN (${regionIds.map(() => '?').join(', ')}) ORDER BY region_id ASC, vertex_index ASC`,
                  regionIds,
              );

    const verticesByRegion = new Map<string, VertexRow[]>();

    for (const vertex of vertexRows) {
        const vertices = verticesByRegion.get(vertex.region_id) ?? [];

        vertices.push(vertex);

        verticesByRegion.set(vertex.region_id, vertices);
    }

    const regionsByPage = new Map<string, TextRegion[]>();

    for (const region of regionRows) {
        const regions = regionsByPage.get(region.page_id) ?? [];

        regions.push({
            id: region.id,
            pageId: region.page_id,
            readingOrder: region.reading_order,
            sourceText: region.source_text,
            translatedText: region.translated_text,
            translationMetadata: mapTranslationMetadata(region),
            overflow: region.overflow === 1,
            createdAt: region.created_at,
            vertices: (verticesByRegion.get(region.id) ?? []).map(vertex => ({ index: vertex.vertex_index, x: vertex.x, y: vertex.y })),
        });

        regionsByPage.set(region.page_id, regions);
    }

    return rows.map(row => {
        if (!isLocalResultSource(row.source_kind)) throw new Error('localTranslation.invalidStoredValue');

        return {
            pageId: row.page_id,
            attemptId: row.attempt_id,
            sourceKind: row.source_kind,
            renderedFilename: row.rendered_filename,
            mimeType: row.mime_type,
            byteSize: row.byte_size,
            widthPx: row.width_px,
            heightPx: row.height_px,
            sha256: row.sha256,
            readyAt: row.ready_at,
            autoOpenedAt: row.auto_opened_at,
            regions: regionsByPage.get(row.page_id) ?? [],
        };
    });
}

async function invalidateResult(executor: SqlExecutor, pageId: string, updatedAt: number): Promise<void> {
    const page = await executor.getFirstAsync<{ project_id: string }>('SELECT project_id FROM translation_pages WHERE id = ?', [pageId]);

    if (!page) return;

    await executor.runAsync('DELETE FROM translation_page_results WHERE page_id = ?', [pageId]);

    await executor.runAsync(`UPDATE translation_pages SET status = 'FAILED', updated_at = ?, status_updated_at = ? WHERE id = ?`, [
        updatedAt,
        updatedAt,
        pageId,
    ]);

    await executor.runAsync(`UPDATE translation_projects SET status = 'FAILED', updated_at = ?, status_updated_at = ? WHERE id = ?`, [
        updatedAt,
        updatedAt,
        page.project_id,
    ]);
}

export function createSqliteLocalTranslationResultRepository(
    openDatabase: () => Promise<AppDatabase> = openAppDatabase,
    projects: Pick<typeof translationProjectRepository, 'initialize' | 'listAll'> = translationProjectRepository,
    attempts: Pick<typeof remoteProcessingAttemptRepository, 'initialize'> = remoteProcessingAttemptRepository,
    files: PrivateBatchFiles = appPrivateBatchFiles,
): LocalTranslationResultRepository {
    let initialized: Promise<void> | null = null;

    const database = async () => {
        await projects.initialize();

        await attempts.initialize();

        const db = await openDatabase();

        initialized ??= runAppDatabaseMigration(async () => {
            await db.withExclusiveTransactionAsync(async transaction => {
                await transaction.execAsync(CREATE_LOCAL_TRANSLATION_SCHEMA);
                const columns = new Set((await transaction.getAllAsync<{ name: string }>('PRAGMA table_info(text_regions)', [])).map(column => column.name));
                if (!columns.has('translation_contract_version')) {
                    await transaction.execAsync(`ALTER TABLE text_regions ADD COLUMN translation_contract_version TEXT
                        CHECK (translation_contract_version IS NULL OR length(translation_contract_version) BETWEEN 1 AND 32);`);
                }
                if (!columns.has('translation_model')) {
                    await transaction.execAsync(`ALTER TABLE text_regions ADD COLUMN translation_model TEXT
                        CHECK (translation_model IS NULL OR length(translation_model) BETWEEN 1 AND 128);`);
                }
                if (!columns.has('translated_at')) {
                    await transaction.execAsync(`ALTER TABLE text_regions ADD COLUMN translated_at INTEGER
                        CHECK (translated_at IS NULL OR translated_at > 0);`);
                }
                await transaction.execAsync(`
                    CREATE TRIGGER IF NOT EXISTS chk_text_regions_translation_metadata_insert
                    BEFORE INSERT ON text_regions
                    WHEN NOT ((NEW.translation_contract_version IS NULL AND NEW.translation_model IS NULL AND NEW.translated_at IS NULL)
                        OR (NEW.translation_contract_version IS NOT NULL AND NEW.translation_model IS NOT NULL AND NEW.translated_at IS NOT NULL))
                    BEGIN SELECT RAISE(ABORT, 'incomplete translation metadata'); END;
                    CREATE TRIGGER IF NOT EXISTS chk_text_regions_translation_metadata_update
                    BEFORE UPDATE ON text_regions
                    WHEN NOT ((NEW.translation_contract_version IS NULL AND NEW.translation_model IS NULL AND NEW.translated_at IS NULL)
                        OR (NEW.translation_contract_version IS NOT NULL AND NEW.translation_model IS NOT NULL AND NEW.translated_at IS NOT NULL))
                    BEGIN SELECT RAISE(ABORT, 'incomplete translation metadata'); END;
                `);

                const violations = (
                    await Promise.all(
                        ['translation_page_results', 'text_regions', 'text_region_vertices', 'local_translation_reading_progress'].map(table =>
                            transaction.getAllAsync<unknown>(`PRAGMA foreign_key_check(${table})`, []),
                        ),
                    )
                ).flat();

                if (violations.length > 0) throw new Error('localTranslation.foreignKeyViolation');

                await advanceAppSchemaVersion(transaction, CURRENT_SCHEMA_VERSION);
            });
        }).catch(error => {
            initialized = null;

            throw error;
        });

        await initialized;

        return db;
    };

    return {
        async initialize() {
            await database();
        },
        async saveDemoResults(projectId, results, updatedAt) {
            if (
                results.length === 0 ||
                results.some(
                    result => result.sourceKind !== 'DEMO' || result.attemptId !== null || result.regions.some(region => region.translationMetadata !== null),
                )
            ) {
                throw new Error('localTranslation.invalidDemoResult');
            }

            const db = await database();

            await db.withExclusiveTransactionAsync(async transaction => {
                const projectPages = await transaction.getAllAsync<{ id: string }>(
                    'SELECT id FROM translation_pages WHERE project_id = ? ORDER BY position ASC',
                    [projectId],
                );

                const resultPageIds = new Set(results.map(result => result.pageId));

                if (projectPages.length !== results.length || resultPageIds.size !== results.length || projectPages.some(page => !resultPageIds.has(page.id))) {
                    throw new Error('localTranslation.projectMismatch');
                }

                const remote = await transaction.getFirstAsync<{ total: number }>(
                    `SELECT COUNT(*) AS total FROM translation_page_results r
                     JOIN translation_pages p ON p.id = r.page_id WHERE p.project_id = ? AND r.source_kind = 'REMOTE'`,
                    [projectId],
                );

                if ((remote?.total ?? 0) > 0) throw new Error('localTranslation.remoteResultExists');

                await transaction.runAsync(
                    `DELETE FROM text_region_vertices WHERE region_id IN (
                        SELECT region.id FROM text_regions region
                        JOIN translation_pages page ON page.id = region.page_id
                        WHERE page.project_id = ?
                    )`,
                    [projectId],
                );

                await transaction.runAsync(`DELETE FROM text_regions WHERE page_id IN (SELECT id FROM translation_pages WHERE project_id = ?)`, [projectId]);

                await transaction.runAsync('DELETE FROM translation_page_results WHERE page_id IN (SELECT id FROM translation_pages WHERE project_id = ?)', [
                    projectId,
                ]);

                for (const result of results) {
                    await transaction.runAsync(`INSERT INTO translation_page_results (${RESULT_COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                        result.pageId,
                        result.attemptId,
                        result.sourceKind,
                        result.renderedFilename,
                        result.mimeType,
                        result.byteSize,
                        result.widthPx,
                        result.heightPx,
                        result.sha256,
                        result.readyAt,
                        result.autoOpenedAt,
                    ]);

                    for (const region of result.regions) {
                        await transaction.runAsync(
                            `INSERT INTO text_regions (id, page_id, reading_order, source_text, translated_text,
                                translation_contract_version, translation_model, translated_at, overflow, created_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                region.id,
                                result.pageId,
                                region.readingOrder,
                                region.sourceText,
                                region.translatedText,
                                null,
                                null,
                                null,
                                region.overflow ? 1 : 0,
                                region.createdAt,
                            ],
                        );

                        for (const vertex of region.vertices) {
                            await transaction.runAsync('INSERT INTO text_region_vertices (region_id, vertex_index, x, y) VALUES (?, ?, ?, ?)', [
                                region.id,
                                vertex.index,
                                vertex.x,
                                vertex.y,
                            ]);
                        }
                    }

                    await transaction.runAsync(
                        `UPDATE translation_pages SET status = 'READY', updated_at = ?, status_updated_at = ? WHERE id = ? AND project_id = ?`,
                        [updatedAt, updatedAt, result.pageId, projectId],
                    );
                }

                await transaction.runAsync(`UPDATE translation_projects SET status = 'READY', updated_at = ?, status_updated_at = ? WHERE id = ?`, [
                    updatedAt,
                    updatedAt,
                    projectId,
                ]);
            });
        },
        async getByPage(pageId) {
            const db = await database();

            const row = await db.getFirstAsync<ResultRow>(`SELECT ${RESULT_COLUMNS} FROM translation_page_results WHERE page_id = ? LIMIT 1`, [pageId]);

            return row ? (await mapResults(db, [row]))[0] : null;
        },
        async listByProject(projectId) {
            const db = await database();

            const rows = await db.getAllAsync<ResultRow>(
                `SELECT ${JOINED_RESULT_COLUMNS} FROM translation_page_results r JOIN translation_pages p ON p.id = r.page_id
                 WHERE p.project_id = ? ORDER BY p.position ASC`,
                [projectId],
            );

            return mapResults(db, rows);
        },
        async listLibrary() {
            const db = await database();

            const projectsById = new Map((await projects.listAll()).map(project => [project.id, project]));

            const rows = await db.getAllAsync<{ id: string; ready_pages: number; current_position: number | null; demo: number }>(
                `SELECT pr.id, COUNT(r.page_id) AS ready_pages, progress.page_position AS current_position,
                        MAX(CASE WHEN r.source_kind = 'DEMO' THEN 1 ELSE 0 END) AS demo
                 FROM translation_projects pr
                 LEFT JOIN translation_pages p ON p.project_id = pr.id
                 LEFT JOIN translation_page_results r ON r.page_id = p.id
                 LEFT JOIN local_translation_reading_progress progress ON progress.project_id = pr.id
                 GROUP BY pr.id, progress.page_position
                 ORDER BY pr.updated_at DESC, pr.id DESC`,
                [],
            );

            const items: LocalTranslationLibraryItem[] = [];

            for (const row of rows) {
                const project = projectsById.get(row.id);

                const first = project?.pages[0];

                if (!project || !first) continue;

                items.push({
                    project,
                    readyPages: row.ready_pages,
                    currentPosition: row.current_position,
                    coverUri: files.fileUri(TRANSLATION_PROJECT_NAMESPACE, project.id, first.originalFilename),
                    demo: row.demo === 1,
                });
            }

            return items;
        },
        async markAutoOpened(pageId, openedAt) {
            await (
                await database()
            ).runAsync('UPDATE translation_page_results SET auto_opened_at = COALESCE(auto_opened_at, ?) WHERE page_id = ?', [openedAt, pageId]);
        },
        async invalidate(pageId, updatedAt) {
            const db = await database();

            await db.withExclusiveTransactionAsync(transaction => invalidateResult(transaction, pageId, updatedAt));
        },
        async removeProject(projectId) {
            await (await database()).runAsync('DELETE FROM translation_projects WHERE id = ?', [projectId]);
        },
        async reconcileFiles() {
            const db = await database();

            const projects = await db.getAllAsync<{ project_id: string }>(
                `SELECT DISTINCT p.project_id FROM translation_page_results r JOIN translation_pages p ON p.id = r.page_id`,
                [],
            );

            const validProjects = new Set(projects.map(row => row.project_id));

            await files.reconcile(TRANSLATION_RESULT_NAMESPACE, validProjects);

            for (const projectId of validProjects) {
                const rows = await db.getAllAsync<{ page_id: string; rendered_filename: string }>(
                    `SELECT r.page_id, r.rendered_filename FROM translation_page_results r
                     JOIN translation_pages p ON p.id = r.page_id WHERE p.project_id = ?`,
                    [projectId],
                );

                await files.reconcileBatch(TRANSLATION_RESULT_NAMESPACE, projectId, new Set(rows.map(row => row.rendered_filename)));

                for (const row of rows) {
                    const exists = await files.fileExists(TRANSLATION_RESULT_NAMESPACE, projectId, row.rendered_filename);

                    if (!exists) await db.withExclusiveTransactionAsync(transaction => invalidateResult(transaction, row.page_id, Date.now()));
                }
            }
        },
        async measureBytes() {
            const row = await (
                await database()
            ).getFirstAsync<{ total: number | null }>('SELECT COALESCE(SUM(byte_size), 0) AS total FROM translation_page_results', []);

            return Math.max(0, row?.total ?? 0);
        },
        async clear() {
            await (await database()).runAsync('DELETE FROM translation_page_results', []);

            await files.clearNamespace(TRANSLATION_RESULT_NAMESPACE);
        },
    };
}

export const localTranslationResultRepository = createSqliteLocalTranslationResultRepository();

export function registerLocalTranslationResultDataParticipant(): () => void {
    return registerLocalDataParticipant({
        id: 'local-translation-results',
        measureBytes: () => localTranslationResultRepository.measureBytes(),
        clear: () => localTranslationResultRepository.clear(),
    });
}
