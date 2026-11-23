import {
    interruptVolatileDelivery,
    type RemoteProcessingAttempt,
    type RemoteProcessingAttemptRepository,
    remoteProcessingAttemptRepository,
    type RemoteProcessingErrorCode,
} from '@/entities/remote-processing-attempt';

export interface CancelRemoteProcessingResult {
    attempt: RemoteProcessingAttempt;
    error: RemoteProcessingErrorCode | null;
}

export interface CancelRemoteProcessingController {
    cancel(attempt: RemoteProcessingAttempt, signal?: AbortSignal): Promise<CancelRemoteProcessingResult>;
}

interface Dependencies {
    attempts: RemoteProcessingAttemptRepository;
    now(): number;
}

/** Stops this device's delivery. It makes no claim about an external call already in progress. */
export function createCancelRemoteProcessingController(dependencies: Dependencies): CancelRemoteProcessingController {
    return {
        async cancel(attempt, signal) {
            if (signal?.aborted || !['CREATED', 'SUBMITTING', 'UNKNOWN', 'ACCEPTED', 'CANCEL_PENDING'].includes(attempt.status)) {
                return { attempt, error: 'cancellation-unavailable' };
            }
            interruptVolatileDelivery(attempt.id);
            try {
                const interrupted = await dependencies.attempts.failVolatileAttempt(attempt.id, dependencies.now(), 'submission-unknown');
                return { attempt: interrupted, error: interrupted.status === 'FAILED' ? null : 'cancellation-unavailable' };
            } catch {
                return { attempt, error: 'storage-unavailable' };
            }
        },
    };
}

export const cancelRemoteProcessingController = createCancelRemoteProcessingController({
    attempts: remoteProcessingAttemptRepository,
    now: Date.now,
});
