import { type BatchItemState, type BatchRun } from '@/entities/remote-processing-attempt';

import type { ChapterBatchController, ChapterBatchInput, ChapterBatchProgress, ChapterBatchResult } from './chapterBatch';

interface Queue {
    setItem(runId: string, pageId: string, state: BatchItemState): Promise<void>;
    setRun(runId: string, state: 'paused' | 'completed' | 'cancelled', now: number): Promise<void>;
}

/** Persists the current page before it can be sent; an interrupted write never authorizes a retry. */
export async function runDurableChapterBatch(
    run: BatchRun,
    input: Omit<ChapterBatchInput, 'projectId' | 'pageIds' | 'onProgress'>,
    dependencies: {
        controller: ChapterBatchController;
        queue: Queue;
        now(): number;
        onProgress?(progress: ChapterBatchProgress): void | Promise<void>;
    },
): Promise<ChapterBatchResult> {
    const pending = run.items.filter(item => item.state === 'pending').map(item => item.pageId);
    const previous = new Map(run.items.map(item => [item.pageId, item.state]));
    try {
        const result = await dependencies.controller.run({
            ...input,
            projectId: run.projectId,
            pageIds: pending,
            async onProgress(progress) {
                for (const [pageId, state] of Object.entries(progress.statuses)) {
                    if (previous.get(pageId) !== state) {
                        await dependencies.queue.setItem(run.id, pageId, state);
                        previous.set(pageId, state);
                    }
                }
                await dependencies.onProgress?.(progress);
            },
        });
        const complete = run.items.length > 0 && run.items.every(item => previous.get(item.pageId) === 'saved');
        await dependencies.queue.setRun(run.id, complete ? 'completed' : 'paused', dependencies.now());
        return result;
    } catch (error) {
        await dependencies.queue.setRun(run.id, 'paused', dependencies.now()).catch(() => undefined);
        throw error;
    }
}
