import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { authService } from '@/src/features/auth';
import { useSessionStore } from '@/src/shared/store';
import { useTheme } from '@/src/shared/theme';
import { PageContainer } from '@/src/shared/ui';

export function ProfilePage() {
    const { user, logout } = useSessionStore();
    const { t } = useTranslation('common');
    const { tokens } = useTheme();

    const handleLogout = async () => {
        try {
            await authService.logout();
        } finally {
            await logout();
            router.replace('/(auth)/login');
        }
    };

    return (
        <PageContainer>
            <View style={{ flex: 1, paddingHorizontal: 8, paddingTop: 32 }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: tokens.text }}>{t('nav.profile')}</Text>
                {user && (
                    <View style={{ marginTop: 16 }}>
                        <Text style={{ fontSize: 18, fontWeight: '500', color: tokens.text }}>{user.name}</Text>
                        <Text style={{ color: tokens.muted }}>{user.email}</Text>
                    </View>
                )}
                <Pressable
                    style={{ marginTop: 32, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: tokens.danger, paddingVertical: 12 }}
                    onPress={handleLogout}
                >
                    <Text style={{ fontWeight: '600', color: tokens.danger }}>{t('user.logout')}</Text>
                </Pressable>
            </View>
        </PageContainer>
    );
}
