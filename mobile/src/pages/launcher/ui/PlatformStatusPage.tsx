import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/entities/session';
import { loadCurrentUser, signOut } from '@/features/authenticate';
import { useSettingsStore } from '@/features/manage-settings';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { AppText, Button, Card, NavigationHeader, PageContainer, StatusMessage } from '@/shared/ui';

export function PlatformStatusPage() {
    const { t } = useTranslation('launcher');
    const { layout, spacing } = useTheme();
    const user = useSessionStore(state => state.user);
    const identityEpoch = useSessionStore(state => state.identityEpoch);
    const syncStatus = useSettingsStore(state => state.syncStatus);
    const retry = useSettingsStore(state => state.retry);
    const [accountStatus, setAccountStatus] = useState<'ready' | 'loading' | 'error'>(user ? 'ready' : 'loading');
    const [signingOut, setSigningOut] = useState(false);

    const loadAccount = useCallback(async () => {
        setAccountStatus('loading');
        try {
            const account = await loadCurrentUser(identityEpoch);
            if (!account) return;
            setAccountStatus('ready');
        } catch {
            if (useSessionStore.getState().identityEpoch === identityEpoch) setAccountStatus('error');
        }
    }, [identityEpoch]);

    useEffect(() => {
        if (user) {
            setAccountStatus('ready');
        } else {
            void loadAccount();
        }
    }, [loadAccount, user]);

    // One sign-out at a time, and always back to the start: the local session is cleared even when the server call
    // fails (revisão 2026-11-13).
    const handleLogout = async () => {
        if (signingOut) return;
        setSigningOut(true);
        try {
            await signOut();
        } catch {
            // The session is already cleared locally; nothing else to show on a page that is closing.
        } finally {
            router.replace(ROUTES.ROOT as never);
        }
    };

    return (
        <PageContainer scroll>
            {/* Header outside the section gap: same header rhythm as every screen (revisão 2026-11-14). */}
            <NavigationHeader backLabel={t('navigation.backToSelector')} onBack={() => navigateBackOrReplace(ROUTES.ROOT)} />
            <View style={{ flex: 1, gap: layout.sectionGap, paddingBottom: spacing.xl }}>
                <View style={{ gap: spacing.sm }}>
                    <AppText variant="eyebrow" tone="accent">
                        {t('platform.status')}
                    </AppText>
                    <AppText accessibilityRole="header" variant="display">
                        {t('platform.connectedTitle')}
                    </AppText>
                    <AppText tone="muted">{t('platform.connectedDescription')}</AppText>
                </View>
                <Card>
                    <View style={{ gap: spacing.sm }}>
                        {accountStatus === 'loading' ? <StatusMessage tone="loading" title={t('platform.accountLoading')} /> : null}
                        {accountStatus === 'error' ? (
                            <StatusMessage
                                tone="danger"
                                title={t('platform.accountError')}
                                actionLabel={t('platform.accountRetry')}
                                onAction={() => void loadAccount()}
                            />
                        ) : null}
                        {accountStatus === 'ready' ? (
                            <>
                                <AppText variant="section">{user?.name ?? t('platform.sessionAccount')}</AppText>
                                {user?.email ? <AppText tone="muted">{user.email}</AppText> : null}
                            </>
                        ) : null}
                        <AppText accessibilityLiveRegion="polite" tone={syncStatus === 'error' ? 'danger' : 'subtle'}>
                            {t(`sync.${syncStatus}`)}
                        </AppText>
                        {syncStatus === 'error' ? (
                            <Button onPress={() => void retry()} variant="outline">
                                {t('sync.retry')}
                            </Button>
                        ) : null}
                    </View>
                </Card>
                <Card>
                    <View style={{ gap: spacing.sm }}>
                        <AppText variant="section">{t('platform.constructionTitle')}</AppText>
                        <AppText tone="muted">{t('platform.constructionDescription')}</AppText>
                    </View>
                </Card>
                <View style={{ gap: spacing.xs }}>
                    <Button onPress={() => router.push(ROUTES.SETTINGS.INDEX as never)} variant="outline">
                        {t('selector.settings')}
                    </Button>
                    <Button loading={signingOut} onPress={() => void handleLogout()} tone="danger" variant="outline">
                        {t('platform.logout')}
                    </Button>
                </View>
            </View>
        </PageContainer>
    );
}
