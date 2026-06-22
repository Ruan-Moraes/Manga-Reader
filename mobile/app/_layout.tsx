import * as SplashScreen from 'expo-splash-screen';

import { SessionGate, SettingsGate } from '@/src/application/gates';
import { RootNavigator } from '@/src/application/navigation';
import { AppProviders } from '@/src/application/providers';

import '../global.css';
import '@/src/shared/i18n';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
    initialRouteName: '(tabs)',
};

export default function RootLayout() {
    return (
        <SettingsGate>
            <AppProviders>
                <SessionGate>
                    <RootNavigator />
                </SessionGate>
            </AppProviders>
        </SettingsGate>
    );
}
