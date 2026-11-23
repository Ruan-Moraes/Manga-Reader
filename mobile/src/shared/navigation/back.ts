import { router } from 'expo-router';

export function navigateBackOrReplace(fallback: string) {
    if (router.canGoBack()) {
        router.back();
        return;
    }
    router.replace(fallback as never);
}
