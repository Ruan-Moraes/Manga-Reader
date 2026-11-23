import { type PropsWithChildren, useEffect } from 'react';

import { recoverLocalTranslationDataController } from '@/features/local-translation';

export function LocalTranslationRecoveryGate({ children }: PropsWithChildren) {
    useEffect(() => {
        void recoverLocalTranslationDataController.recover().catch(() => undefined);
    }, []);

    return children;
}
