import * as SplashScreen from 'expo-splash-screen';

import { RootApplication } from '@/application';

import '../../global.css';
import '@/shared/i18n';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
    initialRouteName: 'index',
};

export default function RootLayout() {
    return <RootApplication />;
}
