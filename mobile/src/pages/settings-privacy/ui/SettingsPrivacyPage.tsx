import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/src/entities/session';
import { usePrivacySettingsStore } from '@/src/entities/user';
import { resolveSettingsAccess, SETTINGS_SECTIONS } from '@/src/features/navigate-settings';
import { PrivacyControlsPanel } from '@/src/features/update-privacy';
import { navigateBackOrReplace, ROUTES } from '@/src/shared/navigation';
import { useTheme } from '@/src/shared/theme';
import { Button, ScreenScaffold } from '@/src/shared/ui';

export function SettingsPrivacyPage() {
    const { t } = useTranslation('settingsNavigation');
    const { spacing, tokens } = useTheme();
    const isAuthenticated = useSessionStore(state => state.isAuthenticated);
    const identityEpoch = useSessionStore(state => state.identityEpoch);
    const privacyIdentityEpoch = usePrivacySettingsStore(state => state.identityEpoch);
    const aligned = isAuthenticated && privacyIdentityEpoch === identityEpoch;
    const section = SETTINGS_SECTIONS.find(item => item.id === 'privacy')!;
    const access = resolveSettingsAccess(section, isAuthenticated);

    return (
        <ScreenScaffold
            backLabel={t('actions.back')}
            description={t('sections.privacy.description')}
            onBack={() => navigateBackOrReplace(ROUTES.SETTINGS.INDEX)}
            title={t('sections.privacy.title')}
        >
            {aligned ? (
                <PrivacyControlsPanel />
            ) : access.kind === 'open' ? (
                <Text accessibilityLiveRegion="polite" style={{ color: tokens.muted }}>
                    {t('sync.syncing')}
                </Text>
            ) : (
                <View style={{ gap: spacing.md }}>
                    <Text style={{ color: tokens.muted }}>{t('access.hint')}</Text>
                    <Button onPress={() => router.push({ pathname: ROUTES.AUTH.LOGIN, params: { returnTo: ROUTES.SETTINGS.PRIVACY } } as never)}>
                        {t('actions.login')}
                    </Button>
                </View>
            )}
        </ScreenScaffold>
    );
}
