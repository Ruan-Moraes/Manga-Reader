import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/shared/theme';
import { Icon, type IconName } from '@/src/shared/ui';

function TabIcon({ name, color }: { name: IconName; color: string }) {
    return <Icon name={name} size={24} color={color} />;
}

export default function TabLayout() {
    const { tokens } = useTheme();
    const { t } = useTranslation('common');

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: tokens.accent,
                tabBarInactiveTintColor: tokens.tertiary,
                tabBarStyle: { backgroundColor: tokens.surface, borderTopColor: tokens.separator },
                sceneStyle: { backgroundColor: tokens.bg },
                headerShown: false,
            }}
        >
            <Tabs.Screen name="index" options={{ title: t('nav.home'), tabBarIcon: ({ color }) => <TabIcon name="home" color={color} /> }} />
            <Tabs.Screen name="library" options={{ title: t('nav.library'), tabBarIcon: ({ color }) => <TabIcon name="library" color={color} /> }} />
            <Tabs.Screen name="forum" options={{ title: t('nav.forum'), tabBarIcon: ({ color }) => <TabIcon name="chatbubbles" color={color} /> }} />
            <Tabs.Screen name="profile" options={{ title: t('nav.profile'), tabBarIcon: ({ color }) => <TabIcon name="person" color={color} /> }} />
        </Tabs>
    );
}
