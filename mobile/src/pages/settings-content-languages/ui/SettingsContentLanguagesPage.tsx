import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/src/entities/session';
import { ContentLanguagesEditor, useContentLanguagesStore } from '@/src/features/manage-content-languages';
import { resolveSettingsAccess, SETTINGS_SECTIONS } from '@/src/features/navigate-settings';
import { navigateBackOrReplace, ROUTES } from '@/src/shared/navigation';
import { useTheme } from '@/src/shared/theme';
import { Button, ScreenScaffold } from '@/src/shared/ui';

export function SettingsContentLanguagesPage() {
    const { t } = useTranslation('settingsNavigation');
    const { spacing, tokens } = useTheme();
    const isAuthenticated = useSessionStore(state => state.isAuthenticated);
    const identityEpoch = useSessionStore(state => state.identityEpoch);
    const contentIdentityEpoch = useContentLanguagesStore(state => state.identityEpoch);
    const aligned = isAuthenticated && contentIdentityEpoch === identityEpoch;
    const section = SETTINGS_SECTIONS.find(item => item.id === 'content-languages')!;
    const access = resolveSettingsAccess(section, isAuthenticated);

    return (
        <ScreenScaffold
            backLabel={t('actions.back')}
            description={t('sections.contentLanguages.description')}
            onBack={() => navigateBackOrReplace(ROUTES.SETTINGS.INDEX)}
            title={t('sections.contentLanguages.title')}
        >
            {aligned ? (
                <ContentLanguagesEditor />
            ) : access.kind === 'open' ? (
                <Text accessibilityLiveRegion="polite" style={{ color: tokens.muted }}>
                    {t('sync.syncing')}
                </Text>
            ) : (
                <View style={{ gap: spacing.md }}>
                    <Text style={{ color: tokens.muted }}>{t('access.hint')}</Text>
                    <Button onPress={() => router.push({ pathname: ROUTES.AUTH.LOGIN, params: { returnTo: ROUTES.SETTINGS.CONTENT_LANGUAGES } } as never)}>
                        {t('actions.login')}
                    </Button>
                </View>
            )}
        </ScreenScaffold>
    );
}
