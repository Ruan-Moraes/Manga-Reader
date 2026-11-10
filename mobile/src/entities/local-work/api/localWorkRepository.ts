import { localTranslationResultRepository } from '@/entities/local-translation-result/@x/local-work';
import { advanceAppSchemaVersion, type AppDatabase, openAppDatabase, runAppDatabaseMigration, type SqlExecutor } from '@/shared/storage';

import type { LocalWork, LocalWorkChapter } from '../model/localWork';

const SCHEMA_VERSION = 11;
const SCHEMA = `
CREATE TABLE IF NOT EXISTS local_works (
    id TEXT PRIMARY KEY NOT NULL CHECK (length(id) > 0),
    name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 200),
    cover_filename TEXT,
    created_at INTEGER NOT NULL CHECK (created_at > 0),
    updated_at INTEGER NOT NULL CHECK (updated_at >= created_at)
);
CREATE TABLE IF NOT EXISTS local_work_chapters (
    project_id TEXT PRIMARY KEY NOT NULL REFERENCES translation_projects(id) ON DELETE CASCADE,
    work_id TEXT NOT NULL REFERENCES local_works(id) ON DELETE RESTRICT,
    label TEXT NOT NULL CHECK (length(trim(label)) BETWEEN 1 AND 120),
    created_at INTEGER NOT NULL CHECK (created_at > 0),
    updated_at INTEGER NOT NULL CHECK (updated_at >= created_at)
);
CREATE INDEX IF NOT EXISTS idx_local_work_chapters_work ON local_work_chapters(work_id, created_at, project_id);
`;

interface WorkRow {
    id: string;
    name: string;
    cover_filename: string | null;
    created_at: number;
    updated_at: number;
}
interface ChapterRow {
    project_id: string;
    work_id: string;
    label: string;
    created_at: number;
    updated_at: number;
}
export interface LocalWorkRepository {
    initialize(): Promise<void>;
    create(work: LocalWork): Promise<void>;
    get(id: string): Promise<LocalWork | null>;
    list(): Promise<LocalWork[]>;
    rename(id: string, name: string, expectedUpdatedAt: number, updatedAt: number): Promise<void>;
    setCoverFilename(id: string, filename: string | null, expectedUpdatedAt: number, updatedAt: number): Promise<void>;
    attachChapter(chapter: LocalWorkChapter, expectedWorkUpdatedAt: number): Promise<void>;
    listChapters(workId: string): Promise<LocalWorkChapter[]>;
    listUnassignedProjectIds(): Promise<string[]>;
    renameChapter(projectId: string, label: string, expectedUpdatedAt: number, expectedWorkUpdatedAt: number, updatedAt: number): Promise<void>;
    deleteEmpty(id: string): Promise<void>;
    deleteWithProjects(id: string, expectedUpdatedAt: number): Promise<string[]>;
    deleteChapter(workId: string, projectId: string, expectedUpdatedAt: number, updatedAt: number): Promise<void>;
    /**
     * Moves a chapter to another work, or out of any work when `targetWorkId` is null. The translation project is kept.
     * Both works are bumped in the same transaction.
     */
    moveChapter(projectId: string, fromWorkId: string, targetWorkId: string | null, label: string, expectedUpdatedAt: number, updatedAt: number): Promise<void>;
    measureMetadataBytes(): Promise<number>;
    clearMetadata(): Promise<void>;
}
function validId(value: string): boolean {
    return /^[a-zA-Z0-9_-]{1,128}$/.test(value);
}
function validText(value: string, max: number): boolean {
    return value.trim().length > 0 && value.length <= max;
}
function validTimes(createdAt: number, updatedAt: number): boolean {
    return Number.isSafeInteger(createdAt) && Number.isSafeInteger(updatedAt) && createdAt > 0 && updatedAt >= createdAt;
}
function changedExactlyOne(result: unknown): boolean {
    return typeof result === 'object' && result !== null && 'changes' in result && result.changes === 1;
}
async function hasActiveProcessing(tx: SqlExecutor, workId: string, projectId: string | null): Promise<boolean> {
    const row = await tx.getFirstAsync<{ active: number }>(
        `SELECT EXISTS(SELECT 1 FROM local_work_chapters c JOIN translation_pages p ON p.project_id = c.project_id
         LEFT JOIN remote_processing_attempts a ON a.page_id = p.id
         WHERE c.work_id = ? AND (? IS NULL OR c.project_id = ?)
         AND (p.status IN ('QUEUED','PROCESSING') OR a.status IN ('CREATED','SUBMITTING','UNKNOWN','CANCEL_PENDING')
         OR (a.status = 'ACCEPTED' AND p.status <> 'READY'))) AS active`,
        [workId, projectId, projectId],
    );
    return row?.active === 1;
}
function workFrom(row: WorkRow): LocalWork {
    return { id: row.id, name: row.name, coverFilename: row.cover_filename, createdAt: row.created_at, updatedAt: row.updated_at };
}
function chapterFrom(row: ChapterRow): LocalWorkChapter {
    return { projectId: row.project_id, workId: row.work_id, label: row.label, createdAt: row.created_at, updatedAt: row.updated_at };
}
function naturalCompare(left: string, right: string): number {
    const a = left.toLowerCase().match(/\d+|\D+/g) ?? [];
    const b = right.toLowerCase().match(/\d+|\D+/g) ?? [];
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (/^\d+$/.test(a[i]) && /^\d+$/.test(b[i])) {
            const x = a[i].replace(/^0+/, '') || '0';
            const y = b[i].replace(/^0+/, '') || '0';
            const numeric = x.length - y.length || (x < y ? -1 : x > y ? 1 : 0);
            if (numeric) return numeric;
        } else if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
    }
    return a.length - b.length;
}
export function createSqliteLocalWorkRepository(
    openDatabase: () => Promise<AppDatabase> = openAppDatabase,
    parents: { initialize(): Promise<void> } = localTranslationResultRepository,
): LocalWorkRepository {
    let initialized: Promise<void> | null = null;
    const database = async () => {
        await parents.initialize();
        const db = await openDatabase();
        initialized ??= runAppDatabaseMigration(async () => {
            await db.withExclusiveTransactionAsync(async tx => {
                await tx.execAsync(SCHEMA);
                const violations = await tx.getAllAsync<unknown>('PRAGMA foreign_key_check', []);
                if (violations.length) throw new Error('localWork.foreignKeyViolation');
                await advanceAppSchemaVersion(tx, SCHEMA_VERSION);
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
        async create(work) {
            if (
                !validId(work.id) ||
                !validText(work.name, 200) ||
                !validTimes(work.createdAt, work.updatedAt) ||
                (work.coverFilename !== null && !validId(work.coverFilename))
            )
                throw new Error('localWork.invalidWork');
            await (
                await database()
            ).runAsync('INSERT INTO local_works(id,name,cover_filename,created_at,updated_at) VALUES(?,?,?,?,?)', [
                work.id,
                work.name.trim(),
                work.coverFilename,
                work.createdAt,
                work.updatedAt,
            ]);
        },
        async get(id) {
            if (!validId(id)) throw new Error('localWork.invalidId');
            const row = await (await database()).getFirstAsync<WorkRow>('SELECT * FROM local_works WHERE id = ?', [id]);
            return row ? workFrom(row) : null;
        },
        async list() {
            const rows = await (await database()).getAllAsync<WorkRow>('SELECT * FROM local_works ORDER BY updated_at DESC, id ASC', []);
            return rows.map(workFrom);
        },
        async rename(id, name, expectedUpdatedAt, updatedAt) {
            if (!validId(id) || !validText(name, 200) || !validTimes(expectedUpdatedAt, updatedAt) || expectedUpdatedAt === updatedAt)
                throw new Error('localWork.invalidWork');
            const result = await (
                await database()
            ).runAsync('UPDATE local_works SET name = ?, updated_at = ? WHERE id = ? AND updated_at = ?', [name.trim(), updatedAt, id, expectedUpdatedAt]);
            if (!changedExactlyOne(result)) throw new Error('localWork.notFoundOrStale');
        },
        async setCoverFilename(id, filename, expectedUpdatedAt, updatedAt) {
            if (!validId(id) || (filename !== null && !validId(filename)) || !validTimes(expectedUpdatedAt, updatedAt) || expectedUpdatedAt === updatedAt)
                throw new Error('localWork.invalidWork');
            const result = await (
                await database()
            ).runAsync('UPDATE local_works SET cover_filename = ?, updated_at = ? WHERE id = ? AND updated_at = ?', [
                filename,
                updatedAt,
                id,
                expectedUpdatedAt,
            ]);
            if (!changedExactlyOne(result)) throw new Error('localWork.notFoundOrStale');
        },
        async attachChapter(chapter, expectedWorkUpdatedAt) {
            if (
                !validId(chapter.projectId) ||
                !validId(chapter.workId) ||
                !validText(chapter.label, 120) ||
                !validTimes(chapter.createdAt, chapter.updatedAt) ||
                !Number.isSafeInteger(expectedWorkUpdatedAt) ||
                expectedWorkUpdatedAt <= 0
            )
                throw new Error('localWork.invalidChapter');
            await (
                await database()
            ).withExclusiveTransactionAsync(async tx => {
                const work = await tx.getFirstAsync<{ updated_at: number }>('SELECT updated_at FROM local_works WHERE id = ?', [chapter.workId]);
                if (!work || work.updated_at !== expectedWorkUpdatedAt) throw new Error('localWork.notFoundOrStale');
                await tx.runAsync('INSERT INTO local_work_chapters(project_id,work_id,label,created_at,updated_at) VALUES(?,?,?,?,?)', [
                    chapter.projectId,
                    chapter.workId,
                    chapter.label.trim(),
                    chapter.createdAt,
                    chapter.updatedAt,
                ]);
                await tx.runAsync('UPDATE local_works SET updated_at = MAX(updated_at + 1, ?) WHERE id = ?', [chapter.updatedAt, chapter.workId]);
            });
        },
        async listChapters(workId) {
            if (!validId(workId)) throw new Error('localWork.invalidId');
            const rows = await (await database()).getAllAsync<ChapterRow>('SELECT * FROM local_work_chapters WHERE work_id = ?', [workId]);
            return rows
                .map(chapterFrom)
                .sort(
                    (a, b) =>
                        naturalCompare(a.label, b.label) || a.createdAt - b.createdAt || (a.projectId < b.projectId ? -1 : a.projectId > b.projectId ? 1 : 0),
                );
        },
        async listUnassignedProjectIds() {
            const rows = await (
                await database()
            ).getAllAsync<{ id: string }>(
                `SELECT project.id FROM translation_projects project
                 LEFT JOIN local_work_chapters chapter ON chapter.project_id = project.id
                 WHERE chapter.project_id IS NULL ORDER BY project.id ASC`,
                [],
            );
            return rows.map(row => row.id);
        },
        async renameChapter(projectId, label, expectedUpdatedAt, expectedWorkUpdatedAt, updatedAt) {
            if (
                !validId(projectId) ||
                !validText(label, 120) ||
                !validTimes(expectedUpdatedAt, updatedAt) ||
                expectedUpdatedAt === updatedAt ||
                !validTimes(expectedWorkUpdatedAt, updatedAt) ||
                expectedWorkUpdatedAt === updatedAt
            )
                throw new Error('localWork.invalidChapter');
            await (
                await database()
            ).withExclusiveTransactionAsync(async tx => {
                const parent = await tx.getFirstAsync<{ updated_at: number }>(
                    'SELECT w.updated_at FROM local_works w JOIN local_work_chapters c ON c.work_id = w.id WHERE c.project_id = ?',
                    [projectId],
                );
                if (!parent || parent.updated_at !== expectedWorkUpdatedAt) throw new Error('localWork.notFoundOrStale');
                const result = await tx.runAsync('UPDATE local_work_chapters SET label = ?, updated_at = ? WHERE project_id = ? AND updated_at = ?', [
                    label.trim(),
                    updatedAt,
                    projectId,
                    expectedUpdatedAt,
                ]);
                if (!changedExactlyOne(result)) throw new Error('localWork.notFoundOrStale');
                await tx.runAsync(
                    'UPDATE local_works SET updated_at = MAX(updated_at + 1, ?) WHERE id = (SELECT work_id FROM local_work_chapters WHERE project_id = ?)',
                    [updatedAt, projectId],
                );
            });
        },
        async deleteEmpty(id) {
            if (!validId(id)) throw new Error('localWork.invalidId');
            const result = await (await database()).runAsync('DELETE FROM local_works WHERE id = ?', [id]);
            if (!changedExactlyOne(result)) throw new Error('localWork.notFound');
        },
        async deleteWithProjects(id, expectedUpdatedAt) {
            if (!validId(id) || !Number.isSafeInteger(expectedUpdatedAt) || expectedUpdatedAt <= 0) throw new Error('localWork.invalidWork');
            const db = await database();
            let projectIds: string[] = [];
            await db.withExclusiveTransactionAsync(async tx => {
                const work = await tx.getFirstAsync<{ updated_at: number }>('SELECT updated_at FROM local_works WHERE id = ?', [id]);
                if (!work || work.updated_at !== expectedUpdatedAt) throw new Error('localWork.notFoundOrStale');
                if (await hasActiveProcessing(tx, id, null)) throw new Error('localWork.processingActive');
                const projects = await tx.getAllAsync<{ project_id: string }>(
                    'SELECT project_id FROM local_work_chapters WHERE work_id = ? ORDER BY project_id',
                    [id],
                );
                projectIds = projects.map(project => project.project_id);
                await tx.runAsync('DELETE FROM translation_projects WHERE id IN (SELECT project_id FROM local_work_chapters WHERE work_id = ?)', [id]);
                const removed = await tx.runAsync('DELETE FROM local_works WHERE id = ? AND updated_at = ?', [id, expectedUpdatedAt]);
                if (!changedExactlyOne(removed)) throw new Error('localWork.notFoundOrStale');
            });
            return projectIds;
        },
        async deleteChapter(workId, projectId, expectedUpdatedAt, updatedAt) {
            if (!validId(workId) || !validId(projectId) || !validTimes(expectedUpdatedAt, updatedAt) || expectedUpdatedAt === updatedAt)
                throw new Error('localWork.invalidChapter');
            await (
                await database()
            ).withExclusiveTransactionAsync(async tx => {
                const chapter = await tx.getFirstAsync<{ project_id: string }>(
                    'SELECT project_id FROM local_work_chapters WHERE project_id = ? AND work_id = ?',
                    [projectId, workId],
                );
                if (!chapter) throw new Error('localWork.notFoundOrStale');
                const work = await tx.getFirstAsync<{ updated_at: number }>('SELECT updated_at FROM local_works WHERE id = ?', [workId]);
                if (!work || work.updated_at !== expectedUpdatedAt) throw new Error('localWork.notFoundOrStale');
                if (await hasActiveProcessing(tx, workId, projectId)) throw new Error('localWork.processingActive');
                const deleted = await tx.runAsync('DELETE FROM translation_projects WHERE id = ?', [projectId]);
                if (!changedExactlyOne(deleted)) throw new Error('localWork.notFoundOrStale');
                const changed = await tx.runAsync('UPDATE local_works SET updated_at = ? WHERE id = ? AND updated_at = ?', [
                    updatedAt,
                    workId,
                    expectedUpdatedAt,
                ]);
                if (!changedExactlyOne(changed)) throw new Error('localWork.notFoundOrStale');
            });
        },
        async moveChapter(projectId, fromWorkId, targetWorkId, label, expectedUpdatedAt, updatedAt) {
            if (
                !validId(projectId) ||
                !validId(fromWorkId) ||
                (targetWorkId !== null && (!validId(targetWorkId) || targetWorkId === fromWorkId || !validText(label, 120))) ||
                !validTimes(expectedUpdatedAt, updatedAt) ||
                expectedUpdatedAt === updatedAt
            )
                throw new Error('localWork.invalidChapter');
            await (
                await database()
            ).withExclusiveTransactionAsync(async tx => {
                const work = await tx.getFirstAsync<{ updated_at: number }>('SELECT updated_at FROM local_works WHERE id = ?', [fromWorkId]);
                if (!work || work.updated_at !== expectedUpdatedAt) throw new Error('localWork.notFoundOrStale');
                if (targetWorkId === null) {
                    const removed = await tx.runAsync('DELETE FROM local_work_chapters WHERE project_id = ? AND work_id = ?', [projectId, fromWorkId]);
                    if (!changedExactlyOne(removed)) throw new Error('localWork.notFoundOrStale');
                } else {
                    const target = await tx.getFirstAsync<{ id: string }>('SELECT id FROM local_works WHERE id = ?', [targetWorkId]);
                    if (!target) throw new Error('localWork.notFoundOrStale');
                    const moved = await tx.runAsync(
                        'UPDATE local_work_chapters SET work_id = ?, label = ?, updated_at = ? WHERE project_id = ? AND work_id = ?',
                        [targetWorkId, label.trim(), updatedAt, projectId, fromWorkId],
                    );
                    if (!changedExactlyOne(moved)) throw new Error('localWork.notFoundOrStale');
                    await tx.runAsync('UPDATE local_works SET updated_at = MAX(updated_at + 1, ?) WHERE id = ?', [updatedAt, targetWorkId]);
                }
                await tx.runAsync('UPDATE local_works SET updated_at = ? WHERE id = ?', [updatedAt, fromWorkId]);
            });
        },
        async measureMetadataBytes() {
            const row = await (
                await database()
            ).getFirstAsync<{ total: number }>(
                `SELECT COALESCE((SELECT SUM(length(CAST(name AS BLOB)) + 1) FROM local_works), 0)
                      + COALESCE((SELECT SUM(length(CAST(label AS BLOB))) FROM local_work_chapters), 0) AS total`,
                [],
            );
            return Math.max(0, row?.total ?? 0);
        },
        async clearMetadata() {
            await (
                await database()
            ).withExclusiveTransactionAsync(async tx => {
                await tx.runAsync('DELETE FROM local_work_chapters', []);
                await tx.runAsync('DELETE FROM local_works', []);
            });
        },
    };
}
export const localWorkRepository = createSqliteLocalWorkRepository();
