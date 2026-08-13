import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { DataControlsPanel } from '@/src/features/data-controls';
import { ROUTES } from '@/src/shared/navigation';
import { ScreenScaffold } from '@/src/shared/ui';

export function SettingsDataPage() {
    const { t } = useTranslation('settingsNavigation');
    return (
        <ScreenScaffold backLabel={t('actions.back')} title={t('sections.data.title')}>
            <DataControlsPanel
                onAuthenticationRequired={() => router.push({ pathname: ROUTES.AUTH.LOGIN, params: { returnTo: ROUTES.SETTINGS.DATA } } as never)}
            />
        </ScreenScaffold>
    );
}
