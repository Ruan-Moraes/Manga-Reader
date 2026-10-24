import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, type NativeScrollEvent, type NativeSyntheticEvent, ScrollView, useWindowDimensions, View, type ViewToken } from 'react-native';
import { Image } from 'expo-image';

import type { ReaderSettings } from '@/entities/user-setting';
import { useTheme } from '@/shared/theme';

import {
    dominantVisibleItem,
    effectiveImageMode,
    fittedImageSize,
    groupedImageItems,
    type ImageReaderItem,
    type ImageSequenceDocument,
    readerBackgroundColor,
    type ReaderLocation,
    restoreLocationById,
    verticalItemLayouts,
} from '../model/contentReader';
import type { ReaderScrollHandler } from '../model/useReaderInteraction';
import { ImageSurface, type Integrity } from './ImageSurface';

interface ImageViewportProps {
    document: ImageSequenceDocument;
    settings: ReaderSettings;
    location: ReaderLocation;
    showOriginal: boolean;
    onLocationChange(location: ReaderLocation): void;
    onValidateItem?(itemId: string): Promise<boolean>;
    onScrollPhase?: ReaderScrollHandler;
}

export const ImageViewport = memo(function ImageViewport({
    document,
    settings,
    location,
    showOriginal,
    onLocationChange,
    onValidateItem,
    onScrollPhase,
}: ImageViewportProps) {
    const dimensions = useWindowDimensions();
    const [viewport, setViewport] = useState({ width: dimensions.width, height: dimensions.height });
    const { width, height } = viewport;
    const { tokens } = useTheme();
    const listRef = useRef<FlatList<ImageReaderItem>>(null);
    const restoredLayoutKeyRef = useRef('');
    const lastEmitted = useRef<string | null>(null);
    const anchor = useRef<{ id: string; fraction: number } | null>(null);
    const generation = useRef(0);
    useEffect(
        () => () => {
            generation.current += 1;
        },
        [],
    );
    const offsetRef = useRef(0);
    const validatedRef = useRef(new Set<string>());
    const validatingRef = useRef(new Set<string>());
    const validationAttempts = useRef(new Map<string, number>());
    const [integrity, setIntegrity] = useState<Record<string, Integrity>>({});
    const mode = effectiveImageMode(settings);
    const layouts = useMemo(() => verticalItemLayouts(document.items, width, settings.gap), [document.items, settings.gap, width]);
    const groups = useMemo(() => groupedImageItems(document.items, settings), [document.items, settings]);
    const ids = useMemo(() => document.items.map(item => item.id), [document.items]);
    const page = restoreLocationById(ids, location);

    const validate = useCallback(
        async (itemId: string, force = false) => {
            if (!onValidateItem || (!force && (validatedRef.current.has(itemId) || validatingRef.current.has(itemId)))) return;
            const activeGeneration = generation.current;
            const attempt = (validationAttempts.current.get(itemId) ?? 0) + 1;
            validationAttempts.current.set(itemId, attempt);
            validatingRef.current.add(itemId);
            setIntegrity(current => ({ ...current, [itemId]: 'checking' }));
            const valid = await onValidateItem(itemId).catch(() => false);
            if (activeGeneration !== generation.current || validationAttempts.current.get(itemId) !== attempt) return;
            validatingRef.current.delete(itemId);
            validatedRef.current.add(itemId);
            setIntegrity(current => ({ ...current, [itemId]: valid ? 'valid' : 'invalid' }));
        },
        [onValidateItem],
    );

    const visibleChanged = useRef(({ viewableItems }: { viewableItems: ViewToken<ImageReaderItem>[] }) => {
        viewableItems.forEach(token => {
            if (token.isViewable) void validate(token.item.id);
        });
    });
    useEffect(() => {
        visibleChanged.current = ({ viewableItems }) => {
            viewableItems.forEach(token => {
                if (token.isViewable) void validate(token.item.id);
            });
        };
    }, [validate]);

    useEffect(() => {
        if (mode === 'VERTICAL') return;
        const currentGroup = groups.find(group => group.some(item => item.id === page.itemId)) ?? groups[0] ?? [];
        currentGroup.forEach(item => void validate(item.id));
    }, [groups, mode, page.itemId, validate]);

    useEffect(() => {
        if (mode !== 'VERTICAL') {
            restoredLayoutKeyRef.current = '';
            return;
        }
        const restorationKey = `${document.id}:${width}:${height}:${settings.gap}`;
        const layoutChanged = restoredLayoutKeyRef.current !== restorationKey;
        const externalChange = lastEmitted.current !== page.itemId;
        if (!layoutChanged && !externalChange) return;
        const target = layouts[page.index];
        if (!target) return;
        const fraction = !externalChange && anchor.current?.id === target.id ? anchor.current.fraction : 0;
        const offset = Math.max(0, target.y + fraction * target.height);
        restoredLayoutKeyRef.current = restorationKey;
        lastEmitted.current = page.itemId;
        offsetRef.current = offset;
        listRef.current?.scrollToOffset({ offset, animated: false });
    }, [document.id, height, layouts, mode, page.index, page.itemId, settings.gap, width]);

    useEffect(() => {
        if (settings.preload <= 0) return;
        const radius = Math.min(10, Math.trunc(settings.preload));
        const uris = document.items
            .slice(Math.max(0, page.index - radius), Math.min(document.items.length, page.index + radius + 1))
            .filter(item => item.id !== page.itemId)
            .map(item => (showOriginal && item.originalUri ? item.originalUri : item.primaryUri));
        if (uris.length) void Image.prefetch(uris).catch(() => undefined);
    }, [document.items, page.index, page.itemId, settings.preload, showOriginal]);

    const updateFromOffset = useCallback(
        (offset: number) => {
            offsetRef.current = offset;
            const id = dominantVisibleItem(layouts, offset, height);
            const index = id ? ids.indexOf(id) : -1;
            if (id && index >= 0) {
                anchor.current = { id, fraction: (offset - layouts[index].y) / layouts[index].height };
                lastEmitted.current = id;
                if (id !== location.itemId || index !== location.index) onLocationChange({ itemId: id, index });
            }
        },
        [height, ids, layouts, location.index, location.itemId, onLocationChange],
    );

    const renderSurface = (item: ImageReaderItem, surfaceWidth: number, surfaceHeight: number) => (
        <ImageSurface
            key={item.id}
            item={item}
            width={surfaceWidth}
            height={surfaceHeight}
            showOriginal={showOriginal}
            showDemoOverlay={document.sourceKind === 'DEMO'}
            integrity={integrity[item.id] ?? (onValidateItem ? 'checking' : 'valid')}
            saturation={settings.saturation}
            onRetry={() => {
                validatedRef.current.delete(item.id);
                setIntegrity(current => ({ ...current, [item.id]: onValidateItem ? 'checking' : 'valid' }));
                void validate(item.id, true);
            }}
        />
    );

    if (mode === 'VERTICAL') {
        return (
            <FlatList
                ref={listRef}
                testID="reader-vertical"
                onLayout={event => setViewport(event.nativeEvent.layout)}
                style={{ flex: 1, backgroundColor: readerBackgroundColor(settings.background, tokens) }}
                data={document.items as ImageReaderItem[]}
                renderItem={({ item, index }) => renderSurface(item, width, layouts[index]?.height ?? width)}
                keyExtractor={item => item.id}
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={5}
                removeClippedSubviews
                initialScrollIndex={page.index}
                getItemLayout={(_, index) => ({ length: layouts[index].height, offset: layouts[index].y, index })}
                ItemSeparatorComponent={() => <View style={{ height: settings.gap }} />}
                onViewableItemsChanged={info => visibleChanged.current(info)}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 1 }}
                onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => updateFromOffset(event.nativeEvent.contentOffset.y)}
                onScrollBeginDrag={event => onScrollPhase?.('dragStart', event)}
                onScrollEndDrag={event => onScrollPhase?.('dragEnd', event)}
                onMomentumScrollBegin={event => onScrollPhase?.('momentumStart', event)}
                onMomentumScrollEnd={event => onScrollPhase?.('momentumEnd', event)}
                scrollEventThrottle={32}
            />
        );
    }

    const groupIndex = Math.max(
        0,
        groups.findIndex(group => group.some(item => item.id === page.itemId)),
    );
    const group = groups[groupIndex] ?? groups[0] ?? [];
    const surfaceWidth = mode === 'DOUBLE' ? width / 2 : width;
    return (
        <ScrollView
            key={groupIndex}
            onLayout={event => setViewport(event.nativeEvent.layout)}
            testID="reader-paged"
            onScrollBeginDrag={event => onScrollPhase?.('dragStart', event)}
            onScrollEndDrag={event => onScrollPhase?.('dragEnd', event)}
            onMomentumScrollBegin={event => onScrollPhase?.('momentumStart', event)}
            onMomentumScrollEnd={event => onScrollPhase?.('momentumEnd', event)}
            contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
            style={{
                flex: 1,
                backgroundColor: readerBackgroundColor(settings.background, tokens),
            }}
        >
            {group.map(item => {
                const size = fittedImageSize(item, surfaceWidth, height, settings.fit);
                return (
                    <View key={item.id} style={{ width: surfaceWidth, alignItems: 'center' }}>
                        {renderSurface(item, size.width, size.height)}
                    </View>
                );
            })}
        </ScrollView>
    );
});
