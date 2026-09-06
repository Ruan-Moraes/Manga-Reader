import { useTranslation } from 'react-i18next';

import { AppearanceAccessibilityControls, SettingsSyncStatus } from '@/features/manage-settings';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { ScreenScaffold } from '@/shared/ui';

export function SettingsAppearancePage() {
    const { t } = useTranslation('settingsNavigation');
    return (
        <ScreenScaffold
            backLabel={t('actions.back')}
            onBack={() => navigateBackOrReplace(ROUTES.SETTINGS.INDEX)}
            eyebrow={t('sections.appearance.title')}
            title={t('sections.appearance.editorialTitle')}
            description={t('sections.appearance.description')}
        >
            <AppearanceAccessibilityControls />
            <SettingsSyncStatus group="appearance" />
        </ScreenScaffold>
    );
}
