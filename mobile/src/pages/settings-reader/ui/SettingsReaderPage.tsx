import { useTranslation } from 'react-i18next';

import { normalizeReaderSettings, ReaderGestureControls } from '@/features/configure-chapter-reader';
import { TextReaderControls } from '@/features/configure-text-reader';
import { SettingsSyncStatus, useSettingsStore } from '@/features/manage-settings';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { ScreenScaffold } from '@/shared/ui';
import { ReaderPreferencesSection } from '@/widgets/chapter-reader';

export function SettingsReaderPage() {
    const { t } = useTranslation('settingsNavigation');

    const value = useSettingsStore(state => state.settings.reader);

    const textReader = useSettingsStore(state => state.textReader);
    const updateTextReader = useSettingsStore(state => state.updateTextReader);
    const resetTextReader = useSettingsStore(state => state.resetTextReader);
    const readerGestures = useSettingsStore(state => state.readerGestures);
    const updateReaderGestures = useSettingsStore(state => state.updateReaderGestures);
    const localError = useSettingsStore(state => state.localError);
    const retryReaderGesturesPersistence = useSettingsStore(state => state.retryReaderGesturesPersistence);
    const updateSettings = useSettingsStore(state => state.updateSettings);

    return (
        <ScreenScaffold
            backLabel={t('actions.back')}
            description={t('sections.reader.description')}
            eyebrow={t('sections.reader.title')}
            onBack={() => navigateBackOrReplace(ROUTES.SETTINGS.INDEX)}
            title={t('sections.reader.editorialTitle')}
        >
            <TextReaderControls
                value={textReader}
                onChange={patch => void updateTextReader(patch)}
                onReset={() => void resetTextReader()}
                persistenceError={!!localError}
                onRetry={() => void retryReaderGesturesPersistence()}
            />
            <ReaderGestureControls
                value={readerGestures}
                onChange={patch => void updateReaderGestures(patch)}
                sideNavigationAvailable={value.mode !== 'VERTICAL' && value.direction !== 'WEBTOON'}
                persistenceError={!!localError}
                onRetry={() => void retryReaderGesturesPersistence()}
            />
            <ReaderPreferencesSection
                value={value}
                onChange={patch => void updateSettings(current => ({ ...current, reader: normalizeReaderSettings(patch, current) }), 'reader')}
            />
            <SettingsSyncStatus group="reader" />
        </ScreenScaffold>
    );
}
