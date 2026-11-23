import { type TranslationProjectRepository, translationProjectRepository } from '@/entities/translation-project/@x/remote-processing-attempt';
import { advanceAppSchemaVersion, type AppDatabase, openAppDatabase, runAppDatabaseMigration } from '@/shared/storage';

export type BatchRunState = 'active' | 'paused' | 'completed' | 'cancelled';
export type BatchItemState = 'pending' | 'processing' | 'saved' | 'failed' | 'unknown';
export interface BatchRun {
    id: string;
    projectId: string;
    state: BatchRunState;
    items: { pageId: string; position: number; state: BatchItemState }[];
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS chapter_batch_runs (
    id TEXT PRIMARY KEY NOT NULL,
    project_id TEXT NOT NULL REFERENCES translation_projects(id) ON DELETE CASCADE,
    state TEXT NOT NULL CHECK (state IN ('active','paused','completed','cancelled')),
    stop_requested INTEGER NOT NULL DEFAULT 0 CHECK (stop_requested IN (0,1)),
    created_at INTEGER NOT NULL CHECK (created_at > 0),
    updated_at INTEGER NOT NULL CHECK (updated_at >= created_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chapter_batch_single_open ON chapter_batch_runs((1)) WHERE state IN ('active','paused');
CREATE INDEX IF NOT EXISTS idx_chapter_batch_project ON chapter_batch_runs(project_id);
CREATE TABLE IF NOT EXISTS chapter_batch_items (
    run_id TEXT NOT NULL REFERENCES chapter_batch_runs(id) ON DELETE CASCADE,
    page_id TEXT NOT NULL REFERENCES translation_pages(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position >= 0),
    state TEXT NOT NULL CHECK (state IN ('pending','processing','saved','failed','unknown')),
    PRIMARY KEY (run_id,page_id), UNIQUE (run_id,position)
);
CREATE INDEX IF NOT EXISTS idx_chapter_batch_page ON chapter_batch_items(page_id);
`;

export function createChapterBatchQueueRepository(
    open: () => Promise<AppDatabase> = openAppDatabase,
    projects: Pick<TranslationProjectRepository, 'initialize'> = translationProjectRepository,
) {
    let initialized: Promise<void> | null = null;
    async function database() {
        await projects.initialize();
        const db = await open();
        initialized ??= runAppDatabaseMigration(async () => {
            await db.withExclusiveTransactionAsync(async tx => {
                await tx.execAsync(SCHEMA);
                const columns = await tx.getAllAsync<{ name: string }>('PRAGMA table_info(chapter_batch_runs)', []);
                if (!columns.some(column => column.name === 'stop_requested')) {
                    await tx.execAsync('ALTER TABLE chapter_batch_runs ADD COLUMN stop_requested INTEGER NOT NULL DEFAULT 0 CHECK (stop_requested IN (0,1))');
                }
                await advanceAppSchemaVersion(tx, 11);
            });
        }).catch(error => {
            initialized = null;
            throw error;
        });
        await initialized;
        return db;
    }
    return {
        async initialize() {
            await database();
        },
        async create(id: string, projectId: string, pageIds: readonly string[], now: number): Promise<void> {
            if (!pageIds.length || new Set(pageIds).size !== pageIds.length) throw new Error('batch.invalidSelection');
            const db = await database();
            await db.withExclusiveTransactionAsync(async tx => {
                await tx.runAsync("INSERT INTO chapter_batch_runs(id,project_id,state,created_at,updated_at) VALUES(?,?,'active',?,?)", [
                    id,
                    projectId,
                    now,
                    now,
                ]);
                for (const [position, pageId] of pageIds.entries()) {
                    const page = await tx.getFirstAsync<{ id: string }>('SELECT id FROM translation_pages WHERE id=? AND project_id=?', [pageId, projectId]);
                    if (!page) throw new Error('batch.invalidSelection');
                    await tx.runAsync("INSERT INTO chapter_batch_items(run_id,page_id,position,state) VALUES(?,?,?,'pending')", [id, pageId, position]);
                }
            });
        },
        async getOpen(): Promise<BatchRun | null> {
            const db = await database();
            const run = await db.getFirstAsync<{ id: string; project_id: string; state: BatchRunState }>(
                "SELECT id,project_id,state FROM chapter_batch_runs WHERE state IN ('active','paused') LIMIT 1",
            );
            if (!run) return null;
            const items = await db.getAllAsync<{ page_id: string; position: number; state: BatchItemState }>(
                'SELECT page_id,position,state FROM chapter_batch_items WHERE run_id=? ORDER BY position',
                [run.id],
            );
            return {
                id: run.id,
                projectId: run.project_id,
                state: run.state,
                items: items.map(item => ({ pageId: item.page_id, position: item.position, state: item.state })),
            };
        },
        async setItem(runId: string, pageId: string, state: BatchItemState): Promise<void> {
            const db = await database();
            const result = await db.runAsync(
                "UPDATE chapter_batch_items SET state=? WHERE run_id=? AND page_id=? AND ((state='pending' AND ?='processing') OR (state='processing' AND ? IN ('saved','failed','unknown'))) AND EXISTS(SELECT 1 FROM chapter_batch_runs WHERE id=? AND state='active')",
                [state, runId, pageId, state, state, runId],
            );
            if ((result as { changes?: number }).changes !== 1) throw new Error('batch.notActive');
        },
        async setRun(runId: string, state: BatchRunState, now: number): Promise<void> {
            const db = await database();
            await db.withExclusiveTransactionAsync(async tx => {
                if (state === 'paused' || state === 'cancelled') {
                    await tx.runAsync("UPDATE chapter_batch_items SET state='unknown' WHERE run_id=? AND state='processing'", [runId]);
                }
                const result = await tx.runAsync("UPDATE chapter_batch_runs SET state=?,updated_at=?,stop_requested=CASE WHEN ?='active' THEN 0 ELSE stop_requested END WHERE id=? AND state IN ('active','paused') AND (? <> 'completed' OR NOT EXISTS (SELECT 1 FROM chapter_batch_items WHERE run_id=? AND state <> 'saved'))", [state, now, state, runId, state, runId]) as { changes: number };
                if (result.changes !== 1) throw new Error('Invalid batch run transition');
            });
        },
        async requestStop(runId: string): Promise<void> {
            const db = await database();
            await db.runAsync("UPDATE chapter_batch_runs SET stop_requested=1 WHERE id=? AND state='active'", [runId]);
        },
        async stopRequested(runId: string): Promise<boolean> {
            const db = await database();
            const row = await db.getFirstAsync<{ stop_requested: number }>('SELECT stop_requested FROM chapter_batch_runs WHERE id=?', [runId]);
            return row?.stop_requested === 1;
        },
        async pauseInterrupted(now: number): Promise<void> {
            const db = await database();
            await db.withExclusiveTransactionAsync(async tx => {
                await tx.runAsync(
                    "UPDATE chapter_batch_items SET state='unknown' WHERE state='processing' AND run_id IN (SELECT id FROM chapter_batch_runs WHERE state='active')",
                    [],
                );
                await tx.runAsync("UPDATE chapter_batch_runs SET state='paused',updated_at=? WHERE state='active'", [now]);
            });
        },
    };
}
export const chapterBatchQueueRepository = createChapterBatchQueueRepository();
