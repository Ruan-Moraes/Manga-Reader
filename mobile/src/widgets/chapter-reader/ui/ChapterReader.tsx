import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Chapter, ImageVariantCapabilities } from '@/src/entities/chapter';
import type { ReaderSettings } from '@/src/entities/user-setting';
import { ReaderSettingsControls } from '@/src/features/configure-chapter-reader';
import type { ProgressSyncState } from '@/src/features/track-reading-progress';
import { useTheme } from '@/src/shared/theme';
import { AppText, BackButton, IconButton, StatusMessage } from '@/src/shared/ui';

import { ReaderViewport } from './ReaderViewport';

interface Props {
    chapter: Chapter;
    settings: ReaderSettings;
    capabilities: ImageVariantCapabilities;
    currentPage: number;
    controlsVisible: boolean;
    progressHydrationError: boolean;
    syncStatus: ProgressSyncState['status'];
    onCurrentPageChange: (page: number) => void;
    onSettingsChange: (patch: Partial<ReaderSettings>) => void;
    onToggleControls: () => void;
    onExit: () => void;
    onRetryProgress: () => void;
    onRetryProgressHydration: () => void;
}

export function ChapterReader({
    chapter,
    settings,
    capabilities,
    currentPage,
    controlsVisible,
    progressHydrationError,
    syncStatus,
    onCurrentPageChange,
    onSettingsChange,
    onToggleControls,
    onExit,
    onRetryProgress,
    onRetryProgressHydration,
}: Props) {
    const { t } = useTranslation('reader');
    const { spacing, tokens } = useTheme();
    return (
        <View style={{ flex: 1 }}>
            <ReaderViewport pages={chapter.pages} settings={settings} currentPage={currentPage} onCurrentPageChange={onCurrentPageChange} />
            {controlsVisible && settings.direction !== 'WEBTOON' && settings.mode !== 'VERTICAL' ? (
                <View
                    testID="reader-navigation-controls"
                    style={{
                        position: 'absolute',
                        bottom: spacing.sm,
                        left: spacing.sm,
                        flexDirection: settings.direction === 'RTL' ? 'row-reverse' : 'row',
                        gap: spacing.sm,
                    }}
                >
                    <IconButton
                        accessibilityLabel={t('actions.previousPage')}
                        disabled={currentPage <= 1}
                        icon="chevron-back"
                        onPress={() => onCurrentPageChange(Math.max(1, currentPage - (settings.mode === 'DOUBLE' ? 2 : 1)))}
                        surface="overlay"
                        tone="inverse"
                    />
                    <IconButton
                        accessibilityLabel={t('actions.nextPage')}
                        disabled={currentPage >= chapter.pages.length}
                        icon="chevron-forward"
                        onPress={() => onCurrentPageChange(Math.min(chapter.pages.length, currentPage + (settings.mode === 'DOUBLE' ? 2 : 1)))}
                        surface="overlay"
                        tone="inverse"
                    />
                </View>
            ) : null}
            <View style={{ position: 'absolute', right: spacing.sm, bottom: spacing.sm }}>
                <IconButton
                    accessibilityLabel={controlsVisible ? t('actions.hideControls') : t('actions.showControls')}
                    accessibilityHint={t('actions.controlsHint')}
                    icon={controlsVisible ? 'close' : 'menu'}
                    onPress={onToggleControls}
                    surface="overlay"
                    tone="inverse"
                />
            </View>
            {controlsVisible ? (
                <ScrollView
                    testID="reader-controls-panel"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        maxHeight: '68%',
                        backgroundColor: tokens.surface,
                    }}
                    contentContainerStyle={{
                        padding: spacing.md,
                        gap: spacing.sm,
                    }}
                >
                    <BackButton accessibilityLabel={t('actions.exit')} onPress={onExit} appearance="surface" />
                    <AppText accessibilityRole="header" variant="section">
                        {chapter.title}
                    </AppText>
                    <AppText testID="reader-current-page" tone="muted">
                        {t('viewport.page', { page: currentPage, total: chapter.pages.length })}
                    </AppText>
                    {progressHydrationError ? (
                        <StatusMessage
                            actionLabel={t('actions.retryProgressHydration')}
                            title={t('errors.progressHydration')}
                            onAction={onRetryProgressHydration}
                            tone="danger"
                        />
                    ) : null}
                    {syncStatus === 'error' ? (
                        <StatusMessage actionLabel={t('actions.retryProgress')} title={t('errors.progress')} onAction={onRetryProgress} tone="danger" />
                    ) : null}
                    <ReaderSettingsControls value={settings} capabilities={capabilities} onChange={onSettingsChange} />
                </ScrollView>
            ) : null}
        </View>
    );
}
