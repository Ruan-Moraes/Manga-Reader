import { useWindowDimensions } from 'react-native';

export const RESPONSIVE_BREAKPOINTS = {
    compact: 360,
    medium: 600,
    expanded: 840,
} as const;

export type ResponsiveSizeClass = 'compact' | 'regular' | 'medium' | 'expanded';
export type ResponsiveOrientation = 'landscape' | 'portrait';

export interface ResponsiveLayout {
    sizeClass: ResponsiveSizeClass;
    orientation: ResponsiveOrientation;
    contentMaxWidth: number;
    formMaxWidth: number;
    reviewColumns: number;
    lowHeight: boolean;
}

const REVIEW_ITEM_MIN_WIDTH = 148;
const REVIEW_GAP = 8;

export function resolveResponsiveLayout(width: number, height: number): ResponsiveLayout {
    const sizeClass: ResponsiveSizeClass =
        width < RESPONSIVE_BREAKPOINTS.compact
            ? 'compact'
            : width < RESPONSIVE_BREAKPOINTS.medium
              ? 'regular'
              : width < RESPONSIVE_BREAKPOINTS.expanded
                ? 'medium'
                : 'expanded';
    const availableWidth = Math.min(width - (sizeClass === 'compact' ? 32 : 40), sizeClass === 'expanded' ? 720 : 600);
    const safeColumns = Math.max(1, Math.floor((availableWidth + REVIEW_GAP) / (REVIEW_ITEM_MIN_WIDTH + REVIEW_GAP)));

    return {
        sizeClass,
        orientation: width > height ? 'landscape' : 'portrait',
        contentMaxWidth: sizeClass === 'expanded' ? 720 : 600,
        formMaxWidth: 440,
        reviewColumns: Math.min(sizeClass === 'expanded' ? 4 : 2, safeColumns),
        lowHeight: height < 600,
    };
}

export function useResponsiveLayout(): ResponsiveLayout {
    const { width, height } = useWindowDimensions();
    return resolveResponsiveLayout(width, height);
}
