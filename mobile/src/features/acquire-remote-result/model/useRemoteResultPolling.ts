import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { type AcquireRemoteResultController, acquireRemoteResultController, type AcquireRemoteResultSnapshot } from './acquireRemoteResult';

/** Bounded backoff between rounds: it restarts from the first step whenever a stage moves. */
export const POLLING_DELAYS_MS = [2_000, 4_000, 8_000, 16_000, 30_000] as const;

export function nextPollingDelay(step: number): number {
    return POLLING_DELAYS_MS[Math.min(step, POLLING_DELAYS_MS.length - 1)]!;
}

interface Options {
    /** Follow only while something was accepted; nothing is polled before that. */
    enabled: boolean;
    /** Called after each round, so the caller can reload its local snapshot. */
    onRound?(snapshot: AcquireRemoteResultSnapshot): void;
    /** Called once per project whose first result was persisted and marked opened. */
    onOpen?(projectId: string): void;
}

/** Foreground-only follow-up of accepted pages: reconciles at once on return to the app, never in background. */
export function useRemoteResultPolling({ enabled, onRound, onOpen }: Options, controller: AcquireRemoteResultController = acquireRemoteResultController) {
    const [snapshot, setSnapshot] = useState<AcquireRemoteResultSnapshot | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const step = useRef(0);
    const lastStages = useRef('');
    const callbacks = useRef({ onRound, onOpen });
    callbacks.current = { onRound, onOpen };

    const clear = () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
    };

    const run = useCallback(
        async (signal: AbortSignal) => {
            clear();
            const result = await controller.sync(signal);
            if (signal.aborted) return;
            setSnapshot(result);
            callbacks.current.onRound?.(result);
            if (result.openProjectId) callbacks.current.onOpen?.(result.openProjectId);
            const stages = result.stages.join(',');
            step.current = stages !== lastStages.current ? 0 : step.current + 1;
            lastStages.current = stages;
            if (result.active > 0 && AppState.currentState === 'active') {
                timer.current = setTimeout(() => void run(signal), nextPollingDelay(step.current));
            }
        },
        [controller],
    );

    useEffect(() => {
        if (!enabled) return undefined;
        const abort = new AbortController();
        step.current = 0;
        void run(abort.signal);
        const subscription = AppState.addEventListener('change', next => {
            if (next === 'active') {
                step.current = 0;
                void run(abort.signal);
            } else {
                clear();
            }
        });
        return () => {
            abort.abort();
            clear();
            subscription.remove();
        };
    }, [enabled, run]);

    return snapshot;
}
