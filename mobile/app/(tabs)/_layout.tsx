import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, color }: { name: IoniconName; color: string }) {
    return <Ionicons name={name} size={24} color={color} />;
}

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#ddda2a',
                tabBarInactiveTintColor: '#727273',
                tabBarStyle: { backgroundColor: '#252526', borderTopColor: '#242424' },
                headerShown: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Início',
                    tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
                }}
            />
            <Tabs.Screen
                name="library"
                options={{
                    title: 'Biblioteca',
                    tabBarIcon: ({ color }) => <TabIcon name="library" color={color} />,
                }}
            />
            <Tabs.Screen
                name="forum"
                options={{
                    title: 'Fórum',
                    tabBarIcon: ({ color }) => <TabIcon name="chatbubbles" color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color }) => <TabIcon name="person" color={color} />,
                }}
            />
        </Tabs>
    );
}
