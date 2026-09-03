import { useTranslation } from 'react-i18next';

import { normalizeReaderSettings } from '@/src/features/configure-chapter-reader';
import { SettingsSyncStatus, useSettingsStore } from '@/src/features/manage-settings';
import { navigateBackOrReplace, ROUTES } from '@/src/shared/navigation';
import { ScreenScaffold } from '@/src/shared/ui';
import { ReaderPreferencesSection } from '@/src/widgets/chapter-reader';

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
