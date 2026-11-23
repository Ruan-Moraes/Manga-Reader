import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
    type AcquireRemoteTranslationResultController,
    acquireRemoteTranslationResultController,
    type AcquisitionSnapshot,
} from './acquireRemoteTranslationResult';

export function useAcquireRemoteTranslationResult(
    attemptId: string | null,
    controller: AcquireRemoteTranslationResultController = acquireRemoteTranslationResultController,
    onReady?: (projectId: string) => void,
) {
    const [snapshot, setSnapshot] = useState<{ attemptId: string; value: AcquisitionSnapshot } | null>(null);
    const callback = useRef(onReady);
    useEffect(() => {
        callback.current = onReady;
    }, [onReady]);
    useEffect(() => {
        if (!attemptId) return;
        let disposed = false,
            owner: AbortController | null = null,
            timer: ReturnType<typeof setTimeout> | null = null,
            delay = 1000,
            confirmedStage = -1;
        const stop = () => {
            if (timer) clearTimeout(timer);
            timer = null;
            owner?.abort();
            owner = null;
        };
        const start = () => {
            stop();
            if (disposed) return;
            const current = new AbortController();
            owner = current;
            setSnapshot({ attemptId, value: { status: 'waiting', stage: confirmedStage, projectId: null, pageId: null, error: null } });
            const cycle = async () => {
                try {
                    const result = await controller.run(attemptId, current.signal, progress => {
                        if (disposed || current.signal.aborted) return;
                        confirmedStage = Math.max(confirmedStage, progress.stage);
                        setSnapshot({ attemptId, value: { ...progress, stage: confirmedStage } });
                    });
                    if (disposed || current.signal.aborted) return;
                    confirmedStage = Math.max(confirmedStage, result.stage);
                    setSnapshot({ attemptId, value: { ...result, stage: confirmedStage } });
                    if (result.status === 'ready') {
                        if (
                            result.pageId &&
                            result.projectId &&
                            (await controller.claimOpen(result.pageId, current.signal)) &&
                            !current.signal.aborted &&
                            !disposed
                        )
                            callback.current?.(result.projectId);
                        return;
                    }
                    if (result.status !== 'waiting') return;
                } catch {
                    if (disposed || current.signal.aborted) return;
                    setSnapshot({
                        attemptId,
                        value: { status: 'waiting', stage: confirmedStage, error: 'localTranslation.storageUnavailable', projectId: null, pageId: null },
                    });
                }
                if (!disposed && !current.signal.aborted) {
                    timer = setTimeout(() => void cycle(), delay);
                    delay = Math.min(delay * 2, 30000);
                }
            };
            void cycle();
        };
        const subscription = AppState.addEventListener('change', state => {
            if (state === 'active') {
                delay = 1000;
                start();
            } else stop();
        });
        if (AppState.currentState !== 'background' && AppState.currentState !== 'inactive') start();
        return () => {
            disposed = true;
            stop();
            subscription.remove();
        };
    }, [attemptId, controller]);
    return snapshot?.attemptId === attemptId ? snapshot.value : null;
}
