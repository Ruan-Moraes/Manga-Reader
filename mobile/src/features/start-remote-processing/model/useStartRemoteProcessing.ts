import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { isAmbiguousRemoteAttempt } from '@/entities/remote-processing-attempt';
import { getCurrentLanguage } from '@/shared/i18n';

import { type RemoteProcessingSnapshot, type StartRemoteProcessingController, startRemoteProcessingController } from './startRemoteProcessing';

const EMPTY: RemoteProcessingSnapshot = { project: null, capabilities: null, attempt: null, error: null, pages: [], pausedUntil: null };
/** Longest a single timer waits for the quota to renew (setTimeout's limit); the foreground check covers the rest. */
const MAX_TIMER_MS = 2_147_483_647;

export function useStartRemoteProcessing(controller: StartRemoteProcessingController = startRemoteProcessingController) {
    const [state, setState] = useState(EMPTY);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const advancing = useRef(false);

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

    const retryPage = useCallback(
        async (pageId: string) => {
            if (!state.project || busy) return;
            setBusy(true);
            try {
                setState(await controller.retryPage(state.project.id, pageId));
            } finally {
                setBusy(false);
            }
        },
        [busy, controller, state.project],
    );

    const reconcile = useCallback(async () => {
        if (busy) return;
        setBusy(true);
        try {
            setState(await controller.reconcile());
        } finally {
            setBusy(false);
        }
    }, [busy, controller]);

    const refresh = useCallback(async () => {
        setState(await controller.refresh());
    }, [controller]);

    const projectId = state.project?.id;
    const started = state.project?.status === 'QUEUED' || state.project?.status === 'PROCESSING';

    /** Sends the next page when the queue allows; silent: a started project already has consent. */
    const advance = useCallback(async () => {
        if (!projectId || !started || advancing.current) return;
        advancing.current = true;
        try {
            const result = await controller.submit(projectId);
            setState(result.error === 'consent-required' ? { ...result, error: null } : result);
        } finally {
            advancing.current = false;
        }
    }, [controller, projectId, started]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', next => {
            if (next !== 'active') return;
            if (state.attempt && isAmbiguousRemoteAttempt(state.attempt)) void reconcile();
            else void advance();
        });
        return () => subscription.remove();
    }, [advance, reconcile, state.attempt]);

    // A queue paused by the daily quota resumes by itself once it renews, while the app stays open.
    useEffect(() => {
        if (state.pausedUntil === null) return undefined;
        const timer = setTimeout(() => void advance(), Math.min(Math.max(0, state.pausedUntil - Date.now()) + 1_000, MAX_TIMER_MS));
        return () => clearTimeout(timer);
    }, [advance, state.pausedUntil]);

    return { ...state, loading, busy, acceptAndSubmit, retry, retryPage, reconcile, refresh, advance };
}
