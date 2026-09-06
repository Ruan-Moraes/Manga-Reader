import { type PropsWithChildren, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useSessionStore } from '@/entities/session';
import { usePrivacySettingsStore } from '@/entities/user';
import { hydratePrivacy, privacySessionQueryKeys, resetPrivacyHydration, resetPrivacyMutationRuntime } from '@/features/update-privacy';

export function PrivacyAccountGate({ children }: PropsWithChildren) {
    const isAuthenticated = useSessionStore(state => state.isAuthenticated);
    const identityEpoch = useSessionStore(state => state.identityEpoch);
    const queryClient = useQueryClient();

    useEffect(() => {
        resetPrivacyMutationRuntime();
        resetPrivacyHydration();
        usePrivacySettingsStore.getState().beginIdentity(isAuthenticated ? identityEpoch : null);
        privacySessionQueryKeys().forEach(queryKey => queryClient.removeQueries({ queryKey, exact: false }));
        if (isAuthenticated) void hydratePrivacy(identityEpoch);
    }, [identityEpoch, isAuthenticated, queryClient]);

    return children;
}
