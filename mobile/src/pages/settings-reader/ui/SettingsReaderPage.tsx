import { useTranslation } from 'react-i18next';

import { normalizeReaderSettings } from '@/features/configure-chapter-reader';
import { SettingsSyncStatus, useSettingsStore } from '@/features/manage-settings';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { ScreenScaffold } from '@/shared/ui';
import { ReaderPreferencesSection } from '@/widgets/chapter-reader';

export function SettingsReaderPage() {
    const { t } = useTranslation('settingsNavigation');

    const value = useSettingsStore(state => state.settings.reader);

    const updateSettings = useSettingsStore(state => state.updateSettings);

    return (
        <ScreenScaffold
            backLabel={t('actions.back')}
            description={t('sections.reader.description')}
            eyebrow={t('sections.reader.title')}
            onBack={() => navigateBackOrReplace(ROUTES.SETTINGS.INDEX)}
            title={t('sections.reader.editorialTitle')}
        >
            <ReaderPreferencesSection
                value={value}
                onChange={patch => void updateSettings(current => ({ ...current, reader: normalizeReaderSettings(patch, current) }), 'reader')}
            />
            <SettingsSyncStatus group="reader" />
        </ScreenScaffold>
    );
}
