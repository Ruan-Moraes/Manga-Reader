import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { IconButton, ScreenScaffold } from '@/shared/ui';
import { WorkManage } from '@/widgets/local-translation-library';

export function LocalWorkManagePage({ workId }: { workId: string }) {
    const { t } = useTranslation('localTranslation');
    const { t: launcher } = useTranslation('launcher');
    const backToWork = () => navigateBackOrReplace({ pathname: ROUTES.WORK, params: { workId } } as never);
    return (
        <WorkManage
            workId={workId}
            onViewChapters={backToWork}
            onMissing={() => router.replace(ROUTES.TRANSLATION_LIBRARY as never)}
            scaffold={({ title, children }) => (
                <ScreenScaffold
                    compact
                    backShape="control"
                    backLabel={t('actions.back')}
                    onBack={backToWork}
                    headerAction={
                        <IconButton accessibilityLabel={launcher('navigation.home')} icon="home-outline" onPress={() => router.replace(ROUTES.ROOT as never)} />
                    }
                    title={title}
                >
                    {children}
                </ScreenScaffold>
            )}
        />
    );
}
