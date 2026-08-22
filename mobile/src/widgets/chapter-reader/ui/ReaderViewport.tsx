import { useCallback, useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, ScrollView, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import type { ChapterPage } from '@/src/entities/chapter';
import type { ReaderSettings } from '@/src/entities/user-setting';
import { buildReaderItems, effectiveReaderMode, logicalItemIndex } from '@/src/features/navigate-chapter-reader';
import { useTheme } from '@/src/shared/theme';
import { StatusMessage } from '@/src/shared/ui';

import { adjacentPages, pageAtOffset, pageOffset, readerBackgroundColor, type ReaderPageLayout } from '../model/viewport';

interface Props {
    pages: readonly ChapterPage[];
    settings: ReaderSettings;
    currentPage: number;
    onCurrentPageChange: (page: number) => void;
}

export function ReaderViewport({ pages, settings, currentPage, onCurrentPageChange }: Props) {
    const { t } = useTranslation('reader');
    const { width, height } = useWindowDimensions();
    const { spacing, tokens } = useTheme();
    const scrollRef = useRef<ScrollView>(null);
    const layoutsRef = useRef(new Map<string, ReaderPageLayout>());
    const [failedPages, setFailedPages] = useState<Set<string>>(new Set());
    const [retryVersions, setRetryVersions] = useState<Record<string, number>>({});
    const mode = effectiveReaderMode(settings.mode, settings.direction);
    const items = buildReaderItems(pages, settings.mode, settings.direction);
    const currentId = pages[currentPage - 1]?.id ?? pages[0]?.id;
    const itemIndex = currentId ? logicalItemIndex(items, currentId) : 0;

    const restoreLogicalPage = useCallback(() => {
        if (!currentId) return;
        const y = pageOffset([...layoutsRef.current.values()], currentId);
        if (y !== null) scrollRef.current?.scrollTo({ y, animated: false });
    }, [currentId]);

    useEffect(() => {
        restoreLogicalPage();
    }, [height, restoreLogicalPage, settings.fit, settings.gap, width]);

    useEffect(() => {
        const urls = adjacentPages(pages, currentPage, settings.preload).map(page => page.imageUrl);
        if (urls.length) void Image.prefetch(urls).catch(() => undefined);
    }, [currentPage, pages, settings.preload]);

    const renderPage = (page: ChapterPage) => {
        const failed = failedPages.has(page.id);
        const fit =
            settings.fit === 'WIDTH'
                ? { width, aspectRatio: page.width / page.height }
                : settings.fit === 'HEIGHT'
                  ? { height, aspectRatio: page.width / page.height }
                  : { width: page.width, height: page.height };
        return (
            <View
                key={page.id}
                testID={`reader-page-${page.id}`}
                onLayout={(event: LayoutChangeEvent) => {
                    const { height: pageHeight, y } = event.nativeEvent.layout;
                    layoutsRef.current.set(page.id, { id: page.id, y, height: pageHeight });
                    if (page.id === currentId) restoreLogicalPage();
                }}
                style={{ alignItems: 'center' }}
            >
                {failed ? (
                    <View style={{ minHeight: Math.min(height, 320), alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
                        <StatusMessage
                            actionLabel={t('actions.retry')}
                            title={t('errors.image')}
                            onAction={() => {
                                setFailedPages(current => {
                                    const next = new Set(current);
                                    next.delete(page.id);
                                    return next;
                                });
                                setRetryVersions(current => ({ ...current, [page.id]: (current[page.id] ?? 0) + 1 }));
                            }}
                            tone="danger"
                        />
                    </View>
                ) : (
                    <View style={{ filter: [{ saturate: settings.saturation / 100 }] }}>
                        <Image
                            key={`${page.id}:${retryVersions[page.id] ?? 0}`}
                            source={{ uri: page.imageUrl }}
                            contentFit="contain"
                            accessibilityLabel={t('viewport.page', { page: pages.indexOf(page) + 1, total: pages.length })}
                            onError={() => setFailedPages(current => new Set(current).add(page.id))}
                            style={{ ...fit, maxWidth: width, maxHeight: mode === 'VERTICAL' ? undefined : height }}
                        />
                    </View>
                )}
            </View>
        );
    };

    if (mode === 'VERTICAL') {
        return (
            <ScrollView
                ref={scrollRef}
                testID="reader-vertical"
                style={{ flex: 1, backgroundColor: readerBackgroundColor(settings.background, tokens) }}
                contentContainerStyle={{ gap: settings.gap }}
                onContentSizeChange={restoreLogicalPage}
                onMomentumScrollEnd={event => {
                    const id = pageAtOffset([...layoutsRef.current.values()], event.nativeEvent.contentOffset.y);
                    const page = id ? pages.findIndex(candidate => candidate.id === id) + 1 : 1;
                    onCurrentPageChange(Math.min(pages.length, Math.max(1, page)));
                }}
            >
                {items.flat().map(renderPage)}
            </ScrollView>
        );
    }

    const item = items[itemIndex] ?? items[0] ?? [];
    return (
        <View
            testID="reader-paged"
            style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: settings.gap,
                backgroundColor: readerBackgroundColor(settings.background, tokens),
            }}
        >
            {item.map(renderPage)}
        </View>
    );
}
