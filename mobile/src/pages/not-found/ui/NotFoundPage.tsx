import { Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/shared/theme';
import { PageContainer } from '@/src/shared/ui';

export function NotFoundPage() {
    const { t } = useTranslation('common');
    const { tokens } = useTheme();

    return (
        <>
            <Stack.Screen options={{ title: t('notFound.pageTitle') }} />
            <PageContainer>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <Text style={{ fontSize: 20, fontWeight: '700', color: tokens.text }}>{t('notFound.pageTitle')}</Text>
                    <Link href="/">
                        <Text style={{ marginTop: 16, fontSize: 14, color: tokens.accentText }}>{t('notFound.goHome')}</Text>
                    </Link>
                </View>
            </PageContainer>
        </>
    );
}
