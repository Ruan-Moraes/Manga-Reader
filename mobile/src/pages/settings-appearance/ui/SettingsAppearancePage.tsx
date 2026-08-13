import { useTranslation } from 'react-i18next';

import { AppearanceAccessibilityControls, SettingsSyncStatus } from '@/src/features/manage-settings';
import { ScreenScaffold } from '@/src/shared/ui';

export function SettingsAppearancePage() {
    const { t } = useTranslation('settingsNavigation');
    return (
        <ScreenScaffold backLabel={t('actions.back')} title={t('sections.appearance.title')}>
            <AppearanceAccessibilityControls />
            <SettingsSyncStatus group="appearance" />
        </ScreenScaffold>
    );
}
