import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { DataControlsPanel } from '@/features/data-controls';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { ScreenScaffold } from '@/shared/ui';

export function SettingsDataPage() {
    const { t } = useTranslation('settingsNavigation');
    return (
        <ScreenScaffold
            backLabel={t('actions.back')}
            description={t('sections.data.description')}
            eyebrow={t('sections.data.title')}
            onBack={() => navigateBackOrReplace(ROUTES.SETTINGS.INDEX)}
            title={t('sections.data.editorialTitle')}
        >
            <DataControlsPanel
                showTitle={false}
                onAuthenticationRequired={() => router.push({ pathname: ROUTES.AUTH.LOGIN, params: { returnTo: ROUTES.SETTINGS.DATA } } as never)}
            />
        </ScreenScaffold>
    );
}
