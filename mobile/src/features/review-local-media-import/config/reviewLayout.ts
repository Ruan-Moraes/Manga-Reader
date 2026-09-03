export type ReviewViewMode = 'grid' | 'list';

export const REVIEW_IMAGE_ASPECT_RATIO = 3 / 4;
export const REVIEW_LIST_THUMBNAIL_WIDTH = 88;
export const REVIEW_DRAG_LONG_PRESS_MS = 200;
export const REVIEW_CARD_BORDER_WIDTH = 1;
export const REVIEW_DROP_INDICATOR_WIDTH = 3;
export const REVIEW_DRAG_ACTIVATION_FAIL_OFFSET = 32;
export const REVIEW_AUTO_SCROLL_EDGE_SIZE = 56;
export const REVIEW_AUTO_SCROLL_SPEED = 480;
export const REVIEW_DRAG_LIFT_MS = 120;
export const REVIEW_ITEM_SHIFT_MS = 160;
export const REVIEW_DRAG_SETTLE_MS = 180;
export const REVIEW_AUTO_SCROLL_ACCELERATION_MS = 100;
export const REVIEW_SORT_HYSTERESIS = 8;

export const REVIEW_DRAG_PHASE = { idle: 0, dragging: 1, settling: 2, cancelling: 3 } as const;
