import { type PropsWithChildren, useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
    NunitoSans_400Regular,
    NunitoSans_700Bold,
    NunitoSans_700Bold_Italic,
    NunitoSans_800ExtraBold,
    NunitoSans_800ExtraBold_Italic,
} from '@expo-google-fonts/nunito-sans';

import i18n from '@/src/shared/i18n';
import { useSettingsStore } from '@/src/shared/store';

export function SettingsGate({ children }: PropsWithChildren) {
    const [fontsLoaded, fontError] = useFonts({
        NunitoSans_400Regular,
        NunitoSans_700Bold,
        NunitoSans_700Bold_Italic,
        NunitoSans_800ExtraBold,
        NunitoSans_800ExtraBold_Italic,
    });
    const hydrateSettings = useSettingsStore(state => state.hydrate);
    const isSettingsHydrated = useSettingsStore(state => state.isHydrated);
    const language = useSettingsStore(state => state.language);

    useEffect(() => {
        if (fontError) throw fontError;
    }, [fontError]);

    useEffect(() => {
        void hydrateSettings();
    }, [hydrateSettings]);

    useEffect(() => {
        if (isSettingsHydrated && i18n.language !== language) {
            void i18n.changeLanguage(language);
        }
    }, [isSettingsHydrated, language]);

    useEffect(() => {
        if (fontsLoaded && isSettingsHydrated) {
            void SplashScreen.hideAsync();
        }
    }, [fontsLoaded, isSettingsHydrated]);

    if (!fontsLoaded || !isSettingsHydrated) return null;

    return children;
}
