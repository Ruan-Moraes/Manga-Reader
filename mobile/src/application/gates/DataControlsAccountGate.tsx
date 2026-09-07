import { type PropsWithChildren, useEffect } from 'react';

import { useSessionStore } from '@/entities/session';
import { clearDataControlTemporaries } from '@/features/data-controls';

export function DataControlsAccountGate({ children }: PropsWithChildren) {
    const identityEpoch = useSessionStore(state => state.identityEpoch);

    useEffect(() => {
        void clearDataControlTemporaries().catch(() => undefined);
    }, [identityEpoch]);

    return children;
}
