import { type PropsWithChildren, useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { remoteProcessingAttemptRepository } from '@/entities/remote-processing-attempt';
import { startRemoteProcessingController } from '@/features/start-remote-processing';

export function RemoteProcessingRecoveryGate({ children }: PropsWithChildren) {
    const active = useRef<AbortController | null>(null);
    const recover = useCallback(async () => {
        if (active.current) return;
        const abort = new AbortController();
        active.current = abort;
        try {
            await remoteProcessingAttemptRepository.initialize();
            if (!abort.signal.aborted && (await remoteProcessingAttemptRepository.listRecoverable()).length > 0 && !abort.signal.aborted) {
                await startRemoteProcessingController.reconcile(abort.signal);
            }
        } finally {
            if (active.current === abort) active.current = null;
        }
    }, []);

    useEffect(() => {
        void recover().catch(() => undefined);
        const subscription = AppState.addEventListener('change', state => {
            if (state === 'active') void recover().catch(() => undefined);
            else active.current?.abort();
        });
        return () => {
            active.current?.abort();
            subscription.remove();
        };
    }, [recover]);

    return children;
}
