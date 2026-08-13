import { useTranslation } from 'react-i18next';

import { InterfaceLanguageRegionControls, SettingsSyncStatus } from '@/src/features/manage-settings';
import { ScreenScaffold } from '@/src/shared/ui';

export function SettingsLocalePage() {
    const { t } = useTranslation('settingsNavigation');
    return (
        <ScreenScaffold backLabel={t('actions.back')} title={t('sections.locale.title')}>
            <InterfaceLanguageRegionControls />
            <SettingsSyncStatus group="locale" />
        </ScreenScaffold>
    );
}
