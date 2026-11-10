import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { normalizeReaderSettings, ReaderGestureControls } from '@/features/configure-chapter-reader';
import { TextReaderControls } from '@/features/configure-text-reader';
import { SettingsSyncStatus, useSettingsStore } from '@/features/manage-settings';
import { navigateBackOrReplace, ROUTES } from '@/shared/navigation';
import { BottomSheet, Button, Card, type IconName, ListRow, ScreenScaffold } from '@/shared/ui';
import { ReaderPreferencesSection } from '@/widgets/chapter-reader';

type ReaderSheet = 'navigation' | 'image' | 'behavior' | 'gestures' | 'text';

const SHEET_ICONS: Record<ReaderSheet, IconName> = {
    navigation: 'compass-outline',
    image: 'image-outline',
    behavior: 'options-outline',
    gestures: 'hand-left-outline',
    text: 'text-outline',
};
const SHEETS: readonly ReaderSheet[] = ['navigation', 'image', 'behavior', 'gestures', 'text'];

export function SettingsReaderPage() {
    const { t } = useTranslation('settingsNavigation');
    const { t: tr } = useTranslation('reader');

    const value = useSettingsStore(state => state.settings.reader);

    const textReader = useSettingsStore(state => state.textReader);
    const updateTextReader = useSettingsStore(state => state.updateTextReader);
    const resetTextReader = useSettingsStore(state => state.resetTextReader);
    const readerGestures = useSettingsStore(state => state.readerGestures);
    const updateReaderGestures = useSettingsStore(state => state.updateReaderGestures);
    const localError = useSettingsStore(state => state.localError);
    const retryReaderGesturesPersistence = useSettingsStore(state => state.retryReaderGesturesPersistence);
    const updateSettings = useSettingsStore(state => state.updateSettings);

    const [openSheet, setOpenSheet] = useState<ReaderSheet | null>(null);

    const updateReader = (patch: Parameters<typeof normalizeReaderSettings>[0]) =>
        void updateSettings(current => ({ ...current, reader: normalizeReaderSettings(patch, current) }), 'reader');

    // Linhas só com título, descrição e seta (pedido de 2026-11-09): nenhum valor ao lado da seta.
    const sheetCopy: Record<ReaderSheet, { title: string; description: string }> = {
        navigation: { title: tr('settings.sections.navigation.title'), description: tr('settings.sections.navigation.description') },
        image: { title: tr('settings.sections.image.title'), description: tr('settings.sections.image.description') },
        behavior: { title: tr('settings.sections.behavior.title'), description: tr('settings.sections.behavior.description') },
        gestures: { title: tr('gestures.title'), description: tr('gestures.description') },
        text: { title: tr('text.title'), description: tr('text.description') },
    };

    const renderSheetContent = (sheet: ReaderSheet) => {
        if (sheet === 'gestures') {
            return (
                <ReaderGestureControls
                    compact
                    value={readerGestures}
                    onChange={patch => void updateReaderGestures(patch)}
                    sideNavigationAvailable={value.mode !== 'VERTICAL' && value.direction !== 'WEBTOON'}
                    persistenceError={!!localError}
                    onRetry={() => void retryReaderGesturesPersistence()}
                />
            );
        }

        if (sheet === 'text') {
            return (
                <TextReaderControls
                    compact
                    showReset={false}
                    value={textReader}
                    onChange={patch => void updateTextReader(patch)}
                    onReset={() => void resetTextReader()}
                    persistenceError={!!localError}
                    onRetry={() => void retryReaderGesturesPersistence()}
                />
            );
        }

        return <ReaderPreferencesSection compact category={sheet} value={value} onChange={updateReader} />;
    };

    return (
        <ScreenScaffold
            backLabel={t('actions.back')}
            description={t('sections.reader.description')}
            eyebrow={t('sections.reader.title')}
            onBack={() => navigateBackOrReplace(ROUTES.SETTINGS.INDEX)}
            title={t('sections.reader.editorialTitle')}
        >
            {/* Kit: o grupo vem direto abaixo do topo, sem repetir "Leitor" como seção. */}
            <Card padded={false} style={{ overflow: 'hidden' }}>
                {SHEETS.map((sheet, index) => (
                    <ListRow
                        key={sheet}
                        description={sheetCopy[sheet].description}
                        icon={SHEET_ICONS[sheet]}
                        onPress={() => setOpenSheet(sheet)}
                        showDivider={index < SHEETS.length - 1}
                        title={sheetCopy[sheet].title}
                        variant="plain"
                    />
                ))}
            </Card>
            <SettingsSyncStatus group="reader" />
            <BottomSheet
                visible={openSheet !== null}
                onClose={() => setOpenSheet(null)}
                closeLabel={t('readerSheets.close')}
                title={openSheet ? sheetCopy[openSheet].title : undefined}
                description={openSheet ? sheetCopy[openSheet].description : undefined}
                footer={
                    openSheet === 'text' ? (
                        <Button size="compact" variant="ghost" onPress={() => void resetTextReader()}>
                            {tr('text.reset')}
                        </Button>
                    ) : undefined
                }
                testIDs={{ sheet: 'reader-settings-sheet', backdrop: 'reader-settings-sheet-backdrop', layer: 'reader-settings-sheet-layer' }}
            >
                {openSheet ? renderSheetContent(openSheet) : null}
            </BottomSheet>
        </ScreenScaffold>
    );
}
