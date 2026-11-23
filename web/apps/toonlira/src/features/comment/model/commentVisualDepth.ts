const MOBILE_MAX_VISUAL_DEPTH = 1;

export const getCommentVisualDepth = (depth: number, isDesktop: boolean): number =>
    isDesktop ? depth : Math.min(depth, MOBILE_MAX_VISUAL_DEPTH);
