import { useTranslation } from 'react-i18next';

import { InterfaceLanguageRegionControls, SettingsSyncStatus } from '@/features/manage-settings';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { ScreenScaffold } from '@/shared/ui';

export function SettingsLocalePage() {
    const { t } = useTranslation('settingsNavigation');
    return (
        <ScreenScaffold
            backLabel={t('actions.back')}
            description={t('sections.locale.description')}
            eyebrow={t('sections.locale.title')}
            onBack={() => navigateBackOrReplace(ROUTES.SETTINGS.INDEX)}
            title={t('sections.locale.editorialTitle')}
        >
            <InterfaceLanguageRegionControls showTitle={false} />
            <SettingsSyncStatus group="locale" />
        </ScreenScaffold>
    );
}
