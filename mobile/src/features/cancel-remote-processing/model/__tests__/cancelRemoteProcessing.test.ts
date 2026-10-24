import type { RemoteProcessingAttempt, RemoteProcessingAttemptRepository } from '@/entities/remote-processing-attempt';
import type { RemoteProcessingIdentity } from '@/entities/remote-processing-identity';
import type { RemoteGatewayTransport } from '@/shared/remote-gateway';

import { createCancelRemoteProcessingController } from '../cancelRemoteProcessing';

const attempt: RemoteProcessingAttempt = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    pageId: 'page-1',
    attemptNumber: 1,
    idempotencyKey: '550e8400-e29b-41d4-a716-446655440002',
    gatewayKey: 'gateway-alpha',
    gatewayContractVersion: '1.0',
    status: 'ACCEPTED',
    remoteStatus: 'QUEUED',
    remoteJobRef: '550e8400-e29b-41d4-a716-446655440003',
    errorCode: null,
    createdAt: 1,
    updatedAt: 2,
    submittedAt: 2,
    acceptedAt: 2,
    lastQueriedAt: null,
    cancellationRequestedAt: null,
    cancelledAt: null,
};

const capabilities = {
    contractVersion: '1.0',
    gatewayKey: 'gateway-alpha',
    generatedAt: '2026-09-02T12:00:00.000Z',
    validUntil: '2026-09-02T12:05:00.000Z',
    enabled: true,
    supportedLanguages: ['ja', 'pt-BR'],
    supportedPairs: [{ source: 'ja', target: 'pt-BR' }],
    mediaLimits: { mimeTypes: ['image/jpeg'], maxBytes: 1, maxWidthPx: 1, maxHeightPx: 1, maxPixels: 1 },
    dailyInstallationQuota: 20,
    dailyGlobalQuota: 100,
    disclosure: {
        version: 'v1',
        operatorName: 'MR',
        operatorContact: 'privacy@toonlira.com',
        privacyPolicyUrl: 'https://toonlira.com/privacy',
        termsUrl: 'https://toonlira.com/terms',
        gatewayRegion: 'southamerica-east1',
        ocrRegion: 'us',
        translationLocation: 'global',
        originalRetentionSeconds: 1,
        resultRetentionSeconds: 1,
        metadataRetentionDays: 1,
        providerTrainingPolicy: 'No training.',
    },
};

function setup(status: 'CANCELLED' | 'CANCEL_PENDING', reject = false) {
    const attempts = {
        getProjectIdForPage: jest.fn(async () => 'project-1'),
        confirmCancelled: jest.fn(async () => ({ ...attempt, status: 'CANCELLED', remoteStatus: 'CANCELLED' })),
        markCancelPending: jest.fn(async () => ({ ...attempt, status: 'CANCEL_PENDING', remoteStatus: 'CANCEL_PENDING' })),
        observe: jest.fn(),
    } as unknown as jest.Mocked<RemoteProcessingAttemptRepository>;
    const transport = {
        request: jest
            .fn()
            .mockResolvedValueOnce({ status: 200, headers: {}, body: capabilities })
            [reject ? 'mockRejectedValueOnce' : 'mockResolvedValueOnce'](
                reject
                    ? new Error('network')
                    : {
                          status: status === 'CANCELLED' ? 200 : 202,
                          headers: {},
                          body: { contractVersion: '1.0', jobRef: attempt.remoteJobRef, status, serverTime: '2026-09-02T12:01:00.000Z' },
                      },
            ),
    } as unknown as jest.Mocked<RemoteGatewayTransport>;
    const identity = {
        getSession: jest.fn(async () => ({ accessToken: 's'.repeat(43), expiresAt: Date.now() + 60_000 })),
    } as unknown as jest.Mocked<RemoteProcessingIdentity>;
    return { controller: createCancelRemoteProcessingController({ attempts, identity, createTransport: () => transport, now: () => 3 }), attempts, transport };
}

describe('MOB-FEAT-017 cancellation', () => {
    it.each(['CANCELLED', 'CANCEL_PENDING', 'FAILED'])('rejects a %s response for another job without mutating the attempt', async status => {
        const fixture = setup('CANCELLED');
        fixture.transport.request
            .mockReset()
            .mockResolvedValueOnce({ status: 200, headers: new Headers(), body: capabilities })
            .mockResolvedValueOnce({
                status: status === 'CANCEL_PENDING' ? 202 : 200,
                headers: new Headers(),
                body: { contractVersion: '1.0', jobRef: '550e8400-e29b-41d4-a716-446655440099', status, serverTime: '2026-09-02T12:01:00.000Z' },
            });

        await expect(fixture.controller.cancel(attempt)).resolves.toEqual({ attempt, error: 'cancellation-unavailable' });
        expect(fixture.attempts.getProjectIdForPage).not.toHaveBeenCalled();
        expect(fixture.attempts.confirmCancelled).not.toHaveBeenCalled();
        expect(fixture.attempts.markCancelPending).not.toHaveBeenCalled();
        expect(fixture.attempts.observe).not.toHaveBeenCalled();
    });

    it.each(['CANCELLED', 'CANCEL_PENDING'] as const)('rejects a %s response with a contract different from the attempt', async status => {
        const fixture = setup(status);
        const incompatible = { ...attempt, gatewayContractVersion: '2.0' };

        await expect(fixture.controller.cancel(incompatible)).resolves.toEqual({ attempt: incompatible, error: 'cancellation-unavailable' });
        expect(fixture.attempts.getProjectIdForPage).not.toHaveBeenCalled();
        expect(fixture.attempts.confirmCancelled).not.toHaveBeenCalled();
        expect(fixture.attempts.markCancelPending).not.toHaveBeenCalled();
        expect(fixture.attempts.observe).not.toHaveBeenCalled();
    });

    it('only cancels local domain state after a terminal gateway confirmation', async () => {
        const fixture = setup('CANCELLED');
        await expect(fixture.controller.cancel(attempt)).resolves.toMatchObject({ error: null, attempt: { status: 'CANCELLED' } });
        expect(fixture.attempts.confirmCancelled).toHaveBeenCalledWith(attempt.id, 'project-1', attempt.pageId, 3);
        expect(fixture.attempts.markCancelPending).not.toHaveBeenCalled();
    });

    it.each([false, true])('persists CANCEL_PENDING for a non-terminal or ambiguous response (network=%s)', async reject => {
        const fixture = setup('CANCEL_PENDING', reject);
        await expect(fixture.controller.cancel(attempt)).resolves.toMatchObject({ error: 'cancellation-pending', attempt: { status: 'CANCEL_PENDING' } });
        expect(fixture.attempts.confirmCancelled).not.toHaveBeenCalled();
        expect(fixture.attempts.markCancelPending).toHaveBeenCalledWith(attempt.id, 3);
    });
});
