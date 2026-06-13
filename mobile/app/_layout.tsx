import '../global.css';
import {
    NunitoSans_400Regular,
    NunitoSans_700Bold,
    NunitoSans_700Bold_Italic,
    NunitoSans_800ExtraBold,
    NunitoSans_800ExtraBold_Italic,
} from '@expo-google-fonts/nunito-sans';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/stores/authStore';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: 1, staleTime: 5 * 60 * 1000 },
    },
});

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
    initialRouteName: '(tabs)',
};

export default function RootLayout() {
    const [loaded, error] = useFonts({
        NunitoSans_400Regular,
        NunitoSans_700Bold,
        NunitoSans_700Bold_Italic,
        NunitoSans_800ExtraBold,
        NunitoSans_800ExtraBold_Italic,
    });

    useEffect(() => {
        if (error) throw error;
    }, [error]);

    useEffect(() => {
        if (loaded) SplashScreen.hideAsync();
    }, [loaded]);

    if (!loaded) return null;

    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <RootLayoutNav />
            </QueryClientProvider>
        </SafeAreaProvider>
    );
}

function RootLayoutNav() {
    const isAuthenticated = useAuthStore(s => s.isAuthenticated);
    const hydrate = useAuthStore(s => s.hydrate);
    const [isHydrated, setIsHydrated] = useState(false);
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        hydrate().then(() => setIsHydrated(true));
    }, []);

    useEffect(() => {
        if (!isHydrated) return;
        const inAuthGroup = segments[0] === '(auth)';
        if (!isAuthenticated && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (isAuthenticated && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [isAuthenticated, isHydrated, segments]);

    if (!isHydrated) return null;

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="+not-found" />
        </Stack>
    );
}
