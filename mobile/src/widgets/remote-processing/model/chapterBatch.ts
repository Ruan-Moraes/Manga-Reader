import type { RemoteAttemptStatus, RemoteProcessingErrorCode } from '@/entities/remote-processing-attempt';
import type { RemoteProcessingCapabilities } from '@/entities/remote-processing-capability';
import type { TranslationPage } from '@/entities/translation-page';
import type { AcquireRemoteTranslationResultController } from '@/features/acquire-remote-translation-result';
import type { StartRemoteProcessingController } from '@/features/start-remote-processing';
import type { SupportedLanguage } from '@/shared/i18n';

export type ChapterBatchPageStatus = 'pending' | 'processing' | 'saved' | 'failed' | 'unknown';
export interface ChapterBatchProgress {
    statuses: Record<string, ChapterBatchPageStatus>;
    completed: number;
    total: number;
}
export interface ChapterBatchResult {
    statuses: Record<string, ChapterBatchPageStatus>;
    stoppedBy: RemoteProcessingErrorCode | null;
}
export interface ChapterBatchInput {
    projectId: string;
    pageIds: readonly string[];
    capabilities: RemoteProcessingCapabilities;
    locale: SupportedLanguage;
    /** Hard cancel: aborts the page in flight (its outcome becomes uncertain, never resent automatically). */
    signal?: AbortSignal;
    /** Graceful stop: lets the page in flight finish and sends no further page. */
    stopSignal?: AbortSignal;
    onProgress?(progress: ChapterBatchProgress): void;
}
export interface ChapterBatchController {
    run(input: ChapterBatchInput): Promise<ChapterBatchResult>;
}
interface Dependencies {
    start: Pick<StartRemoteProcessingController, 'submit' | 'acceptConsent'>;
    acquire: Pick<AcquireRemoteTranslationResultController, 'run'>;
    sleep(ms: number): Promise<void>;
    maxPolls: number;
}

// Conditions that affect every page: continuing would only repeat the same refusal.
const GLOBAL_STOPS: readonly RemoteProcessingErrorCode[] = ['capabilities-unavailable', 'consent-required', 'unsupported-pair', 'network-required'];
const KNOWN_FAILURE: readonly RemoteAttemptStatus[] = ['FAILED', 'REJECTED', 'CANCELLED'];

/** Pages a batch may send: never tried, or failed with a known (non-ambiguous) outcome. */
export function selectBatchPages(
    pages: readonly Pick<TranslationPage, 'id' | 'status' | 'position'>[],
    latestAttemptStatus: (pageId: string) => RemoteAttemptStatus | null,
): string[] {
    return [...pages]
        .sort((a, b) => a.position - b.position)
        .filter(page => {
            if (page.status === 'DRAFT') return true;
            if (page.status !== 'FAILED') return false;
            const status = latestAttemptStatus(page.id);
            return status === null || KNOWN_FAILURE.includes(status);
        })
        .map(page => page.id);
}

export function createChapterBatchController(d: Dependencies): ChapterBatchController {
    return {
        async run({ projectId, pageIds, capabilities, locale, signal, stopSignal, onProgress }) {
            const statuses: Record<string, ChapterBatchPageStatus> = Object.fromEntries(pageIds.map(id => [id, 'pending' as const]));
            let stoppedBy: RemoteProcessingErrorCode | null = null;
            const report = () =>
                onProgress?.({
                    statuses: { ...statuses },
                    completed: Object.values(statuses).filter(status => status !== 'pending' && status !== 'processing').length,
                    total: pageIds.length,
                });
            report();
            for (const pageId of pageIds) {
                if (signal?.aborted || stopSignal?.aborted) break;
                statuses[pageId] = 'processing';
                report();
                let outcome: ChapterBatchPageStatus;
                try {
                    await d.start.acceptConsent(projectId, capabilities, locale, pageId);
                    const submitted = await d.start.submit(projectId, signal, pageId);
                    const attempt = submitted.attempt;
                    if (attempt?.status === 'ACCEPTED' && attempt.pageId === pageId) {
                        outcome = 'unknown';
                        for (let poll = 0; poll < d.maxPolls && !signal?.aborted; poll += 1) {
                            const result = await d.acquire.run(attempt.id, signal);
                            if (result.status === 'ready') {
                                outcome = 'saved';
                                break;
                            }
                            if (result.status === 'failed' || result.status === 'cancelled') {
                                outcome = 'failed';
                                break;
                            }
                            await d.sleep(1000 * 2 ** poll);
                        }
                    } else if (submitted.error === 'submission-unknown' || (attempt && ['SUBMITTING', 'UNKNOWN', 'CANCEL_PENDING'].includes(attempt.status))) {
                        outcome = 'unknown';
                    } else {
                        outcome = 'failed';
                        if (submitted.error && GLOBAL_STOPS.includes(submitted.error)) stoppedBy = submitted.error;
                    }
                } catch {
                    outcome = signal?.aborted ? 'unknown' : 'failed';
                }
                statuses[pageId] = outcome;
                report();
                if (stoppedBy) break;
            }
            // Pages never sent (stopped or cancelled) go back to their stored state instead of looking "in queue".
            const unsent = pageIds.filter(id => statuses[id] === 'pending');
            if (unsent.length > 0) {
                for (const id of unsent) delete statuses[id];
                report();
            }
            return { statuses, stoppedBy };
        },
    };
}
