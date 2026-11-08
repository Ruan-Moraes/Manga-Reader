import { View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { Skeleton } from './Skeleton';

interface ListSkeletonProps {
    label: string;
    rows?: number;
    testID?: string;
}

const PRIMARY_LINE = { width: '60%', height: 14 } as const;
const SECONDARY_LINE = { width: '35%', height: 12 } as const;

/** Placeholder for a list of two-line rows while its content loads. */
export function ListSkeleton({ label, rows = 4, testID = 'list-skeleton' }: ListSkeletonProps) {
    const { metrics, radii, spacing, tokens } = useTheme();

    const count = Number.isFinite(rows) ? Math.max(1, Math.floor(rows)) : 1;
    const block = { backgroundColor: tokens.surfaceMuted };

    return (
        <View
            testID={testID}
            accessible
            accessibilityLabel={label}
            accessibilityLiveRegion="polite"
            role="status"
            style={{ backgroundColor: tokens.surface, borderColor: tokens.separator, borderRadius: radii.card, borderWidth: 1, overflow: 'hidden' }}
        >
            {Array.from({ length: count }, (_, index) => (
                <View
                    key={index}
                    testID={`${testID}-row`}
                    style={{
                        alignItems: 'center',
                        borderTopColor: tokens.separator,
                        borderTopWidth: index === 0 ? 0 : 1,
                        flexDirection: 'row',
                        gap: metrics.rhythm.itemGap,
                        minHeight: metrics.row.double,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                    }}
                >
                    <Skeleton width={metrics.iconTile.default} height={metrics.iconTile.default} borderRadius={radii.control} style={block} />
                    <View style={{ flex: 1, gap: spacing.sm }}>
                        <Skeleton width={PRIMARY_LINE.width} height={PRIMARY_LINE.height} style={block} />
                        <Skeleton width={SECONDARY_LINE.width} height={SECONDARY_LINE.height} style={block} />
                    </View>
                </View>
            ))}
        </View>
    );
}
