import { type ReactElement, type ReactNode, useMemo, useState } from 'react';
import { type CellRendererProps, FlatList, Platform, useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';

import type { LocalMediaImportItem } from '@/src/entities/local-media-import';
import { useTheme } from '@/src/shared/theme';

import type { ReviewViewMode } from '../config/reviewLayout';
import { resolveReviewColumnCount, resolveReviewRowPitch } from '../model/reviewSortGeometry';
import { useReviewPanGesture } from '../model/useReviewPanGesture';
import { useSortableReviewDrag } from '../model/useSortableReviewDrag';
import { ReviewDropIndicator, type SortableRenderItemInfo, SortableReviewItem } from './SortableReviewItem';

const AnimatedReviewFlatList = Reanimated.createAnimatedComponent(FlatList<LocalMediaImportItem>);

interface Props {
    items: LocalMediaImportItem[];
    mode: ReviewViewMode;
    columns: number;
    busy: boolean;
    footer: ReactElement;
    renderItem: (info: SortableRenderItemInfo) => ReactNode;
    onReorder: (items: LocalMediaImportItem[]) => void;
    onDragStart: (item: LocalMediaImportItem) => void;
    onDragEnd: () => void;
}

function ReviewListLayout({ availableWidth, ...props }: Props & { availableWidth: number }) {
    const { mode, columns, busy, footer, renderItem } = props;
    const { spacing, effectiveReduceMotion } = useTheme();
    const grid = mode === 'grid';
    const columnCount = resolveReviewColumnCount(mode, columns);
    const itemWidth = Math.max(1, (availableWidth - (columnCount - 1) * spacing.sm) / columnCount);
    const drag = useSortableReviewDrag({
        ...props,
        reduceMotion: effectiveReduceMotion,
        columnCount,
        itemWidth,
        gap: spacing.sm,
        rowPitch: resolveReviewRowPitch(mode, itemWidth, spacing.sm),
    });
    const { gesture, scrollGesture } = useReviewPanGesture({ ...drag, mode, busy, columnCount, itemWidth, gap: spacing.sm });
    const { activeIndex } = drag.state;
    // iOS stacks FlatList rows as siblings, so the active row must rise with its item.
    const CellRenderer = useMemo(
        () =>
            function ReviewRow({ children, index, style, onLayout, onFocusCapture }: CellRendererProps<LocalMediaImportItem>) {
                const rowStyle = useAnimatedStyle(() => ({
                    zIndex: activeIndex.value >= 0 && Math.floor(activeIndex.value / columnCount) === index ? 100 : 0,
                }));
                return (
                    <Reanimated.View style={[style, rowStyle]} onLayout={onLayout} {...{ onFocusCapture }}>
                        {children}
                    </Reanimated.View>
                );
            },
        [activeIndex, columnCount],
    );

    return (
        <GestureDetector gesture={gesture}>
            <View testID="review-sortable-viewport" ref={drag.containerRef} collapsable={false} style={{ flex: 1, minHeight: 0 }} onLayout={drag.onLayout}>
                <GestureDetector gesture={scrollGesture}>
                    <AnimatedReviewFlatList
                        ref={drag.listRef}
                        testID={`local-media-review-list-${mode}`}
                        data={drag.displayItems}
                        keyExtractor={item => item.id}
                        CellRendererComponent={CellRenderer}
                        renderItem={({ item, index }) => (
                            <SortableReviewItem
                                item={item}
                                index={index}
                                columnCount={columnCount}
                                itemWidth={itemWidth}
                                state={drag.state}
                                layoutCommitted={drag.presentation?.reconciled}
                                onRowHeightChange={drag.onRowHeightChange}
                                landingRef={drag.presentation?.handoff && item.id === drag.presentation.item.id ? drag.landingRef : undefined}
                                renderItem={renderItem}
                            />
                        )}
                        numColumns={columnCount}
                        columnWrapperStyle={grid && columnCount > 1 ? { gap: spacing.sm } : undefined}
                        initialNumToRender={grid ? 8 : 6}
                        maxToRenderPerBatch={8}
                        windowSize={5}
                        // RN 0.81 Fabric corrupts child indices when clipping toggles on iOS (react-native#56211).
                        // FlatList's render window remains bounded even with native clipping disabled.
                        removeClippedSubviews={Platform.OS === 'android' && !drag.dragging}
                        scrollEnabled={!drag.dragging}
                        scrollEventThrottle={16}
                        onScroll={drag.onScroll}
                        onContentSizeChange={drag.onContentSizeChange}
                        style={{ flex: 1, minHeight: 0 }}
                        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xs }}
                        ListFooterComponent={footer}
                    />
                </GestureDetector>
                <ReviewDropIndicator state={drag.state} columnCount={columnCount} itemWidth={itemWidth} />
                {drag.presentation ? (
                    <SortableReviewItem
                        key={drag.presentation.token}
                        item={drag.presentation.item}
                        index={drag.presentation.index}
                        columnCount={columnCount}
                        itemWidth={itemWidth}
                        state={drag.state}
                        overlay
                        onOverlayLayout={() => drag.showOverlay(drag.presentation!.token)}
                        renderItem={renderItem}
                    />
                ) : null}
            </View>
        </GestureDetector>
    );
}

export function SortableReviewList(props: Props) {
    const { width: windowWidth } = useWindowDimensions();
    const { spacing, textStyles } = useTheme();
    const [availableWidth, setAvailableWidth] = useState(Math.max(1, windowWidth - spacing.md * 2));

    return (
        <View
            testID="review-sortable-container"
            style={{ flex: 1, minHeight: 0 }}
            onLayout={event => {
                const { width } = event.nativeEvent.layout;
                if (width > 0 && Math.abs(width - availableWidth) > 0.5) setAvailableWidth(width);
            }}
        >
            <ReviewListLayout
                key={`${props.mode}-${props.columns}-${availableWidth}-${spacing.sm}-${textStyles.body.fontSize}`}
                {...props}
                availableWidth={availableWidth}
            />
        </View>
    );
}
