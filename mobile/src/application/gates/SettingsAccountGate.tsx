import { type PropsWithChildren, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/features/manage-settings';
import { StartupFeedback } from '@/shared/ui';

interface SettingsAccountBoundaryProps extends PropsWithChildren {
    identityEpoch: number;
    isAuthenticated: boolean;
}

export function SettingsAccountBoundary({ children, identityEpoch, isAuthenticated }: SettingsAccountBoundaryProps) {
    const activeIdentityEpoch = useSettingsStore(state => state.activeIdentityEpoch);
    const pendingVersion = useSettingsStore(state => state.pendingVersion);
    const syncStatus = useSettingsStore(state => state.syncStatus);
    const { t } = useTranslation('settingsNavigation');

    if (!isAuthenticated) return activeIdentityEpoch === null ? children : <StartupFeedback label={t('sync.syncing')} />;
    if (activeIdentityEpoch !== identityEpoch) return <StartupFeedback label={t('sync.syncing')} />;

    const accountHydrationFailed = syncStatus === 'error' && pendingVersion === null;
    const accountHydrated = syncStatus === 'synced' || pendingVersion !== null;

    if (accountHydrationFailed) return children;

    return accountHydrated ? children : <StartupFeedback label={t('sync.syncing')} />;
}

export function SettingsAccountGate({ children }: PropsWithChildren) {
    const isAuthenticated = useSessionStore(state => state.isAuthenticated);
    const identityEpoch = useSessionStore(state => state.identityEpoch);
    const activateAccount = useSettingsStore(state => state.activateAccount);
    const deactivateAccount = useSettingsStore(state => state.deactivateAccount);
    const flush = useSettingsStore(state => state.flush);

    useEffect(() => {
        if (isAuthenticated) {
            void activateAccount(identityEpoch);
        } else {
            deactivateAccount();
        }
    }, [activateAccount, deactivateAccount, identityEpoch, isAuthenticated]);

    useEffect(
        () => () => {
            void flush();
        },
        [flush],
    );

    return (
        <SettingsAccountBoundary identityEpoch={identityEpoch} isAuthenticated={isAuthenticated}>
            {children}
        </SettingsAccountBoundary>
    );
}
