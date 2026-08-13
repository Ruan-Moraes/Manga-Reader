import { View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/shared/theme';
import { AppText, PageContainer } from '@/src/shared/ui';

export function NotFoundPage() {
    const { t } = useTranslation('common');
    const { minimumTouchTarget, spacing } = useTheme();

    return (
        <>
            <Stack.Screen options={{ title: t('notFound.pageTitle') }} />
            <PageContainer>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
                    <AppText variant="section">{t('notFound.pageTitle')}</AppText>
                    <Link href="/" style={{ minHeight: minimumTouchTarget, justifyContent: 'center', marginTop: spacing.md }}>
                        <AppText variant="label" tone="accent">
                            {t('notFound.goHome')}
                        </AppText>
                    </Link>
                </View>
            </PageContainer>
        </>
    );
}
