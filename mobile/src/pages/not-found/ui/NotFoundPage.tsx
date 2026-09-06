import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { useTheme } from '@/shared/theme';
import { AppText, Button, ScreenScaffold } from '@/shared/ui';

export function NotFoundPage() {
    const { t } = useTranslation('common');
    const { spacing } = useTheme();

    return (
        <>
            <Stack.Screen options={{ title: t('notFound.pageTitle') }} />
            <ScreenScaffold compact backLabel={t('navigation.back')} onBack={() => navigateBackOrReplace(ROUTES.ROOT)} title={t('notFound.pageTitle')}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
                    <AppText tone="muted">{t('notFound.pageDesc')}</AppText>
                    <Button onPress={() => navigateBackOrReplace(ROUTES.ROOT)}>{t('notFound.goHome')}</Button>
                </View>
            </ScreenScaffold>
        </>
    );
}
