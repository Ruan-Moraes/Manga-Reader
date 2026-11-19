import type { RemoteJobStatus, RemoteProcessingAttempt } from '@/entities/remote-processing-attempt';
import type { TranslationProject } from '@/entities/translation-project';

/** At most this many pages of a project run on the gateway at once. */
export const MAX_ACTIVE_JOBS = 2;
/** Pages per batch: the next batch starts only once every page sent before it settled (READY or FAILED). */
export const BATCH_SIZE = 5;

/** Remote stages past translation: the chapter memory already holds this page's names. */
const TRANSLATED: readonly RemoteJobStatus[] = ['RENDERING', 'READY'];
const UNSETTLED_ATTEMPTS = ['CREATED', 'SUBMITTING', 'UNKNOWN', 'CANCEL_PENDING'];

export type QueueHold = 'finished' | 'paused' | 'reconciling' | 'window-full' | 'translating' | 'batch';

export type QueueDecision = { page: TranslationProject['pages'][number]; hold: null } | { page: null; hold: QueueHold };

/** Next midnight UTC, when the gateway's daily quota renews. */
export function nextQuotaRenewal(now: number): number {
    const day = new Date(now);
    return Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate() + 1);
}

/**
 * Which page goes next, in reading order. A page waits while an earlier submission is unconfirmed, while two pages
 * run, until the previous page's translation is done (so it already decided the chapter's names), and at the end of
 * a batch until the whole batch settled.
 */
export function nextPageToSend(
    project: TranslationProject,
    latest: readonly RemoteProcessingAttempt[],
    now: number,
    pausedUntil: number | null,
): QueueDecision {
    if (project.languageReviewRequired || !['DRAFT', 'QUEUED', 'PROCESSING'].includes(project.status)) return { page: null, hold: 'finished' };
    const pages = [...project.pages].sort((left, right) => left.position - right.position);
    const next = pages.find(page => page.status === 'DRAFT');
    if (!next) return { page: null, hold: 'finished' };
    if (pausedUntil !== null && now < pausedUntil) return { page: null, hold: 'paused' };
    if (latest.some(attempt => UNSETTLED_ATTEMPTS.includes(attempt.status))) return { page: null, hold: 'reconciling' };
    const running = pages.filter(page => page.status === 'QUEUED' || page.status === 'PROCESSING');
    if (running.length >= MAX_ACTIVE_JOBS) return { page: null, hold: 'window-full' };
    const runningAttempts = latest.filter(attempt => attempt.status === 'ACCEPTED' && running.some(page => page.id === attempt.pageId));
    const newest = runningAttempts.sort((left, right) => (right.acceptedAt ?? 0) - (left.acceptedAt ?? 0))[0];
    if (newest && (newest.remoteStatus === null || !TRANSLATED.includes(newest.remoteStatus))) return { page: null, hold: 'translating' };
    const sent = pages.filter(page => page.status !== 'DRAFT').length;
    if (sent > 0 && sent % BATCH_SIZE === 0 && running.length > 0) return { page: null, hold: 'batch' };
    return { page: next, hold: null };
}
