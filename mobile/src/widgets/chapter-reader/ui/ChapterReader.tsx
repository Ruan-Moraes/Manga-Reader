import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Chapter, ImageVariantCapabilities } from '@/src/entities/chapter';
import type { ReaderSettings } from '@/src/entities/user-setting';
import { ReaderSettingsControls } from '@/src/features/configure-chapter-reader';
import type { ProgressSyncState } from '@/src/features/track-reading-progress';
import { useTheme } from '@/src/shared/theme';

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
    const { minimumTouchTarget, spacing, tokens, typography } = useTheme();
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
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('actions.previousPage')}
                        accessibilityState={{ disabled: currentPage <= 1 }}
                        disabled={currentPage <= 1}
                        onPress={() => onCurrentPageChange(Math.max(1, currentPage - (settings.mode === 'DOUBLE' ? 2 : 1)))}
                        style={{
                            minHeight: minimumTouchTarget,
                            minWidth: minimumTouchTarget,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: tokens.overlay,
                        }}
                    >
                        <Text style={{ color: tokens.inverseText }}>‹</Text>
                    </Pressable>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('actions.nextPage')}
                        accessibilityState={{ disabled: currentPage >= chapter.pages.length }}
                        disabled={currentPage >= chapter.pages.length}
                        onPress={() => onCurrentPageChange(Math.min(chapter.pages.length, currentPage + (settings.mode === 'DOUBLE' ? 2 : 1)))}
                        style={{
                            minHeight: minimumTouchTarget,
                            minWidth: minimumTouchTarget,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: tokens.overlay,
                        }}
                    >
                        <Text style={{ color: tokens.inverseText }}>›</Text>
                    </Pressable>
                </View>
            ) : null}
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={controlsVisible ? t('actions.hideControls') : t('actions.showControls')}
                accessibilityHint={t('actions.controlsHint')}
                onPress={onToggleControls}
                style={{
                    position: 'absolute',
                    right: spacing.sm,
                    bottom: spacing.sm,
                    minHeight: minimumTouchTarget,
                    minWidth: minimumTouchTarget,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: tokens.overlay,
                }}
            >
                <Text style={{ color: tokens.inverseText, fontSize: typography.body }}>{controlsVisible ? '×' : '☰'}</Text>
            </Pressable>
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
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={t('actions.exit')}
                        onPress={onExit}
                        style={{ minHeight: minimumTouchTarget, justifyContent: 'center' }}
                    >
                        <Text style={{ color: tokens.accentText }}>{t('actions.exit')}</Text>
                    </Pressable>
                    <Text accessibilityRole="header" style={{ color: tokens.text, fontSize: typography.h3 }}>
                        {chapter.title}
                    </Text>
                    <Text testID="reader-current-page" style={{ color: tokens.muted, fontSize: typography.body }}>
                        {t('viewport.page', { page: currentPage, total: chapter.pages.length })}
                    </Text>
                    {progressHydrationError ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t('actions.retryProgressHydration')}
                            onPress={onRetryProgressHydration}
                            style={{ minHeight: minimumTouchTarget, justifyContent: 'center' }}
                        >
                            <Text accessibilityRole="alert" style={{ color: tokens.danger }}>
                                {t('errors.progressHydration')}
                            </Text>
                        </Pressable>
                    ) : null}
                    {syncStatus === 'error' ? (
                        <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t('actions.retryProgress')}
                            onPress={onRetryProgress}
                            style={{ minHeight: minimumTouchTarget, justifyContent: 'center' }}
                        >
                            <Text accessibilityRole="alert" style={{ color: tokens.danger }}>
                                {t('errors.progress')}
                            </Text>
                        </Pressable>
                    ) : null}
                    <ReaderSettingsControls value={settings} capabilities={capabilities} onChange={onSettingsChange} />
                </ScrollView>
            ) : null}
        </View>
    );
}
