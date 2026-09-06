import {
    pageJobEnvelopeSchema,
    type RemoteProcessingAttempt,
    type RemoteProcessingAttemptRepository,
    remoteProcessingAttemptRepository,
    type RemoteProcessingErrorCode,
} from '@/entities/remote-processing-attempt';
import { getRemoteProcessingCapabilities } from '@/entities/remote-processing-capability';
import { type RemoteProcessingIdentity, remoteProcessingIdentity } from '@/entities/remote-processing-identity';
import { createRemoteGatewayTransport, type RemoteGatewayTransport } from '@/shared/remote-gateway';

export interface CancelRemoteProcessingResult {
    attempt: RemoteProcessingAttempt;
    error: RemoteProcessingErrorCode | null;
}

export interface CancelRemoteProcessingController {
    cancel(attempt: RemoteProcessingAttempt, signal?: AbortSignal): Promise<CancelRemoteProcessingResult>;
}

interface Dependencies {
    attempts: RemoteProcessingAttemptRepository;
    identity: RemoteProcessingIdentity;
    createTransport(): RemoteGatewayTransport;
    now(): number;
}

export function createCancelRemoteProcessingController(dependencies: Dependencies): CancelRemoteProcessingController {
    return {
        async cancel(attempt, signal) {
            if (!attempt.remoteJobRef || !['ACCEPTED', 'CANCEL_PENDING'].includes(attempt.status)) {
                return { attempt, error: 'cancellation-unavailable' };
            }
            try {
                const transport = dependencies.createTransport();
                const capabilities = await getRemoteProcessingCapabilities(transport, signal);
                if (capabilities.gatewayKey !== attempt.gatewayKey) return { attempt, error: 'cancellation-unavailable' };
                const session = await dependencies.identity.getSession(capabilities.gatewayKey, transport, signal);
                const response = await transport.request(`/v1/page-jobs/${encodeURIComponent(attempt.remoteJobRef)}/cancel`, {
                    method: 'POST',
                    token: session.accessToken,
                    signal,
                });
                const envelope = pageJobEnvelopeSchema.safeParse(response.body);
                if ((response.status !== 200 && response.status !== 202) || !envelope.success) {
                    return { attempt, error: 'cancellation-unavailable' };
                }
                const projectId = await dependencies.attempts.getProjectIdForPage(attempt.pageId);
                if (!projectId) return { attempt, error: 'storage-unavailable' };
                if (envelope.data.status === 'CANCELLED') {
                    return {
                        attempt: await dependencies.attempts.confirmCancelled(attempt.id, projectId, attempt.pageId, dependencies.now()),
                        error: null,
                    };
                }
                if (envelope.data.status !== 'CANCEL_PENDING') {
                    return {
                        attempt: await dependencies.attempts.observe(attempt.id, envelope.data.status, dependencies.now()),
                        error: 'cancellation-unavailable',
                    };
                }
                return {
                    attempt: await dependencies.attempts.markCancelPending(attempt.id, dependencies.now()),
                    error: 'cancellation-pending',
                };
            } catch {
                const pending = await dependencies.attempts.markCancelPending(attempt.id, dependencies.now()).catch(() => attempt);
                return { attempt: pending, error: 'cancellation-pending' };
            }
        },
    };
}

export const cancelRemoteProcessingController = createCancelRemoteProcessingController({
    attempts: remoteProcessingAttemptRepository,
    identity: remoteProcessingIdentity,
    createTransport: () => createRemoteGatewayTransport(),
    now: Date.now,
});
