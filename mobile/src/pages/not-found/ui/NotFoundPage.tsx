import { Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
    const { t } = useTranslation('common');

    return (
        <>
            <Stack.Screen options={{ title: t('notFound.pageTitle') }} />
            <View className="flex-1 items-center justify-center p-5">
                <Text className="text-xl font-bold text-gray-900">{t('notFound.pageTitle')}</Text>
                <Link href="/">
                    <Text className="mt-4 text-sm text-blue-600">{t('notFound.goHome')}</Text>
                </Link>
            </View>
        </>
    );
}
