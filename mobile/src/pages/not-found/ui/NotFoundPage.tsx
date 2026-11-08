import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ROUTES } from '@/shared/navigation';
import { NavigationHeader, PageContainer, StateView } from '@/shared/ui';

export function NotFoundPage() {
    const { t } = useTranslation('common');

    const hasHistory = router.canGoBack();

    const goHome = () => router.replace(ROUTES.ROOT as never);
    const goBack = () => router.back();

    return (
        <>
            <Stack.Screen options={{ title: t('notFound.pageTitle') }} />
            <PageContainer>
                {hasHistory ? <NavigationHeader backLabel={t('navigation.back')} onBack={goBack} /> : null}
                <StateView
                    kind="notfound"
                    eyebrow={t('notFound.eyebrow')}
                    title={t('notFound.pageTitle')}
                    text={t('notFound.pageDesc')}
                    goHome={{ label: t('notFound.goHome'), onPress: goHome }}
                    back={hasHistory ? { label: t('navigation.back'), onPress: goBack } : undefined}
                />
            </PageContainer>
        </>
    );
}
