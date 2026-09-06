import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, type LayoutChangeEvent, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import type { ChapterPage } from '@/entities/chapter';
import type { ReaderSettings } from '@/entities/user-setting';
import { buildReaderItems, effectiveReaderMode, logicalItemIndex } from '@/features/navigate-chapter-reader';
import { useTheme } from '@/shared/theme';
import { StatusMessage } from '@/shared/ui';

import { adjacentPages, pageAtOffset, readerBackgroundColor, verticalPageLayouts } from '../model/viewport';

interface Props {
    pages: readonly ChapterPage[];
    settings: ReaderSettings;
    currentPage: number;
    onCurrentPageChange: (page: number) => void;
}

interface ReaderPageProps {
    page: ChapterPage;
    pageNumber: number;
    totalPages: number;
    failed: boolean;
    retryVersion: number;
    fit: ReaderSettings['fit'];
    saturation: number;
    width: number;
    height: number;
    verticalMode: boolean;
    failureGap: number;
    onRetry: (pageId: string) => void;
    onImageError: (pageId: string) => void;
    rowHeight?: number;
    onFailureLayout: (pageId: string, event: LayoutChangeEvent) => void;
}

const ReaderPage = memo(function ReaderPage({
    page,
    pageNumber,
    totalPages,
    failed,
    retryVersion,
    fit,
    saturation,
    width,
    height,
    verticalMode,
    failureGap,
    onRetry,
    onImageError,
    rowHeight,
    onFailureLayout,
}: ReaderPageProps) {
    const { t } = useTranslation('reader');
    const imageFit =
        fit === 'WIDTH'
            ? { width, aspectRatio: page.width / page.height }
            : fit === 'HEIGHT'
              ? { height, aspectRatio: page.width / page.height }
              : { width: page.width, height: page.height };

    return (
        <View testID={`reader-page-${page.id}`} style={{ alignItems: 'center', height: rowHeight }}>
            {failed ? (
                <View
                    testID={`reader-page-error-${page.id}`}
                    onLayout={event => onFailureLayout(page.id, event)}
                    style={{ minHeight: Math.min(height, 320), alignItems: 'center', justifyContent: 'center', gap: failureGap }}
                >
                    <StatusMessage actionLabel={t('actions.retry')} title={t('errors.image')} onAction={() => onRetry(page.id)} tone="danger" />
                </View>
            ) : (
                <View style={{ filter: [{ saturate: saturation / 100 }] }}>
                    <Image
                        key={`${page.id}:${retryVersion}`}
                        source={{ uri: page.imageUrl }}
                        contentFit="contain"
                        accessibilityLabel={t('viewport.page', { page: pageNumber, total: totalPages })}
                        onError={() => onImageError(page.id)}
                        style={{ ...imageFit, maxWidth: width, maxHeight: verticalMode ? undefined : height }}
                    />
                </View>
            )}
        </View>
    );
});

export function ReaderViewport({ pages, settings, currentPage, onCurrentPageChange }: Props) {
    const { width, height } = useWindowDimensions();
    const { spacing, tokens } = useTheme();
    const scrollRef = useRef<FlatList<ChapterPage>>(null);
    const [failureHeights, setFailureHeights] = useState<Record<string, number>>({});
    const [failedPages, setFailedPages] = useState<Set<string>>(new Set());
    const [retryVersions, setRetryVersions] = useState<Record<string, number>>({});
    const mode = effectiveReaderMode(settings.mode, settings.direction);
    const items = useMemo(() => buildReaderItems(pages, settings.mode, settings.direction), [pages, settings.direction, settings.mode]);
    const pageNumbers = useMemo(() => new Map(pages.map((page, index) => [page.id, index + 1])), [pages]);
    const layouts = useMemo(
        () => verticalPageLayouts(pages, settings.fit, width, height, settings.gap, failureHeights),
        [pages, settings.fit, width, height, settings.gap, failureHeights],
    );
    const currentId = pages[currentPage - 1]?.id ?? pages[0]?.id;
    const itemIndex = currentId ? logicalItemIndex(items, currentId) : 0;

    const restoreLogicalPage = useCallback(() => {
        if (!currentId) return;
        const layout = layouts[(pageNumbers.get(currentId) ?? 1) - 1];
        if (layout) scrollRef.current?.scrollToOffset({ offset: layout.y, animated: false });
    }, [currentId, layouts, pageNumbers]);

    useEffect(() => {
        restoreLogicalPage();
    }, [height, restoreLogicalPage, settings.fit, settings.gap, width]);

    useEffect(() => {
        const urls = adjacentPages(pages, currentPage, settings.preload).map(page => page.imageUrl);
        if (urls.length) void Image.prefetch(urls).catch(() => undefined);
    }, [currentPage, pages, settings.preload]);

    const retryPage = useCallback((pageId: string) => {
        setFailedPages(current => {
            const next = new Set(current);
            next.delete(pageId);
            return next;
        });
        setFailureHeights(current => {
            const next = { ...current };
            delete next[pageId];
            return next;
        });
        setRetryVersions(current => ({ ...current, [pageId]: (current[pageId] ?? 0) + 1 }));
    }, []);

    const markPageAsFailed = useCallback((pageId: string) => {
        setFailedPages(current => new Set(current).add(pageId));
    }, []);

    const recordFailureLayout = useCallback((pageId: string, event: LayoutChangeEvent) => {
        const measured = event.nativeEvent.layout.height;
        setFailureHeights(current => (current[pageId] === measured ? current : { ...current, [pageId]: measured }));
    }, []);

    const renderPage = (page: ChapterPage) => (
        <ReaderPage
            key={page.id}
            page={page}
            pageNumber={pageNumbers.get(page.id) ?? 1}
            totalPages={pages.length}
            failed={failedPages.has(page.id)}
            retryVersion={retryVersions[page.id] ?? 0}
            fit={settings.fit}
            saturation={settings.saturation}
            width={width}
            height={height}
            verticalMode={mode === 'VERTICAL'}
            failureGap={spacing.md}
            onRetry={retryPage}
            onImageError={markPageAsFailed}
            onFailureLayout={recordFailureLayout}
            rowHeight={mode === 'VERTICAL' ? layouts[(pageNumbers.get(page.id) ?? 1) - 1]?.height : undefined}
        />
    );

    if (mode === 'VERTICAL') {
        return (
            <FlatList
                key={`${width}:${height}:${settings.fit}:${settings.gap}:${Object.entries(failureHeights).join()}`}
                ref={scrollRef}
                testID="reader-vertical"
                style={{ flex: 1, backgroundColor: readerBackgroundColor(settings.background, tokens) }}
                data={pages}
                renderItem={({ item }) => renderPage(item)}
                keyExtractor={page => page.id}
                extraData={{ failedPages, retryVersions, settings, width, height }}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                removeClippedSubviews={false}
                initialScrollIndex={Math.max(0, Math.min(pages.length - 1, currentPage - 1))}
                getItemLayout={(_, index) => ({ length: layouts[index].height, offset: layouts[index].y, index })}
                ItemSeparatorComponent={() => <View style={{ height: settings.gap }} />}
                onContentSizeChange={restoreLogicalPage}
                onMomentumScrollEnd={event => {
                    const id = pageAtOffset(layouts, event.nativeEvent.contentOffset.y);
                    const page = id ? (pageNumbers.get(id) ?? 1) : 1;
                    onCurrentPageChange(Math.min(pages.length, Math.max(1, page)));
                }}
            />
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
