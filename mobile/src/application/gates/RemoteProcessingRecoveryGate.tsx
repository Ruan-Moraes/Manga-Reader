import { type PropsWithChildren, useCallback, useEffect } from 'react';
import { AppState } from 'react-native';

import { remoteProcessingAttemptRepository } from '@/entities/remote-processing-attempt';
import { startRemoteProcessingController } from '@/features/start-remote-processing';

export function RemoteProcessingRecoveryGate({ children }: PropsWithChildren) {
    const recover = useCallback(async () => {
        await remoteProcessingAttemptRepository.initialize();
        if ((await remoteProcessingAttemptRepository.listRecoverable()).length > 0) {
            await startRemoteProcessingController.reconcile();
        }
    }, []);

    useEffect(() => {
        void recover().catch(() => undefined);
        const subscription = AppState.addEventListener('change', state => {
            if (state === 'active') void recover().catch(() => undefined);
        });
        return () => subscription.remove();
    }, [recover]);

    return children;
}
