import { isTranslationLanguageCode } from '@/entities/local-media-import/@x/translation-project';
import {
    canTransitionTranslationState,
    isTerminalTranslationState,
    isTranslationState,
    type TranslationPage,
    type TranslationState,
} from '@/entities/translation-page/@x/translation-project';
import { appPrivateBatchFiles } from '@/shared/files';
import {
    advanceAppSchemaVersion,
    type AppDatabase,
    openAppDatabase,
    registerLocalDataParticipant,
    runAppDatabaseMigration,
    type SqlExecutor,
} from '@/shared/storage';

import type { NewTranslationProject, TranslationProject } from '../model/translationProject';

export const TRANSLATION_PROJECT_NAMESPACE = 'translation-projects';
const CURRENT_SCHEMA_VERSION = 6;
const LANGUAGE_CHECK = "'ja', 'en', 'es', 'ko', 'zh-Hans', 'zh-Hant', 'pt-BR'";
const STATE_CHECK = "'DRAFT', 'QUEUED', 'PROCESSING', 'READY', 'FAILED', 'CANCELLED'";

const CREATE_SCHEMA = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS translation_projects (
    id TEXT PRIMARY KEY NOT NULL,
    source_language TEXT NOT NULL CHECK (source_language IN (${LANGUAGE_CHECK})),
    target_language TEXT NOT NULL CHECK (target_language IN (${LANGUAGE_CHECK})),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (${STATE_CHECK})),
    created_at INTEGER NOT NULL CHECK (created_at > 0),
    updated_at INTEGER NOT NULL CHECK (updated_at >= created_at),
    status_updated_at INTEGER NOT NULL CHECK (status_updated_at BETWEEN created_at AND updated_at),
    language_review_required INTEGER NOT NULL DEFAULT 0 CHECK (language_review_required IN (0, 1)),
    CONSTRAINT chk_translation_projects_language_pair CHECK (source_language <> target_language)
);
CREATE TABLE IF NOT EXISTS translation_pages (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0),
    original_filename TEXT NOT NULL,
    original_byte_size INTEGER NOT NULL CHECK (original_byte_size > 0),
    original_mime_type TEXT NOT NULL CHECK (original_mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    width_px INTEGER NOT NULL CHECK (width_px > 0),
    height_px INTEGER NOT NULL CHECK (height_px > 0),
    media_validated_at INTEGER NOT NULL CHECK (media_validated_at > 0),
    media_validation_policy_version INTEGER NOT NULL CHECK (media_validation_policy_version > 0),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (${STATE_CHECK})),
    created_at INTEGER NOT NULL CHECK (created_at > 0),
    updated_at INTEGER NOT NULL CHECK (updated_at >= created_at),
    status_updated_at INTEGER NOT NULL CHECK (status_updated_at BETWEEN created_at AND updated_at),
    CONSTRAINT fk_translation_pages_project FOREIGN KEY (project_id) REFERENCES translation_projects(id) ON DELETE CASCADE,
    CONSTRAINT uk_translation_pages_position UNIQUE (project_id, position),
    CONSTRAINT uk_translation_pages_filename UNIQUE (project_id, original_filename)
);
CREATE INDEX IF NOT EXISTS idx_translation_projects_latest ON translation_projects(updated_at DESC, id DESC);
`;

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

interface TableColumnRow {
    name: string;
}

interface PageRow {
    id: string;
    project_id: string;
    position: number;
    original_filename: string;
    original_byte_size: number;
    original_mime_type: TranslationPage['originalMimeType'];
    width_px: number;
    height_px: number;
    media_validated_at: number;
    media_validation_policy_version: number;
    status: string;
    created_at: number;
    updated_at: number;
    status_updated_at: number;
}

export interface TranslationProjectRepository {
    initialize(): Promise<void>;
    create(project: NewTranslationProject): Promise<{ project: TranslationProject; created: boolean }>;
    getById(projectId: string): Promise<TranslationProject | null>;
    getLatest(): Promise<TranslationProject | null>;
    transitionPage(
        projectId: string,
        pageId: string,
        expectedStatus: TranslationState,
        expectedUpdatedAt: number,
        nextStatus: TranslationState,
        updatedAt: number,
    ): Promise<TranslationProject>;
    transitionProject(
        projectId: string,
        expectedStatus: TranslationState,
        expectedUpdatedAt: number,
        nextStatus: TranslationState,
        updatedAt: number,
    ): Promise<TranslationProject>;
    getReferencedProjectIds(): Promise<Set<string>>;
    measureBytes(): Promise<number>;
    clear(): Promise<void>;
}

function mapPage(row: PageRow): TranslationPage {
    if (!isTranslationState(row.status)) throw new Error('translationProject.invalidState');
    return {
        id: row.id,
        projectId: row.project_id,
        position: row.position,
        originalFilename: row.original_filename,
        originalByteSize: row.original_byte_size,
        originalMimeType: row.original_mime_type,
        widthPx: row.width_px,
        heightPx: row.height_px,
        mediaValidatedAt: row.media_validated_at,
        mediaValidationPolicyVersion: row.media_validation_policy_version,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        statusUpdatedAt: row.status_updated_at,
    };
}

async function getProjectFrom(executor: SqlExecutor, row: ProjectRow | null): Promise<TranslationProject | null> {
    if (!row) return null;
    if (!isTranslationLanguageCode(row.source_language) || !isTranslationLanguageCode(row.target_language) || !isTranslationState(row.status)) {
        throw new Error('translationProject.invalidStoredValue');
    }
    const pages = await executor.getAllAsync<PageRow>(
        `SELECT id, project_id, position, original_filename, original_byte_size, original_mime_type,
                width_px, height_px, media_validated_at, media_validation_policy_version,
                status, created_at, updated_at, status_updated_at
         FROM translation_pages WHERE project_id = ? ORDER BY position ASC`,
        [row.id],
    );
    return {
        id: row.id,
        sourceLanguage: row.source_language,
        targetLanguage: row.target_language,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        statusUpdatedAt: row.status_updated_at,
        languageReviewRequired: row.language_review_required === 1,
        pages: pages.map(mapPage),
    };
}

async function getByIdFrom(executor: SqlExecutor, projectId: string): Promise<TranslationProject | null> {
    const row = await executor.getFirstAsync<ProjectRow>(
        `SELECT id, source_language, target_language, status, created_at, updated_at, status_updated_at, language_review_required
         FROM translation_projects WHERE id = ? LIMIT 1`,
        [projectId],
    );
    return getProjectFrom(executor, row);
}

function equivalentSnapshot(left: TranslationProject, right: NewTranslationProject): boolean {
    return (
        left.id === right.id &&
        left.sourceLanguage === right.sourceLanguage &&
        left.targetLanguage === right.targetLanguage &&
        left.pages.length === right.pages.length &&
        left.pages.every((page, index) => {
            const other = right.pages[index];
            return (
                page.id === other?.id &&
                page.position === other.position &&
                page.originalFilename === other.originalFilename &&
                page.originalByteSize === other.originalByteSize &&
                page.originalMimeType === other.originalMimeType &&
                page.widthPx === other.widthPx &&
                page.heightPx === other.heightPx &&
                page.mediaValidatedAt === other.mediaValidatedAt &&
                page.mediaValidationPolicyVersion === other.mediaValidationPolicyVersion
            );
        })
    );
}

function validateNewProject(project: NewTranslationProject): void {
    if (project.pages.length === 0 || project.status !== 'DRAFT' || project.sourceLanguage === project.targetLanguage) {
        throw new Error('translationProject.invalidSnapshot');
    }
    const positions = new Set(project.pages.map(page => page.position));
    const filenames = new Set(project.pages.map(page => page.originalFilename));
    if (
        positions.size !== project.pages.length ||
        filenames.size !== project.pages.length ||
        project.pages.some((page, index) => page.projectId !== project.id || page.status !== 'DRAFT' || page.position !== index)
    ) {
        throw new Error('translationProject.invalidSnapshot');
    }
}

async function migrateLanguageSchema(database: AppDatabase): Promise<void> {
    const columns = await database.getAllAsync<TableColumnRow>('PRAGMA table_info(translation_projects)', []);
    if (columns.some(column => column.name === 'language_review_required')) return;

    await database.execAsync('PRAGMA foreign_keys = OFF;');
    try {
        await database.execAsync(`
BEGIN IMMEDIATE;
DROP TABLE IF EXISTS translation_pages_v6;
DROP TABLE IF EXISTS translation_projects_v6;
CREATE TABLE translation_projects_v6 (
    id TEXT PRIMARY KEY NOT NULL,
    source_language TEXT NOT NULL CHECK (source_language IN (${LANGUAGE_CHECK})),
    target_language TEXT NOT NULL CHECK (target_language IN (${LANGUAGE_CHECK})),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (${STATE_CHECK})),
    created_at INTEGER NOT NULL CHECK (created_at > 0),
    updated_at INTEGER NOT NULL CHECK (updated_at >= created_at),
    status_updated_at INTEGER NOT NULL CHECK (status_updated_at BETWEEN created_at AND updated_at),
    language_review_required INTEGER NOT NULL DEFAULT 0 CHECK (language_review_required IN (0, 1)),
    CONSTRAINT chk_translation_projects_language_pair CHECK (source_language <> target_language)
);
CREATE TABLE translation_pages_v6 (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0),
    original_filename TEXT NOT NULL,
    original_byte_size INTEGER NOT NULL CHECK (original_byte_size > 0),
    original_mime_type TEXT NOT NULL CHECK (original_mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
    width_px INTEGER NOT NULL CHECK (width_px > 0),
    height_px INTEGER NOT NULL CHECK (height_px > 0),
    media_validated_at INTEGER NOT NULL CHECK (media_validated_at > 0),
    media_validation_policy_version INTEGER NOT NULL CHECK (media_validation_policy_version > 0),
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (${STATE_CHECK})),
    created_at INTEGER NOT NULL CHECK (created_at > 0),
    updated_at INTEGER NOT NULL CHECK (updated_at >= created_at),
    status_updated_at INTEGER NOT NULL CHECK (status_updated_at BETWEEN created_at AND updated_at),
    CONSTRAINT fk_translation_pages_project FOREIGN KEY (project_id) REFERENCES translation_projects_v6(id) ON DELETE CASCADE,
    CONSTRAINT uk_translation_pages_position UNIQUE (project_id, position),
    CONSTRAINT uk_translation_pages_filename UNIQUE (project_id, original_filename)
);
INSERT INTO translation_projects_v6
    (id, source_language, target_language, status, created_at, updated_at, status_updated_at, language_review_required)
SELECT id,
       CASE source_language WHEN 'zh' THEN 'zh-Hans' ELSE source_language END,
       CASE target_language WHEN 'zh' THEN 'zh-Hans' ELSE target_language END,
       status, created_at, updated_at, status_updated_at,
       CASE WHEN source_language = 'zh' OR target_language = 'zh' THEN 1 ELSE 0 END
FROM translation_projects;
INSERT INTO translation_pages_v6
    (id, project_id, position, original_filename, original_byte_size, original_mime_type,
     width_px, height_px, media_validated_at, media_validation_policy_version,
     status, created_at, updated_at, status_updated_at)
SELECT id, project_id, position, original_filename, original_byte_size, original_mime_type,
       width_px, height_px, media_validated_at, media_validation_policy_version,
       status, created_at, updated_at, status_updated_at
FROM translation_pages;
DROP TABLE translation_pages;
DROP TABLE translation_projects;
ALTER TABLE translation_projects_v6 RENAME TO translation_projects;
ALTER TABLE translation_pages_v6 RENAME TO translation_pages;
CREATE INDEX idx_translation_projects_latest ON translation_projects(updated_at DESC, id DESC);
`);
        const violations = await database.getAllAsync<unknown>('PRAGMA foreign_key_check', []);
        if (violations.length > 0) throw new Error('translationProject.foreignKeyViolation');
        await database.execAsync('COMMIT;');
    } catch (error) {
        await database.execAsync('ROLLBACK;').catch(() => undefined);
        throw error;
    } finally {
        await database.execAsync('PRAGMA foreign_keys = ON;');
    }
}

export function createSqliteTranslationProjectRepository(openDatabase: () => Promise<AppDatabase> = openAppDatabase): TranslationProjectRepository {
    let initialized: Promise<void> | null = null;
    const database = async (): Promise<AppDatabase> => {
        const db = await openDatabase();
        initialized ??= runAppDatabaseMigration(async () => {
            await db.execAsync(CREATE_SCHEMA);
            await migrateLanguageSchema(db);
            await advanceAppSchemaVersion(db, CURRENT_SCHEMA_VERSION);
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
        async create(project) {
            validateNewProject(project);
            const db = await database();
            let created = false;
            await db.withExclusiveTransactionAsync(async transaction => {
                const existing = await getByIdFrom(transaction, project.id);
                if (existing) {
                    if (!equivalentSnapshot(existing, project)) throw new Error('translationProject.projectConflict');
                    return;
                }
                await transaction.runAsync(
                    `INSERT INTO translation_projects
                     (id, source_language, target_language, status, created_at, updated_at, status_updated_at, language_review_required)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        project.id,
                        project.sourceLanguage,
                        project.targetLanguage,
                        project.status,
                        project.createdAt,
                        project.updatedAt,
                        project.statusUpdatedAt,
                        0,
                    ],
                );
                for (const page of project.pages) {
                    await transaction.runAsync(
                        `INSERT INTO translation_pages
                         (id, project_id, position, original_filename, original_byte_size, original_mime_type,
                          width_px, height_px, media_validated_at, media_validation_policy_version,
                          status, created_at, updated_at, status_updated_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            page.id,
                            project.id,
                            page.position,
                            page.originalFilename,
                            page.originalByteSize,
                            page.originalMimeType,
                            page.widthPx,
                            page.heightPx,
                            page.mediaValidatedAt,
                            page.mediaValidationPolicyVersion,
                            page.status,
                            page.createdAt,
                            page.updatedAt,
                            page.statusUpdatedAt,
                        ],
                    );
                }
                created = true;
            });
            const persisted = await getByIdFrom(db, project.id);
            if (!persisted) throw new Error('translationProject.storageUnavailable');
            return { project: persisted, created };
        },
        async getById(projectId) {
            return getByIdFrom(await database(), projectId);
        },
        async getLatest() {
            const db = await database();
            const row = await db.getFirstAsync<ProjectRow>(
                `SELECT id, source_language, target_language, status, created_at, updated_at, status_updated_at, language_review_required
                 FROM translation_projects ORDER BY updated_at DESC, id DESC LIMIT 1`,
                [],
            );
            return getProjectFrom(db, row);
        },
        async transitionPage(projectId, pageId, expectedStatus, expectedUpdatedAt, nextStatus, updatedAt) {
            if (!canTransitionTranslationState(expectedStatus, nextStatus) || updatedAt <= expectedUpdatedAt) {
                throw new Error('translationProject.invalidTransition');
            }
            const db = await database();
            await db.withExclusiveTransactionAsync(async transaction => {
                const project = await getByIdFrom(transaction, projectId);
                const page = project?.pages.find(candidate => candidate.id === pageId);
                if (!page) throw new Error('translationProject.pageNotFound');
                if (page.status !== expectedStatus || page.updatedAt !== expectedUpdatedAt) throw new Error('translationProject.staleState');
                await transaction.runAsync('UPDATE translation_pages SET status = ?, updated_at = ?, status_updated_at = ? WHERE project_id = ? AND id = ?', [
                    nextStatus,
                    updatedAt,
                    updatedAt,
                    projectId,
                    pageId,
                ]);
            });
            const result = await getByIdFrom(db, projectId);
            if (!result) throw new Error('translationProject.pageNotFound');
            return result;
        },
        async transitionProject(projectId, expectedStatus, expectedUpdatedAt, nextStatus, updatedAt) {
            if (!canTransitionTranslationState(expectedStatus, nextStatus) || updatedAt <= expectedUpdatedAt) {
                throw new Error('translationProject.invalidTransition');
            }
            const db = await database();
            await db.withExclusiveTransactionAsync(async transaction => {
                const project = await getByIdFrom(transaction, projectId);
                if (!project) throw new Error('translationProject.notFound');
                if (project.status !== expectedStatus || project.updatedAt !== expectedUpdatedAt) throw new Error('translationProject.staleState');
                if (project.languageReviewRequired && nextStatus === 'QUEUED') {
                    throw new Error('translationProject.languageReviewRequired');
                }
                if (nextStatus === 'READY' && project.pages.some(page => page.status !== 'READY')) {
                    throw new Error('translationProject.pagesNotReady');
                }
                if (nextStatus === 'CANCELLED') {
                    for (const page of project.pages.filter(page => !isTerminalTranslationState(page.status))) {
                        await transaction.runAsync(
                            'UPDATE translation_pages SET status = ?, updated_at = ?, status_updated_at = ? WHERE project_id = ? AND id = ?',
                            ['CANCELLED', updatedAt, updatedAt, projectId, page.id],
                        );
                    }
                }
                await transaction.runAsync('UPDATE translation_projects SET status = ?, updated_at = ?, status_updated_at = ? WHERE id = ?', [
                    nextStatus,
                    updatedAt,
                    updatedAt,
                    projectId,
                ]);
            });
            const result = await getByIdFrom(db, projectId);
            if (!result) throw new Error('translationProject.notFound');
            return result;
        },
        async getReferencedProjectIds() {
            const rows = await (await database()).getAllAsync<{ id: string }>('SELECT id FROM translation_projects', []);
            return new Set(rows.map(row => row.id));
        },
        async measureBytes() {
            const row = await (
                await database()
            ).getFirstAsync<{ total: number | null }>('SELECT COALESCE(SUM(original_byte_size), 0) AS total FROM translation_pages', []);
            return Math.max(0, row?.total ?? 0);
        },
        async clear() {
            await (await database()).runAsync('DELETE FROM translation_projects', []);
        },
    };
}

export const translationProjectRepository = createSqliteTranslationProjectRepository();

export function registerTranslationProjectDataParticipant(): () => void {
    return registerLocalDataParticipant({
        id: 'translation-projects',
        measureBytes: async () => {
            await translationProjectRepository.initialize();
            return translationProjectRepository.measureBytes();
        },
        clear: async () => {
            await translationProjectRepository.initialize();
            await translationProjectRepository.clear();
            await appPrivateBatchFiles.clearNamespace(TRANSLATION_PROJECT_NAMESPACE);
        },
    });
}
