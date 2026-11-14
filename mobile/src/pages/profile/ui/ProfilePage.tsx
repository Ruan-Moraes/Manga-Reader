import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/entities/session';
import { signOut } from '@/features/authenticate';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { AppText, Button, NavigationHeader, PageContainer } from '@/shared/ui';
import { SettingsIndex, SettingsSections } from '@/widgets/settings-index';

export function ProfilePage() {
    const user = useSessionStore(state => state.user);
    const { t } = useTranslation('common');
    const { t: tSettings } = useTranslation('settingsNavigation');
    const { spacing } = useTheme();
    const [signingOut, setSigningOut] = useState(false);

    // One sign-out at a time, and always back to the start (revisão 2026-11-13, same as the platform status page).
    const handleLogout = async () => {
        if (signingOut) return;
        setSigningOut(true);
        try {
            await signOut();
        } catch {
            // The session is already cleared locally.
        } finally {
            router.replace(ROUTES.ROOT as never);
        }
    };

    return (
        <PageContainer scroll>
            <View style={{ alignSelf: 'center', flex: 1, maxWidth: 720, width: '100%' }}>
                <NavigationHeader backLabel={tSettings('actions.back')} onBack={() => navigateBackOrReplace(ROUTES.ROOT)} />
                <AppText accessibilityRole="header" variant="title">
                    {t('nav.profile')}
                </AppText>
                {user && (
                    <View style={{ marginTop: spacing.md }}>
                        {/* App typeface instead of raw Text (revisão 2026-11-13). */}
                        <AppText variant="section">{user.name}</AppText>
                        <AppText tone="muted">{user.email}</AppText>
                    </View>
                )}
                <View style={{ marginTop: spacing.xl }}>
                    <SettingsSections>
                        <SettingsIndex
                            items={[
                                {
                                    id: 'settings',
                                    title: tSettings('index.title'),
                                    description: tSettings('index.subtitle'),
                                    loginRequired: false,
                                    onPress: () => router.push(ROUTES.SETTINGS.INDEX as never),
                                },
                            ]}
                            loginRequiredLabel={tSettings('access.loginRequired')}
                            openHint={title => tSettings('actions.open', { section: title })}
                        />
                    </SettingsSections>
                </View>
                <View style={{ marginTop: spacing.xl }}>
                    <Button loading={signingOut} onPress={() => void handleLogout()} tone="danger" variant="outline">
                        {t('user.logout')}
                    </Button>
                </View>
            </View>
        </PageContainer>
    );
}
