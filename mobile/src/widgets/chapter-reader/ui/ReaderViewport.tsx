import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
    onLayout: (pageId: string, event: LayoutChangeEvent) => void;
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
    onLayout,
}: ReaderPageProps) {
    const { t } = useTranslation('reader');
    const imageFit =
        fit === 'WIDTH'
            ? { width, aspectRatio: page.width / page.height }
            : fit === 'HEIGHT'
              ? { height, aspectRatio: page.width / page.height }
              : { width: page.width, height: page.height };

    return (
        <View testID={`reader-page-${page.id}`} onLayout={event => onLayout(page.id, event)} style={{ alignItems: 'center' }}>
            {failed ? (
                <View style={{ minHeight: Math.min(height, 320), alignItems: 'center', justifyContent: 'center', gap: failureGap }}>
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
    const scrollRef = useRef<ScrollView>(null);
    const layoutsRef = useRef(new Map<string, ReaderPageLayout>());
    const [failedPages, setFailedPages] = useState<Set<string>>(new Set());
    const [retryVersions, setRetryVersions] = useState<Record<string, number>>({});
    const mode = effectiveReaderMode(settings.mode, settings.direction);
    const items = useMemo(() => buildReaderItems(pages, settings.mode, settings.direction), [pages, settings.direction, settings.mode]);
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

    const retryPage = useCallback((pageId: string) => {
        setFailedPages(current => {
            const next = new Set(current);
            next.delete(pageId);
            return next;
        });
        setRetryVersions(current => ({ ...current, [pageId]: (current[pageId] ?? 0) + 1 }));
    }, []);

    const markPageAsFailed = useCallback((pageId: string) => {
        setFailedPages(current => new Set(current).add(pageId));
    }, []);

    const recordPageLayout = useCallback(
        (pageId: string, event: LayoutChangeEvent) => {
            const { height: pageHeight, y } = event.nativeEvent.layout;
            layoutsRef.current.set(pageId, { id: pageId, y, height: pageHeight });
            if (pageId === currentId) restoreLogicalPage();
        },
        [currentId, restoreLogicalPage],
    );

    const renderPage = (page: ChapterPage) => (
        <ReaderPage
            key={page.id}
            page={page}
            pageNumber={pages.indexOf(page) + 1}
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
            onLayout={recordPageLayout}
        />
    );

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
