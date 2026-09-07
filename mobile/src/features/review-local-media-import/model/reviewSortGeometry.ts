import {
    REVIEW_AUTO_SCROLL_EDGE_SIZE,
    REVIEW_AUTO_SCROLL_SPEED,
    REVIEW_CARD_BORDER_WIDTH,
    REVIEW_IMAGE_ASPECT_RATIO,
    REVIEW_LIST_THUMBNAIL_WIDTH,
    REVIEW_SORT_HYSTERESIS,
    type ReviewViewMode,
} from '../config/reviewLayout';

export interface ReviewSortGeometry {
    columnCount: number;
    itemWidth: number;
    gap: number;
    rowPitch: number;
}

export const resolveReviewColumnCount = (mode: ReviewViewMode, columns: number): number => (mode === 'grid' ? columns : 1);

export const resolveReviewRowPitch = (mode: ReviewViewMode, itemWidth: number, gap: number): number =>
    (mode === 'grid'
        ? (itemWidth - REVIEW_CARD_BORDER_WIDTH * 2) / REVIEW_IMAGE_ASPECT_RATIO
        : REVIEW_LIST_THUMBNAIL_WIDTH / REVIEW_IMAGE_ASPECT_RATIO + gap * 2) +
    REVIEW_CARD_BORDER_WIDTH * 2 +
    gap;

export const reorderReviewItems = <T>(items: readonly T[], fromIndex: number, toIndex: number): T[] => {
    const nextItems = [...items];
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) return nextItems;
    const [movedItem] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, movedItem);
    return nextItems;
};

export const resolveReviewDropIndex = ({
    fromIndex,
    itemCount,
    columnCount,
    itemWidth,
    gap,
    rowPitch,
    translation,
    previousIndex,
}: ReviewSortGeometry & {
    fromIndex: number;
    itemCount: number;
    translation: { x: number; y: number };
    previousIndex?: number;
}): number => {
    'worklet';
    if (itemCount < 1) return fromIndex;
    const previous = previousIndex ?? fromIndex;
    const hysteresis = previousIndex === undefined ? 0 : REVIEW_SORT_HYSTERESIS;
    const rowPosition = Math.floor(fromIndex / columnCount) * rowPitch + translation.y;
    const columnPitch = itemWidth + gap;
    const columnPosition = (fromIndex % columnCount) * columnPitch + translation.x;
    const axis = (position: number, pitch: number, current: number) => {
        const candidate = Math.round(position / pitch);
        if (candidate > current && position < (current + 0.5) * pitch + hysteresis) return current;
        if (candidate < current && position > (current - 0.5) * pitch - hysteresis) return current;
        return candidate;
    };
    const row = Math.max(0, axis(rowPosition, rowPitch, Math.floor(previous / columnCount)));
    // Clamp columns independently: dragging beyond a row edge must not wrap to another row.
    const column = Math.max(0, Math.min(columnCount - 1, axis(columnPosition, columnPitch, previous % columnCount)));
    return Math.min(itemCount - 1, row * columnCount + column);
};

export function resolveReviewSlot(index: number, columnCount: number, itemWidth: number, gap: number, rowPitch: number) {
    'worklet';
    return { x: (index % columnCount) * (itemWidth + gap), y: Math.floor(index / columnCount) * rowPitch };
}

export function projectReviewIndex(index: number, fromIndex: number, toIndex: number) {
    'worklet';
    if (index === fromIndex) return toIndex;
    if (fromIndex < toIndex && index > fromIndex && index <= toIndex) return index - 1;
    if (fromIndex > toIndex && index >= toIndex && index < fromIndex) return index + 1;
    return index;
}

export function resolveReviewEdgeVelocity(y: number, height: number): number {
    'worklet';
    if (height <= 0) return 0;
    const edge = Math.min(REVIEW_AUTO_SCROLL_EDGE_SIZE, height / 2);
    const penetration = y < edge ? -Math.min(1, (edge - y) / edge) : y > height - edge ? Math.min(1, (y - height + edge) / edge) : 0;
    return Math.sign(penetration) * penetration * penetration * REVIEW_AUTO_SCROLL_SPEED;
}

export function resolveReviewTouchIndex({
    x,
    y,
    itemCount,
    mode,
    columnCount,
    itemWidth,
    gap,
    rowPitch,
}: ReviewSortGeometry & {
    x: number;
    y: number;
    itemCount: number;
    mode: ReviewViewMode;
}): number {
    'worklet';
    if (x < 0 || y < 0 || rowPitch <= 0) return -1;
    const row = Math.floor(y / rowPitch);
    const column = Math.floor(x / (itemWidth + gap));
    const index = row * columnCount + column;
    if (column >= columnCount || index >= itemCount) return -1;
    const inset = REVIEW_CARD_BORDER_WIDTH + (mode === 'list' ? gap : 0);
    const imageWidth = mode === 'grid' ? itemWidth - REVIEW_CARD_BORDER_WIDTH * 2 : REVIEW_LIST_THUMBNAIL_WIDTH;
    const localX = x - column * (itemWidth + gap) - inset;
    const localY = y - row * rowPitch - inset;
    return localX >= 0 && localX <= imageWidth && localY >= 0 && localY <= imageWidth / REVIEW_IMAGE_ASPECT_RATIO ? index : -1;
}

export const resolveReviewItemShift = ({
    index,
    fromIndex,
    toIndex,
    columnCount,
    itemWidth,
    gap,
    rowPitch,
}: ReviewSortGeometry & {
    index: number;
    fromIndex: number;
    toIndex: number;
}): { x: number; y: number } => {
    'worklet';
    let destination = index;
    if (fromIndex < 0 || toIndex < 0 || index === fromIndex) return { x: 0, y: 0 };
    if (fromIndex < toIndex && index > fromIndex && index <= toIndex) destination--;
    if (fromIndex > toIndex && index >= toIndex && index < fromIndex) destination++;
    return {
        x: ((destination % columnCount) - (index % columnCount)) * (itemWidth + gap),
        y: (Math.floor(destination / columnCount) - Math.floor(index / columnCount)) * rowPitch,
    };
};

export const resolveReviewScrollOffset = (offset: number, direction: number, elapsedMs: number, speed: number, maximumOffset: number): number => {
    'worklet';
    return Math.max(0, Math.min(maximumOffset, offset + (direction * speed * Math.min(elapsedMs, 32)) / 1000));
};
