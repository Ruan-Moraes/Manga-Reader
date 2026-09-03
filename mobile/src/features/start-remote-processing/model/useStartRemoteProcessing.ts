import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { isAmbiguousRemoteAttempt } from '@/src/entities/remote-processing-attempt';
import { getCurrentLanguage } from '@/src/shared/i18n';

import { type RemoteProcessingSnapshot, type StartRemoteProcessingController, startRemoteProcessingController } from './startRemoteProcessing';

const EMPTY: RemoteProcessingSnapshot = { project: null, capabilities: null, attempt: null, error: null };

export function useStartRemoteProcessing(controller: StartRemoteProcessingController = startRemoteProcessingController) {
    const [state, setState] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const abort = new AbortController();
        void controller
            .initialize(abort.signal)
            .then(async result => {
                setState(result);
                if (result.attempt && isAmbiguousRemoteAttempt(result.attempt)) setState(await controller.reconcile(abort.signal));
            })
            .finally(() => setLoading(false));
        return () => abort.abort();
    }, [controller]);

    const acceptAndSubmit = useCallback(async () => {
        if (!state.project || !state.capabilities || busy) return;
        setBusy(true);
        try {
            await controller.acceptConsent(state.project.id, state.capabilities, getCurrentLanguage());
            setState(await controller.submit(state.project.id));
        } finally {
            setBusy(false);
        }
    }, [busy, controller, state.capabilities, state.project]);

    const retry = useCallback(async () => {
        if (!state.project || busy) return;
        setBusy(true);
        try {
            setState(await controller.submit(state.project.id));
        } finally {
            setBusy(false);
        }
    }, [busy, controller, state.project]);

    const reconcile = useCallback(async () => {
        if (busy) return;
        setBusy(true);
        try {
            setState(await controller.reconcile());
        } finally {
            setBusy(false);
        }
    }, [busy, controller]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', next => {
            if (next === 'active' && state.attempt && isAmbiguousRemoteAttempt(state.attempt)) void reconcile();
        });
        return () => subscription.remove();
    }, [reconcile, state.attempt]);

    return { ...state, loading, busy, acceptAndSubmit, retry, reconcile };
}
