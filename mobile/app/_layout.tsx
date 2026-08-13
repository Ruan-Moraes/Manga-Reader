import * as SplashScreen from 'expo-splash-screen';

import { RootApplication } from '@/src/application';

import '../global.css';
import '@/src/shared/i18n';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
    initialRouteName: 'index',
};

export default function RootLayout() {
    return <RootApplication />;
}
