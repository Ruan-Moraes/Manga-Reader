import {
    interruptVolatileDelivery,
    putVolatileDelivery,
    type RemoteProcessingAttempt,
    type RemoteProcessingAttemptRepository,
    reserveVolatileDelivery,
} from '@/entities/remote-processing-attempt';

import { createCancelRemoteProcessingController } from '../cancelRemoteProcessing';

const attempt: RemoteProcessingAttempt = {
    id: 'attempt',
    pageId: 'page',
    attemptNumber: 1,
    idempotencyKey: 'key',
    gatewayKey: 'gateway',
    gatewayContractVersion: '2.0',
    status: 'ACCEPTED',
    remoteStatus: 'READY',
    remoteJobRef: 'operation',
    errorCode: null,
    createdAt: 1,
    updatedAt: 2,
    submittedAt: 2,
    acceptedAt: 2,
    lastQueriedAt: null,
    cancellationRequestedAt: null,
    cancelledAt: null,
};
function setup() {
    const failVolatileAttempt = jest.fn(async () => ({ ...attempt, status: 'FAILED', remoteStatus: null, errorCode: 'submission-unknown' }));
    const attempts = { failVolatileAttempt } as unknown as RemoteProcessingAttemptRepository;
    return { controller: createCancelRemoteProcessingController({ attempts, now: () => 3 }), failVolatileAttempt };
}
afterEach(() => interruptVolatileDelivery(attempt.id));

it.each(['CREATED', 'SUBMITTING', 'UNKNOWN', 'ACCEPTED', 'CANCEL_PENDING'] as const)(
    'interrupts %s locally without claiming remote cancellation',
    async status => {
        const fixture = setup();
        const cancel = jest.fn(),
            dispose = jest.fn();
        reserveVolatileDelivery(attempt.id, cancel);
        putVolatileDelivery(attempt.id, 'operation', 'a'.repeat(64), { manifest: new Uint8Array(1), image: new Uint8Array(1), dispose });
        const result = await fixture.controller.cancel({ ...attempt, status });
        expect(cancel).toHaveBeenCalledTimes(1);
        expect(dispose).toHaveBeenCalledTimes(1);
        expect(fixture.failVolatileAttempt).toHaveBeenCalledWith(attempt.id, 3, 'submission-unknown');
        expect(result).toMatchObject({ error: null, attempt: { status: 'FAILED', remoteStatus: null } });
    },
);
it.each(['FAILED', 'REJECTED', 'CANCELLED'] as const)('leaves terminal or legacy state %s unchanged', async status => {
    const fixture = setup();
    const value = { ...attempt, status };
    await expect(fixture.controller.cancel(value)).resolves.toEqual({ attempt: value, error: 'cancellation-unavailable' });
    expect(fixture.failVolatileAttempt).not.toHaveBeenCalled();
});
it('closes a legacy active attempt locally without a remote request or changing its contract', async () => {
    const fixture = setup();
    const value = { ...attempt, gatewayContractVersion: '1.0' };
    fixture.failVolatileAttempt.mockResolvedValueOnce({ ...value, status: 'FAILED', remoteStatus: null, errorCode: 'submission-unknown' } as never);
    await expect(fixture.controller.cancel(value)).resolves.toMatchObject({ attempt: { status: 'FAILED', gatewayContractVersion: '1.0' }, error: null });
    expect(fixture.failVolatileAttempt).toHaveBeenCalledTimes(1);
});
it('preserves a concurrently committed READY result and reports an unavailable interruption', async () => {
    const fixture = setup();
    fixture.failVolatileAttempt.mockResolvedValueOnce(attempt as never);
    await expect(fixture.controller.cancel(attempt)).resolves.toEqual({ attempt, error: 'cancellation-unavailable' });
});
it('reports a local database failure without inventing a terminal state', async () => {
    const fixture = setup();
    fixture.failVolatileAttempt.mockRejectedValueOnce(new Error('database'));
    await expect(fixture.controller.cancel(attempt)).resolves.toEqual({ attempt, error: 'storage-unavailable' });
});
