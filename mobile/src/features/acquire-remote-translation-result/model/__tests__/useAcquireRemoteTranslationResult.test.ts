import { AppState } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import type { AcquireRemoteTranslationResultController } from '../acquireRemoteTranslationResult';
import { useAcquireRemoteTranslationResult } from '../useAcquireRemoteTranslationResult';

it('reconciles local acquisition only in foreground and aborts its owner on background', async () => {
    jest.useFakeTimers();
    let listener: (s: string) => void = () => undefined;
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, fn) => {
        listener = fn as typeof listener;
        return { remove: jest.fn() };
    });
    const signals: AbortSignal[] = [];
    const controller: AcquireRemoteTranslationResultController = {
        run: jest.fn(async (_id, signal) => {
            signals.push(signal!);
            return { status: 'waiting' as const, stage: 0, projectId: 'p', pageId: 'page', error: null };
        }),
        claimOpen: jest.fn(async () => false),
    };
    const hook = renderHook(() => useAcquireRemoteTranslationResult('attempt', controller, jest.fn()));
    await waitFor(() => expect(controller.run).toHaveBeenCalledTimes(1));
    act(() => listener('background'));
    expect(signals[0]?.aborted).toBe(true);
    await act(async () => jest.advanceTimersByTime(60000));
    expect(controller.run).toHaveBeenCalledTimes(1);
    act(() => listener('active'));
    await waitFor(() => expect(controller.run).toHaveBeenCalledTimes(2));
    hook.unmount();
    jest.useRealTimers();
});
it('opens only after persistent claim and stops polling terminal ready', async () => {
    const events: string[] = [];
    const controller: AcquireRemoteTranslationResultController = {
        run: jest.fn(async () => ({ status: 'ready' as const, stage: 1, projectId: 'p', pageId: 'page', error: null })),
        claimOpen: jest.fn(async () => {
            events.push('claim');
            return true;
        }),
    };
    const navigate = jest.fn(() => {
        events.push('navigate');
    });
    const hook = renderHook(() => useAcquireRemoteTranslationResult('attempt', controller, navigate));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('p'));
    expect(events).toEqual(['claim', 'navigate']);
    hook.rerender({});
    expect(navigate).toHaveBeenCalledTimes(1);
    hook.unmount();
});

it('does not expose the preceding attempt when selection changes or clears', async () => {
    const controller: AcquireRemoteTranslationResultController = {
        run: jest.fn(async id =>
            id === 'first' ? { status: 'ready' as const, stage: 1, projectId: 'p', pageId: 'page', error: null } : await new Promise<never>(() => undefined),
        ),
        claimOpen: jest.fn(async () => false),
    };
    const hook = renderHook(({ id }: { id: string | null }) => useAcquireRemoteTranslationResult(id, controller), {
        initialProps: { id: 'first' as string | null },
    });
    await waitFor(() => expect(hook.result.current?.status).toBe('ready'));
    hook.rerender({ id: 'second' });
    expect(hook.result.current).toMatchObject({ status: 'waiting', projectId: null, pageId: null, stage: -1 });
    hook.rerender({ id: null });
    expect(hook.result.current).toBeNull();
    hook.unmount();
});
