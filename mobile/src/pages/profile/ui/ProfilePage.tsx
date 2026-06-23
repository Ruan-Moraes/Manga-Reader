import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSessionStore } from '@/src/shared/store';

export function ProfilePage() {
    const { user, logout } = useSessionStore();
    const { t } = useTranslation('common');

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    return (
        <SafeAreaView className="flex-1 bg-mr-bg">
            <View className="flex-1 px-6 pt-8">
                <Text className="text-2xl font-bold text-mr-text">{t('nav.profile')}</Text>
                {user && (
                    <View className="mt-4">
                        <Text className="text-lg font-medium text-mr-text">{user.name}</Text>
                        <Text className="text-mr-muted">{user.email}</Text>
                    </View>
                )}
                <Pressable className="mt-8 items-center rounded-lg border border-mr-danger/30 py-3" onPress={handleLogout}>
                    <Text className="font-semibold text-mr-danger">{t('user.logout')}</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
