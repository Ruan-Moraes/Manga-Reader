import { type BatchRun, chapterBatchQueueRepository } from '@/entities/remote-processing-attempt';
import type { RemoteProcessingCapabilities } from '@/entities/remote-processing-capability';
import { acquireRemoteTranslationResultController } from '@/features/acquire-remote-translation-result';
import { startRemoteProcessingController } from '@/features/start-remote-processing';
import { getCurrentLanguage } from '@/shared/i18n';
import { randomUuid } from '@/shared/lib';

import type { TranslationNotificationText } from './androidBatchService';
import type { ChapterBatchProgress, ChapterBatchResult } from './chapterBatch';
import { createChapterBatchController } from './chapterBatch';
import { runDurableChapterBatch } from './durableChapterBatch';

interface Snapshot {
    projectId: string | null;
    running: boolean;
    notificationActive: boolean;
    stopping: boolean;
    progress: ChapterBatchProgress | null;
    stoppedBy: ChapterBatchResult['stoppedBy'];
    pausedRun: BatchRun | null;
}
let snapshot: Snapshot = { projectId: null, running: false, notificationActive: false, stopping: false, progress: null, stoppedBy: null, pausedRun: null };
const listeners = new Set<() => void>();
let starting = false;
let stop: AbortController | undefined;
let abort: AbortController | undefined;
let recovered = false;
let recovering: Promise<void> | undefined;
function publish(patch: Partial<Snapshot>) {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach(listener => listener());
}

export const backgroundBatchManager = {
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
    getSnapshot() {
        return snapshot;
    },
    stopAfterCurrent() {
        stop?.abort();
        publish({ stopping: true });
    },
    interrupt() {
        abort?.abort();
    },
    async recover() {
        if (recovered || snapshot.running || starting) return;
        recovering ??= (async () => {
            await chapterBatchQueueRepository.pauseInterrupted(Date.now());
            const pausedRun = await chapterBatchQueueRepository.getOpen();
            publish({ pausedRun });
            recovered = true;
        })().finally(() => { recovering = undefined; });
        await recovering;
    },
    async discardPaused() {
        const run = snapshot.pausedRun;
        if (!run || snapshot.running || starting) return;
        await chapterBatchQueueRepository.setRun(run.id, 'cancelled', Date.now());
        publish({ pausedRun: null });
    },
    async resume(capabilities: RemoteProcessingCapabilities, text: TranslationNotificationText): Promise<boolean> {
        const run = snapshot.pausedRun;
        if (!run || !run.items.some(item => item.state === 'pending')) return false;
        return backgroundBatchManager.start(run.projectId, [], capabilities, text, run);
    },
    async start(
        projectId: string,
        pageIds: readonly string[],
        capabilities: RemoteProcessingCapabilities,
        text: TranslationNotificationText,
        resumeRun?: BatchRun,
    ): Promise<boolean> {
        if (starting || snapshot.running) throw new Error('batch.alreadyRunning');
        starting = true;
        const queue = chapterBatchQueueRepository;
        let run: BatchRun | null = null;
        try {
            const service: typeof import('./androidBatchService') = require('./androidBatchService');
            if (resumeRun) {
                run = resumeRun;
                await queue.setRun(resumeRun.id, 'active', Date.now());
            } else {
                const id = randomUuid();
                await queue.create(id, projectId, pageIds, Date.now());
                run = { id, projectId, state: 'active', items: [] };
            }
            run = await queue.getOpen();
            if (!run || run.projectId !== projectId) throw new Error('batch.notActive');
            const current = run;
            stop = new AbortController();
            abort = new AbortController();
            const stopSignal = stop.signal;
            const signal = abort.signal;
            publish({ projectId, running: true, stopping: false, progress: null, stoppedBy: null, pausedRun: null });
            const started = await service.startAndroidBatchService(
                current.id,
                projectId,
                text,
                async () => {
                    let completed = false;
                    try {
                        const controller = createChapterBatchController({
                            start: startRemoteProcessingController,
                            acquire: acquireRemoteTranslationResultController,
                            sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
                            maxPolls: 5,
                        });
                        const result = await runDurableChapterBatch(
                            current,
                            { capabilities, locale: getCurrentLanguage(), signal, stopSignal },
                            {
                                controller,
                                queue,
                                now: Date.now,
                                async onProgress(progress) {
                                    publish({ progress });
                                    const nativeState = await service.androidBatchServiceState(current.id);
                                    if (!nativeState.running || nativeState.stopRequested || (await queue.stopRequested(current.id))) stop?.abort();
                                    const alreadySaved = current.items.filter(item => item.state === 'saved').length;
                                    await service.updateAndroidBatchNotification(text, alreadySaved + progress.completed, current.items.length).catch(() => undefined);
                                },
                            },
                        );
                        publish({ stoppedBy: result.stoppedBy });
                        completed = current.items.every(item => item.state === 'saved' || result.statuses[item.pageId] === 'saved');
                    } catch {
                        publish({ stoppedBy: 'storage-unavailable' });
                    } finally {
                        stop = undefined;
                        abort = undefined;
                        await service.finishAndroidBatchService(text, completed).catch(() => undefined);
                        const pausedRun = await queue.getOpen().catch(() => null);
                        publish({ running: false, notificationActive: false, stopping: false, pausedRun });
                    }
                },
            );
            if (!started) {
                await queue.setRun(current.id, resumeRun ? 'paused' : 'cancelled', Date.now());
                stop = undefined;
                abort = undefined;
                publish({ projectId: null, running: false, progress: null, pausedRun: resumeRun ?? null });
            } else if (snapshot.running) {
                publish({ notificationActive: true });
            }
            return started;
        } catch (error) {
            if (run) await queue.setRun(run.id, 'paused', Date.now()).catch(() => undefined);
            stop = undefined;
            abort = undefined;
            publish({ running: false, notificationActive: false, stopping: false, pausedRun: run });
            throw error;
        } finally {
            starting = false;
        }
    },
};
