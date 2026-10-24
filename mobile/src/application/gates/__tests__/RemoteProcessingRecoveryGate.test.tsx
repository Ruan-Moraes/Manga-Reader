import { AppState, type AppStateStatus, Text } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';

import { remoteProcessingAttemptRepository } from '@/entities/remote-processing-attempt';
import {
    createStartRemoteProcessingController,
    type RemoteProcessingSnapshot,
    type StartRemoteProcessingController,
    useStartRemoteProcessing,
} from '@/features/start-remote-processing';

import { RemoteProcessingRecoveryGate } from '../RemoteProcessingRecoveryGate';

let mockController: StartRemoteProcessingController;

jest.mock('@/features/start-remote-processing', () => {
    const actual = jest.requireActual('@/features/start-remote-processing');
    return {
        ...actual,
        startRemoteProcessingController: { reconcile: (...args: unknown[]) => mockController.reconcile(...(args as [AbortSignal?])) },
    };
});

function Probe() {
    const state = useStartRemoteProcessing(mockController);
    return <Text>{state.loading || state.busy ? 'busy' : 'ready'}</Text>;
}

function setup() {
    // Only status is consumed by the hook; no synthetic record is persisted.
    const snapshot = { project: null, capabilities: null, attempt: { status: 'UNKNOWN' }, error: null } as RemoteProcessingSnapshot;
    const initialize = jest.spyOn(remoteProcessingAttemptRepository, 'initialize').mockResolvedValue();
    const listRecoverable = jest.spyOn(remoteProcessingAttemptRepository, 'listRecoverable').mockResolvedValue([snapshot.attempt!]);
    const request = jest.fn(async () => {
        throw new Error('controlled-offline');
    });
    const upload = jest.fn();
    type Dependencies = Parameters<typeof createStartRemoteProcessingController>[0];
    const controller = createStartRemoteProcessingController({
        attempts: remoteProcessingAttemptRepository,
        projects: { getLatest: async () => null } as unknown as Dependencies['projects'],
        identity: {} as Dependencies['identity'],
        files: {} as Dependencies['files'],
        createTransport: () => ({ request, upload }),
        now: () => 1,
        uuid: () => 'unused',
    });
    mockController = {
        ...controller,
        initialize: jest.fn(async () => snapshot),
        reconcile: jest.fn(async signal => {
            const result = await controller.reconcile(signal);
            return { ...snapshot, error: result.error };
        }),
    };
    const listeners = new Set<(state: AppStateStatus) => void>();
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, listener) => {
        listeners.add(listener);
        return { remove: () => listeners.delete(listener) };
    });
    const emit = (state: AppStateStatus) => [...listeners].forEach(listener => listener(state));
    return { initialize, listRecoverable, request, upload, listeners, emit };
}

describe('MOB-FEAT-017 recovery callers under controlled network failure', () => {
    it('shares an overlapping active wave across the real gate and hook and permits a fresh retry', async () => {
        const fixture = setup();
        render(
            <RemoteProcessingRecoveryGate>
                <Probe />
            </RemoteProcessingRecoveryGate>,
        );
        await waitFor(() => expect(screen.getByText('ready')).toBeOnTheScreen());
        expect(fixture.listeners.size).toBe(2);
        fixture.request.mockClear();
        fixture.listRecoverable.mockClear();
        jest.mocked(mockController.reconcile).mockClear();
        let release!: () => void;
        const pending = new Promise<void>(resolve => {
            release = resolve;
        });
        fixture.request.mockImplementation(async () => {
            await pending;
            throw new Error('controlled-offline');
        });

        await act(async () => {
            fixture.emit('background');
            fixture.emit('active');
            fixture.emit('active');
            fixture.emit('active');
        });
        await waitFor(() => expect(mockController.reconcile).toHaveBeenCalledTimes(6));
        expect(fixture.listRecoverable).toHaveBeenCalledTimes(3);
        expect(fixture.request).toHaveBeenCalledTimes(1);
        await act(async () => release());
        await waitFor(() => expect(screen.getByText('ready')).toBeOnTheScreen());

        await act(async () => fixture.emit('active'));
        await waitFor(() => expect(fixture.request).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(screen.getByText('ready')).toBeOnTheScreen());
        expect(fixture.upload).not.toHaveBeenCalled();
    });

    it('removes gate and hook listeners on unmount and does not accumulate them on remount', async () => {
        const fixture = setup();
        const tree = (
            <RemoteProcessingRecoveryGate>
                <Probe />
            </RemoteProcessingRecoveryGate>
        );
        for (let cycle = 0; cycle < 3; cycle += 1) {
            const view = render(tree);
            await waitFor(() => expect(screen.getByText('ready')).toBeOnTheScreen());
            expect(fixture.listeners.size).toBe(2);
            view.unmount();
            expect(fixture.listeners.size).toBe(0);
            const calls = fixture.request.mock.calls.length;
            await act(async () => fixture.emit('active'));
            expect(fixture.request).toHaveBeenCalledTimes(calls);
        }
    });
});
