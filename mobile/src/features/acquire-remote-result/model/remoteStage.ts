import type { RemoteJobStatus } from '@/entities/remote-processing-attempt';

/** The five confirmed milestones of one page; the bar shows no time estimate. */
export const REMOTE_STAGES = ['queue', 'ocr', 'translation', 'rendering', 'download'] as const;

export type RemoteStage = (typeof REMOTE_STAGES)[number];

const BY_STATUS: Partial<Record<RemoteJobStatus, number>> = { QUEUED: 0, OCR: 1, TRANSLATING: 2, RENDERING: 3, READY: 4 };

/**
 * Index of the current milestone from the last confirmed remote status, or {@link REMOTE_STAGES}.length once the
 * result is persisted locally. Unknown or terminal statuses give null: no bar.
 */
export function remoteStageIndex(remoteStatus: RemoteJobStatus | null, persisted: boolean): number | null {
    if (persisted) return REMOTE_STAGES.length;
    if (remoteStatus === null) return 0;
    return BY_STATUS[remoteStatus] ?? null;
}
