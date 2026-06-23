import { type PropsWithChildren, useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';

import { subscribeAuthExpired } from '@/src/shared/api';
import { useSessionStore } from '@/src/shared/store';

export function SessionGate({ children }: PropsWithChildren) {
    const isAuthenticated = useSessionStore(state => state.isAuthenticated);
    const hydrate = useSessionStore(state => state.hydrate);
    const [isHydrated, setIsHydrated] = useState(false);
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        hydrate().then(() => setIsHydrated(true));
    }, [hydrate]);

    useEffect(
        () =>
            subscribeAuthExpired(() => {
                void useSessionStore.getState().logout();
            }),
        [],
    );

    useEffect(() => {
        if (!isHydrated) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!isAuthenticated && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (isAuthenticated && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, isHydrated, router, segments]);

    if (!isHydrated) return null;

    return children;
}
