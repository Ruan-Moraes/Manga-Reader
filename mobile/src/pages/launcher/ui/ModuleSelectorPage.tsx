import { useState } from 'react';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/entities/session';
import { useSettingsStore } from '@/features/manage-settings';
import { ROUTES } from '@/shared/navigation';
import { AppText, BottomSheet, Button, PageContainer } from '@/shared/ui';

import type { AppModuleId } from '../model/modules';
import { ModuleSelector } from './ModuleSelector';

export function ModuleSelectorPage() {
    const { t } = useTranslation('launcher');

    const authenticated = useSessionStore(state => state.isAuthenticated);
    const localError = useSettingsStore(state => state.localError);
    const retryLocalHydration = useSettingsStore(state => state.retryLocalHydration);

    const [platformSheetOpen, setPlatformSheetOpen] = useState(false);

    const openModule = (module: AppModuleId) => {
        if (module === 'offline-translation') {
            router.push(ROUTES.OFFLINE_TRANSLATION as never);

            return;
        }

        setPlatformSheetOpen(true);
    };

    const enterPlatform = () => {
        setPlatformSheetOpen(false);

        if (useSessionStore.getState().isAuthenticated) {
            router.push(ROUTES.PLATFORM.STATUS as never);

            return;
        }
        router.push({ pathname: ROUTES.AUTH.LOGIN, params: { returnTo: ROUTES.PLATFORM.STATUS } } as never);
    };

    return (
        <PageContainer scroll>
            <ModuleSelector
                authenticated={authenticated}
                copy={{
                    eyebrow: t('selector.eyebrow'),
                    title: t('selector.title'),
                    subtitle: t('selector.subtitle'),
                    settings: t('selector.settings'),
                    library: t('offline.library'),
                    modules: {
                        platform: {
                            title: t('platform.title'),
                            description: t('platform.description'),
                            status: t('platform.status'),
                            action: t('platform.loginAction'),
                            authenticatedAction: t('platform.connectedAction'),
                        },
                        'offline-translation': {
                            title: t('offline.title'),
                            description: t('offline.description'),
                            status: t('offline.status'),
                            action: t('offline.action'),
                        },
                    },
                }}
                onOpenModule={openModule}
                onOpenSettings={() => router.push(ROUTES.SETTINGS.INDEX as never)}
                onOpenLibrary={() => router.push(ROUTES.TRANSLATION_LIBRARY as never)}
                recovery={localError ? { message: t('startup.error'), action: t('startup.retry'), onRetry: () => void retryLocalHydration() } : undefined}
            />
            {__DEV__ ? (
                <Button variant="outline" onPress={() => router.push(ROUTES.READER_PREVIEW_NOVEL as never)}>
                    {t('selector.novelPreview')}
                </Button>
            ) : null}
            <BottomSheet
                visible={platformSheetOpen}
                onClose={() => setPlatformSheetOpen(false)}
                closeLabel={t('platform.closeSheet')}
                title={t('platform.constructionTitle')}
                testIDs={{ sheet: 'platform-sheet', backdrop: 'platform-sheet-backdrop', layer: 'platform-sheet-layer' }}
            >
                <AppText tone="muted">{t('platform.constructionDescription')}</AppText>
                <Button onPress={enterPlatform}>{t('platform.loginAction')}</Button>
                <Button variant="ghost" onPress={() => setPlatformSheetOpen(false)}>
                    {t('platform.notNow')}
                </Button>
            </BottomSheet>
        </PageContainer>
    );
}
