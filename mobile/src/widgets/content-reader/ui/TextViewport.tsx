import { type ComponentProps, createContext, memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { FlatList, type FlatListProps, Platform, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEFAULT_TEXT_READER_PREFERENCES, type TextReaderPreferences } from '@/entities/user-setting';
import { FONTS, useTheme } from '@/shared/theme';

import { type ReaderItemLayout, type ReaderLocation, restoreLocationById, type TextFlowDocument, type TextReaderBlock } from '../model/contentReader';
import {
    captureTextAnchor,
    estimatedTextLayouts,
    TEXT_COLUMN_WIDTH,
    TEXT_MARGINS,
    textReaderTypography,
    textReadingPercent,
    textRestoreOffset,
} from '../model/textReader';
import type { ReaderScrollHandler } from '../model/useReaderInteraction';

const MAX_RESTORE_ATTEMPTS = 8;
const MeasurementContext = createContext({ revision: '', report: (_revision: string, _box: ReaderItemLayout) => undefined as void });
type TextCellProps = ComponentProps<NonNullable<FlatListProps<TextReaderBlock>['CellRendererComponent']>>;

function TextCell({ item, children, onLayout, style }: TextCellProps) {
    const { revision, report } = useContext(MeasurementContext);
    const ref = useRef<View>(null);
    useLayoutEffect(() => {
        // A font-family change may leave height unchanged, so request a fresh native measurement as well.
        const frame = requestAnimationFrame(() =>
            ref.current?.measure((_x, y, _width, height) => {
                if (height > 0) report(revision, { id: item.id, y, height });
            }),
        );
        return () => cancelAnimationFrame(frame);
    }, [item.id, report, revision]);
    return (
        <View
            ref={ref}
            collapsable={false}
            testID={`novel-cell-${item.id}`}
            style={style}
            onLayout={event => {
                onLayout?.(event);
                report(revision, { id: item.id, y: event.nativeEvent.layout.y, height: event.nativeEvent.layout.height });
            }}
        >
            {children}
        </View>
    );
}

function TextBlock({ block, preferences }: { block: TextReaderBlock; preferences: TextReaderPreferences }) {
    const { spacing, tokens } = useTheme();
    const body = textReaderTypography(preferences, Platform.OS);
    if (block.type === 'divider') return <View style={{ height: 1, backgroundColor: tokens.separator, marginVertical: spacing.sm }} />;
    if (block.type === 'image')
        return (
            <Image
                source={{ uri: block.uri }}
                contentFit="contain"
                accessibilityLabel={block.description}
                style={{ width: '100%', aspectRatio: block.width / Math.max(1, block.height) }}
            />
        );
    if (block.type === 'heading')
        return (
            <Text
                allowFontScaling
                accessibilityRole="header"
                style={[
                    body,
                    {
                        color: tokens.text,
                        fontSize: preferences.fontSize * 1.35,
                        lineHeight: preferences.fontSize * 1.7,
                        fontFamily: preferences.fontFamily === 'APP' ? FONTS.bold : body.fontFamily,
                        fontWeight: preferences.fontFamily === 'SERIF' ? '700' : undefined,
                        marginTop: spacing.sm,
                    },
                ]}
            >
                {block.text}
            </Text>
        );
    return (
        <View style={block.type === 'dialogue' ? { paddingLeft: spacing.md, borderLeftWidth: 2, borderLeftColor: tokens.separator } : undefined}>
            {block.type === 'dialogue' && block.speaker ? (
                <Text allowFontScaling style={[body, { color: tokens.muted, fontSize: preferences.fontSize * 0.85 }]}>
                    {block.speaker}
                </Text>
            ) : null}
            <Text allowFontScaling style={[body, { color: tokens.text }]}>
                {block.text}
            </Text>
        </View>
    );
}

interface TextViewportProps {
    document: TextFlowDocument;
    location?: ReaderLocation;
    preferences?: TextReaderPreferences;
    onLocationChange?(location: ReaderLocation): void;
    onProgressChange?(percent: number): void;
    onScrollPhase?: ReaderScrollHandler;
}

export const TextViewport = memo(function TextViewport({
    document,
    location,
    preferences = DEFAULT_TEXT_READER_PREFERENCES,
    onLocationChange,
    onProgressChange,
    onScrollPhase,
}: TextViewportProps) {
    const { spacing, tokens } = useTheme();
    const { width, fontScale } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const margin = TEXT_MARGINS[preferences.margins];
    const columnWidth = Math.max(1, Math.min(TEXT_COLUMN_WIDTH, width - insets.left - insets.right - margin * 2));
    const readingInset = insets.top + spacing.md;
    const body = useMemo(() => textReaderTypography(preferences, Platform.OS), [preferences]);
    const revision = `${document.id}:${columnWidth}:${fontScale}:${preferences.fontFamily}:${preferences.fontSize}:${preferences.lineSpacing}:${readingInset}:${spacing.md}`;
    const ids = useMemo(() => document.blocks.map(block => block.id), [document.blocks]);
    const restored = useMemo(() => restoreLocationById(ids, location ?? document.initialLocation), [ids, location, document.initialLocation]);
    const lastRequested = useRef(restored);
    const listRef = useRef<FlatList<TextReaderBlock>>(null);
    const measured = useRef(new Map<string, ReaderItemLayout>());
    const activeRevision = useRef('');
    const anchor = useRef(restored);
    const pending = useRef<ReaderLocation | null>(restored);
    const lastEmitted = useRef<ReaderLocation | null>(null);
    const lastPercent = useRef(-1);
    const offset = useRef(0);
    const contentHeight = useRef(0);
    const viewportHeight = useRef(0);
    const attempts = useRef(0);
    const frame = useRef<number | null>(null);
    const mounted = useRef(true);
    const layoutCache = useRef<ReaderItemLayout[] | null>(null);
    const current = useRef({ document, body, fontScale, columnWidth, readingInset, gap: spacing.md, onLocationChange, onProgressChange });
    useLayoutEffect(() => {
        current.current = { document, body, fontScale, columnWidth, readingInset, gap: spacing.md, onLocationChange, onProgressChange };
    });

    const layouts = useCallback(() => {
        const c = current.current;
        layoutCache.current ??= estimatedTextLayouts(c.document.blocks, measured.current, c.columnWidth, c.body, c.fontScale, c.readingInset, c.gap);
        return layoutCache.current;
    }, []);
    const publish = useCallback(
        (force = false) => {
            if (pending.current || viewportHeight.current <= 0) return;
            const c = current.current;
            const boxes = layouts();
            anchor.current = captureTextAnchor(boxes, offset.current + c.readingInset);
            if (force || lastEmitted.current?.itemId !== anchor.current.itemId) {
                lastEmitted.current = anchor.current;
                c.onLocationChange?.(anchor.current);
            }
            const percent = textReadingPercent(c.document.blocks, boxes, offset.current, viewportHeight.current, contentHeight.current);
            if (percent !== lastPercent.current) {
                lastPercent.current = percent;
                c.onProgressChange?.(percent);
            }
        },
        [layouts],
    );
    const restore = useCallback(() => {
        if (!mounted.current || !pending.current) return;
        const target = pending.current;
        const box = measured.current.get(target.itemId);
        if (box) {
            const nextOffset = textRestoreOffset(box, target, current.current.readingInset);
            listRef.current?.scrollToOffset({ offset: nextOffset, animated: false });
            offset.current = nextOffset;
            anchor.current = target;
            lastEmitted.current = target;
            pending.current = null;
            current.current.onLocationChange?.(target);
            publish();
        } else if (attempts.current < MAX_RESTORE_ATTEMPTS) {
            attempts.current += 1;
            listRef.current?.scrollToIndex({ index: target.index, animated: false, viewOffset: current.current.readingInset });
        }
    }, [publish]);
    const scheduleRestore = useCallback(() => {
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
            frame.current = null;
            restore();
        });
    }, [restore]);
    const report = useCallback(
        (key: string, box: ReaderItemLayout) => {
            if (key !== activeRevision.current || box.height <= 0) return;
            measured.current.set(box.id, box);
            layoutCache.current = null;
            if (pending.current) scheduleRestore();
            else publish();
        },
        [publish, scheduleRestore],
    );
    const measurement = useMemo(() => ({ revision, report }), [report, revision]);
    useLayoutEffect(() => {
        const changedRequest = lastRequested.current.itemId !== restored.itemId || lastRequested.current.itemOffsetRatio !== restored.itemOffsetRatio;
        const external =
            changedRequest && (lastEmitted.current?.itemId !== restored.itemId || lastEmitted.current?.itemOffsetRatio !== restored.itemOffsetRatio);
        lastRequested.current = restored;
        if (activeRevision.current !== revision) {
            pending.current = external ? restored : anchor.current;
            activeRevision.current = revision;
            measured.current.clear();
            layoutCache.current = null;
            attempts.current = 0;
            scheduleRestore();
        } else if (
            external &&
            (!pending.current || pending.current.itemId !== restored.itemId || pending.current.itemOffsetRatio !== restored.itemOffsetRatio)
        ) {
            pending.current = restored;
            attempts.current = 0;
            scheduleRestore();
        }
    }, [restored, revision, scheduleRestore]);
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            if (frame.current !== null) cancelAnimationFrame(frame.current);
        };
    }, []);
    return (
        <MeasurementContext.Provider value={measurement}>
            <FlatList
                testID="reader-text-flow"
                ref={listRef}
                data={document.blocks as TextReaderBlock[]}
                keyExtractor={block => block.id}
                CellRendererComponent={TextCell}
                onLayout={event => {
                    viewportHeight.current = event.nativeEvent.layout.height;
                    publish();
                }}
                onContentSizeChange={(_width, height) => {
                    contentHeight.current = height;
                    if (pending.current) scheduleRestore();
                    else publish();
                }}
                onScroll={event => {
                    offset.current = event.nativeEvent.contentOffset.y;
                    publish();
                }}
                scrollEventThrottle={32}
                onScrollBeginDrag={event => {
                    pending.current = null;
                    if (frame.current !== null) cancelAnimationFrame(frame.current);
                    onScrollPhase?.('dragStart', event);
                }}
                onScrollEndDrag={event => {
                    publish(true);
                    onScrollPhase?.('dragEnd', event);
                }}
                onMomentumScrollBegin={event => onScrollPhase?.('momentumStart', event)}
                onMomentumScrollEnd={event => {
                    publish(true);
                    onScrollPhase?.('momentumEnd', event);
                }}
                onScrollToIndexFailed={({ index, averageItemLength }) => {
                    if (!pending.current || attempts.current >= MAX_RESTORE_ATTEMPTS) return;
                    listRef.current?.scrollToOffset({ offset: Math.max(0, averageItemLength * index - readingInset), animated: false });
                    scheduleRestore();
                }}
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={7}
                contentContainerStyle={{ alignSelf: 'center', width: columnWidth, paddingTop: readingInset, paddingBottom: insets.bottom + spacing.md }}
                style={{ flex: 1, backgroundColor: tokens.bg }}
                renderItem={({ item }) => (
                    <View style={{ paddingBottom: spacing.md }}>
                        <TextBlock block={item} preferences={preferences} />
                    </View>
                )}
            />
        </MeasurementContext.Provider>
    );
});
