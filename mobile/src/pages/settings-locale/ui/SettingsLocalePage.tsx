import { useTranslation } from 'react-i18next';

import { InterfaceLanguageRegionControls, SettingsSyncStatus } from '@/src/features/manage-settings';
import { navigateBackOrReplace, ROUTES } from '@/src/shared/navigation';
import { ScreenScaffold } from '@/src/shared/ui';

export function SettingsLocalePage() {
    const { t } = useTranslation('settingsNavigation');
    return (
        <ScreenScaffold
            backLabel={t('actions.back')}
            description={t('sections.locale.description')}
            onBack={() => navigateBackOrReplace(ROUTES.SETTINGS.INDEX)}
            title={t('sections.locale.title')}
        >
            <InterfaceLanguageRegionControls showTitle={false} />
            <SettingsSyncStatus group="locale" />
        </ScreenScaffold>
    );
}
