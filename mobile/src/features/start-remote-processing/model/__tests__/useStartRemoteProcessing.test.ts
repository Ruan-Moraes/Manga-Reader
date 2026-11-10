import { AppState, type AppStateStatus } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import {
    interruptVolatileDelivery,
    putVolatileDelivery,
    type RemoteProcessingAttempt,
    reserveVolatileDelivery,
    takeVolatileDelivery,
} from '@/entities/remote-processing-attempt';
import type { RemoteProcessingCapabilities } from '@/entities/remote-processing-capability';
import type { TranslationProject } from '@/entities/translation-project';

import type { RemoteProcessingSnapshot, StartRemoteProcessingController } from '../startRemoteProcessing';
import { useStartRemoteProcessing } from '../useStartRemoteProcessing';

function setup() {
    const snapshot: RemoteProcessingSnapshot = {
        project: { id: 'project' } as TranslationProject,
        capabilities: {} as RemoteProcessingCapabilities,
        attempt: null,
        error: null,
    };
    let release!: (value: RemoteProcessingSnapshot) => void;
    const pending = new Promise<RemoteProcessingSnapshot>(resolve => {
        release = resolve;
    });
    const submit = jest.fn((_id: string, _signal?: AbortSignal) => pending);
    const controller: StartRemoteProcessingController = {
        initialize: jest.fn(async () => snapshot),
        acceptConsent: jest.fn(async () => undefined),
        submit,
        interrupt: jest.fn(async () => snapshot),
        reconcile: jest.fn(async () => snapshot),
    };
    let listener: (state: AppStateStatus) => void = () => undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => {
        listener = callback;
        return { remove: jest.fn() };
    });
    return { snapshot, controller, submit, release, emit: (state: AppStateStatus) => listener(state) };
}
it.each(['background', 'manual', 'unmount'])('owns one request and aborts it on %s', async reason => {
    const fixture = setup();
    const hook = renderHook(() => useStartRemoteProcessing(fixture.controller));
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    let first!: Promise<void>;
    act(() => {
        first = hook.result.current.acceptAndSubmit();
        void hook.result.current.acceptAndSubmit();
    });
    await waitFor(() => expect(fixture.submit).toHaveBeenCalledTimes(1));
    const signal = fixture.submit.mock.calls[0]![1]!;
    expect(signal.aborted).toBe(false);
    if (reason === 'unmount') hook.unmount();
    else act(() => (reason === 'manual' ? hook.result.current.interrupt() : fixture.emit('background')));
    expect(signal.aborted).toBe(true);
    await act(async () => {
        fixture.release(fixture.snapshot);
        await first;
    });
    expect(fixture.submit).toHaveBeenCalledTimes(1);
    if (reason !== 'unmount') hook.unmount();
});
it('does not send image bytes when interrupted during the consent transaction', async () => {
    const fixture = setup();
    let releaseConsent!: () => void;
    jest.mocked(fixture.controller.acceptConsent).mockImplementation(
        () =>
            new Promise<void>(resolve => {
                releaseConsent = resolve;
            }),
    );
    const hook = renderHook(() => useStartRemoteProcessing(fixture.controller));
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    let pending!: Promise<void>;
    act(() => {
        pending = hook.result.current.acceptAndSubmit();
    });
    act(() => fixture.emit('background'));
    await act(async () => {
        releaseConsent();
        await pending;
    });
    expect(fixture.submit).not.toHaveBeenCalled();
    hook.unmount();
});

afterEach(() => interruptVolatileDelivery('attempt'));
it.each(['background', 'unmount', 'manual'])('discards a delivered but unclaimed response on %s and permits a fresh lease', async reason => {
    const fixture = setup();
    const attempt = { id: 'attempt', status: 'ACCEPTED', gatewayContractVersion: '2.0' } as RemoteProcessingAttempt;
    const dispose = jest.fn();
    fixture.submit.mockImplementation(async () => {
        reserveVolatileDelivery('attempt', jest.fn());
        putVolatileDelivery('attempt', 'operation', 'a'.repeat(64), { manifest: new Uint8Array([1]), image: new Uint8Array([2]), dispose });
        return { ...fixture.snapshot, attempt };
    });
    jest.mocked(fixture.controller.interrupt).mockImplementation(async id => {
        interruptVolatileDelivery(id);
        return fixture.snapshot;
    });
    const hook = renderHook(() => useStartRemoteProcessing(fixture.controller));
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    await act(async () => hook.result.current.acceptAndSubmit());
    expect(hook.result.current.busy).toBe(false);
    expect(dispose).not.toHaveBeenCalled();
    if (reason === 'unmount') hook.unmount();
    else act(() => (reason === 'manual' ? hook.result.current.interrupt() : fixture.emit('background')));
    await waitFor(() => expect(dispose).toHaveBeenCalledTimes(1));
    expect(fixture.controller.interrupt).toHaveBeenCalledWith('attempt');
    expect(takeVolatileDelivery('attempt')).toBeNull();
    reserveVolatileDelivery('attempt', jest.fn());
    if (reason !== 'unmount') hook.unmount();
});
