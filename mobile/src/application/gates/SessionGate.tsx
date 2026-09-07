import { type PropsWithChildren, useEffect, useRef, useState } from 'react';
import { useGlobalSearchParams, useRouter, useSegments } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/entities/session';
import { clearExpiredSession, restoreSession } from '@/features/authenticate';
import { subscribeAuthExpired } from '@/shared/api';
import { parseAuthReturnRoute, ROUTES } from '@/shared/navigation';
import { StartupFeedback } from '@/shared/ui';

export function SessionGate({ children }: PropsWithChildren) {
    const isAuthenticated = useSessionStore(state => state.isAuthenticated);
    const identityEpoch = useSessionStore(state => state.identityEpoch);
    const [isHydrated, setIsHydrated] = useState(false);
    const segments = useSegments();
    const params = useGlobalSearchParams<{ returnTo?: string | string[] }>();
    const router = useRouter();
    const { t } = useTranslation('launcher');
    const consumedReturnTo = useRef<{ identityEpoch: number; route: string } | null>(null);

    useEffect(() => {
        void restoreSession().finally(() => setIsHydrated(true));
    }, []);

    useEffect(
        () =>
            subscribeAuthExpired(() => {
                void clearExpiredSession().finally(() => router.replace(ROUTES.ROOT as never));
            }),
        [router],
    );

    useEffect(() => {
        if (!isHydrated) return;

        const first = segments[0] as string | undefined;
        const second = segments[1] as string | undefined;
        const inAuthGroup = first === '(auth)';
        const inSettingsGroup = first === 'settings';
        const inOfflineTranslation = first === 'offline-translation';
        const inReader = first === 'reader';
        const atRoot = first === undefined || first === 'index';
        const inNotFound = first === '+not-found';
        const inPlatform = first === 'platform';
        const inPlatformTabs = inPlatform && (second === '(tabs)' || segments.includes('(tabs)' as never));

        if (!isAuthenticated) {
            if (inPlatform) {
                router.replace({ pathname: ROUTES.AUTH.LOGIN, params: { returnTo: ROUTES.PLATFORM.STATUS } } as never);
            } else if (!inAuthGroup && !inSettingsGroup && !inOfflineTranslation && !inReader && !atRoot && !inNotFound) {
                router.replace(ROUTES.AUTH.LOGIN as never);
            }
            return;
        }

        if (inAuthGroup) {
            const returnTo = parseAuthReturnRoute(params.returnTo) ?? ROUTES.PLATFORM.STATUS;
            const alreadyConsumed = consumedReturnTo.current?.identityEpoch === identityEpoch && consumedReturnTo.current.route === returnTo;
            if (!alreadyConsumed) {
                consumedReturnTo.current = { identityEpoch, route: returnTo };
                router.replace(returnTo as never);
            }
        } else if (inPlatformTabs) {
            router.replace(ROUTES.PLATFORM.STATUS as never);
        }
    }, [identityEpoch, isAuthenticated, isHydrated, params.returnTo, router, segments]);

    if (!isHydrated) return <StartupFeedback label={t('startup.session')} />;

    return children;
}
