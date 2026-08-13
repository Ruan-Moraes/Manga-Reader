import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/src/entities/session';
import { loadCurrentUser, signOut } from '@/src/features/authenticate';
import { useSettingsStore } from '@/src/features/manage-settings';
import { ROUTES } from '@/src/shared/navigation';
import { useTheme } from '@/src/shared/theme';
import { AppText, Button, Card, PageContainer } from '@/src/shared/ui';

export function PlatformStatusPage() {
    const { t } = useTranslation('launcher');
    const { layout, spacing, tokens } = useTheme();
    const user = useSessionStore(state => state.user);
    const identityEpoch = useSessionStore(state => state.identityEpoch);
    const syncStatus = useSettingsStore(state => state.syncStatus);
    const retry = useSettingsStore(state => state.retry);
    const [accountStatus, setAccountStatus] = useState<'ready' | 'loading' | 'error'>(user ? 'ready' : 'loading');

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

    const handleLogout = async () => {
        await signOut();
        router.replace(ROUTES.ROOT as never);
    };

    return (
        <PageContainer scroll>
            <View style={{ flex: 1, gap: layout.sectionGap, paddingBottom: spacing.xl, paddingTop: spacing.xl }}>
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
                        {accountStatus === 'loading' ? <Text style={{ color: tokens.muted }}>{t('platform.accountLoading')}</Text> : null}
                        {accountStatus === 'error' ? (
                            <View accessibilityLiveRegion="assertive" style={{ gap: spacing.sm }}>
                                <Text accessibilityRole="alert" style={{ color: tokens.danger }}>
                                    {t('platform.accountError')}
                                </Text>
                                <Button onPress={() => void loadAccount()} variant="outline">
                                    {t('platform.accountRetry')}
                                </Button>
                            </View>
                        ) : null}
                        {accountStatus === 'ready' ? (
                            <>
                                <AppText variant="section">{user?.name ?? t('platform.sessionAccount')}</AppText>
                                {user?.email ? <AppText tone="muted">{user.email}</AppText> : null}
                            </>
                        ) : null}
                        <Text accessibilityLiveRegion="polite" style={{ color: syncStatus === 'error' ? tokens.danger : tokens.subtle }}>
                            {t(`sync.${syncStatus}`)}
                        </Text>
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
                <Button onPress={() => router.push(ROUTES.SETTINGS.INDEX as never)} variant="outline">
                    {t('selector.settings')}
                </Button>
                <Button onPress={() => router.replace(ROUTES.ROOT as never)} variant="ghost">
                    {t('navigation.backToSelector')}
                </Button>
                <Button onPress={() => void handleLogout()} tone="danger" variant="outline">
                    {t('platform.logout')}
                </Button>
            </View>
        </PageContainer>
    );
}
