import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { isAmbiguousRemoteAttempt } from '@/entities/remote-processing-attempt';
import { getCurrentLanguage } from '@/shared/i18n';

import { type RemoteProcessingSnapshot, type StartRemoteProcessingController, startRemoteProcessingController } from './startRemoteProcessing';

const EMPTY: RemoteProcessingSnapshot = { project: null, capabilities: null, attempt: null, error: null };

export function useStartRemoteProcessing(controller: StartRemoteProcessingController = startRemoteProcessingController) {
    const [state, setState] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const mounted = useRef(false);
    const generation = useRef(0);
    const active = useRef<AbortController | null>(null);
    const deliveredAttempt = useRef<string | null>(null);

    const discardPending = useCallback(() => {
        const id = deliveredAttempt.current;
        if (!id) return;
        deliveredAttempt.current = null;
        const owner = generation.current;
        void controller
            .interrupt(id)
            .then(next => {
                if (mounted.current && generation.current === owner)
                    setState(current => ({ ...next, capabilities: next.capabilities ?? current.capabilities }));
            })
            .catch(() => {
                if (mounted.current && generation.current === owner) setState(current => ({ ...current, error: 'storage-unavailable' }));
            });
    }, [controller]);
    const interrupt = useCallback(() => {
        active.current?.abort();
        discardPending();
    }, [discardPending]);

    useEffect(() => {
        mounted.current = true;
        const owner = ++generation.current;
        setLoading(true);
        const abort = new AbortController();
        void controller
            .initialize(abort.signal)
            .then(async result => {
                if (abort.signal.aborted) return;
                const next = result.attempt && isAmbiguousRemoteAttempt(result.attempt) ? await controller.reconcile(abort.signal) : result;
                if (!abort.signal.aborted) setState(next);
            })
            .catch(() => {
                if (!abort.signal.aborted) setState({ ...EMPTY, error: 'capabilities-unavailable' });
            })
            .finally(() => {
                if (!abort.signal.aborted) setLoading(false);
            });
        return () => {
            mounted.current = false;
            generation.current = owner + 1;
            abort.abort();
            interrupt();
        };
    }, [controller, interrupt]);

    const run = useCallback(
        async (work: (signal: AbortSignal) => Promise<RemoteProcessingSnapshot>, ownsDelivery = false) => {
            if (active.current) return;
            const abort = new AbortController();
            const owner = generation.current;
            active.current = abort;
            setBusy(true);
            try {
                const next = await work(abort.signal);
                if (ownsDelivery && next.attempt?.status === 'ACCEPTED' && next.attempt.gatewayContractVersion === '2.0') {
                    if (abort.signal.aborted || !mounted.current || generation.current !== owner) {
                        await controller.interrupt(next.attempt.id);
                        return;
                    }
                    deliveredAttempt.current = next.attempt.id;
                }
                if (mounted.current && generation.current === owner) setState(next);
            } catch {
                if (mounted.current && generation.current === owner) setState(current => ({ ...current, error: 'submission-unknown' }));
            } finally {
                if (active.current === abort) {
                    active.current = null;
                    if (mounted.current) setBusy(false);
                }
            }
        },
        [controller],
    );

    const acceptAndSubmit = useCallback(async () => {
        const project = state.project,
            capabilities = state.capabilities;
        if (!project || !capabilities) return;
        await run(async signal => {
            await controller.acceptConsent(project.id, capabilities, getCurrentLanguage());
            if (signal.aborted) return { project, capabilities, attempt: state.attempt, error: 'cancellation-unavailable' };
            return controller.submit(project.id, signal);
        }, true);
    }, [controller, run, state.attempt, state.capabilities, state.project]);

    const reconcile = useCallback(() => run(signal => controller.reconcile(signal)), [controller, run]);
    const retry = useCallback(async () => {
        const project = state.project;
        if (project) await run(signal => controller.submit(project.id, signal), true);
    }, [controller, run, state.project]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', next => {
            if (next !== 'active') interrupt();
            else if (state.attempt && isAmbiguousRemoteAttempt(state.attempt)) void reconcile();
        });
        return () => subscription.remove();
    }, [interrupt, reconcile, state.attempt]);

    return { ...state, loading, busy, acceptAndSubmit, retry, reconcile, interrupt };
}
