import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/src/entities/session';
import { signOut } from '@/src/features/authenticate';
import { ROUTES } from '@/src/shared/navigation';
import { useTheme } from '@/src/shared/theme';
import { AppText, Button, PageContainer } from '@/src/shared/ui';
import { SettingsIndex, SettingsSections } from '@/src/widgets/settings-index';

export function ProfilePage() {
    const user = useSessionStore(state => state.user);
    const { t } = useTranslation('common');
    const { t: tSettings } = useTranslation('settingsNavigation');
    const { spacing, tokens, typography } = useTheme();

    const handleLogout = async () => {
        await signOut();
        router.replace(ROUTES.ROOT as never);
    };

    return (
        <PageContainer scroll>
            <View style={{ flex: 1, paddingHorizontal: spacing.sm, paddingTop: spacing.xl }}>
                <AppText accessibilityRole="header" variant="title">
                    {t('nav.profile')}
                </AppText>
                {user && (
                    <View style={{ marginTop: spacing.md }}>
                        <Text style={{ fontSize: typography.h3, fontWeight: '500', color: tokens.text }}>{user.name}</Text>
                        <Text style={{ color: tokens.muted, fontSize: typography.body }}>{user.email}</Text>
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
                                    statusLabel: tSettings('actions.open', { section: tSettings('index.title') }),
                                    loginRequired: false,
                                    onPress: () => router.push(ROUTES.SETTINGS.INDEX as never),
                                },
                            ]}
                            loginRequiredLabel={tSettings('access.loginRequired')}
                            openHint={tSettings('actions.open', { section: tSettings('index.title') })}
                        />
                    </SettingsSections>
                </View>
                <View style={{ marginTop: spacing.xl }}>
                    <Button onPress={handleLogout} tone="danger" variant="outline">
                        {t('user.logout')}
                    </Button>
                </View>
            </View>
        </PageContainer>
    );
}
