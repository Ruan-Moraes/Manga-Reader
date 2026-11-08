import { View } from 'react-native';
import type { ReactNode } from 'react';

import { FONTS, useTheme } from '@/shared/theme';

import { AppText } from './AppText';

interface SectionHeaderProps {
    title: string;
    /** Count shown in a pill next to the title (for example "12" or "3 capítulos"). */
    count?: string | number;
    /** Usually `SectionAction` chips. */
    children?: ReactNode;
    testID?: string;
}

export function SectionHeader({ title, count, children, testID = 'section-header' }: SectionHeaderProps) {
    const { metrics, minimumTouchTarget, radii, spacing, tokens } = useTheme();

    return (
        <View
            testID={testID}
            style={{
                alignItems: 'center',
                flexDirection: 'row',
                gap: metrics.rhythm.itemGap,
                justifyContent: 'space-between',
                marginBottom: metrics.rhythm.itemGap,
                minHeight: minimumTouchTarget,
            }}
        >
            <View style={{ alignItems: 'center', flexDirection: 'row', flexShrink: 1, gap: spacing.sm, minWidth: 0 }}>
                <AppText accessibilityRole="header" variant="section" style={{ flexShrink: 1 }}>
                    {title}
                </AppText>
                {count !== undefined ? (
                    <View
                        testID={`${testID}-count`}
                        style={{
                            alignItems: 'center',
                            backgroundColor: tokens.surfaceMuted,
                            borderColor: tokens.separator,
                            borderRadius: radii.pill,
                            borderWidth: 1,
                            justifyContent: 'center',
                            minHeight: metrics.chip.count,
                            paddingHorizontal: spacing.sm,
                        }}
                    >
                        <AppText variant="caption" tone="muted" style={{ fontFamily: FONTS.bold }}>
                            {String(count)}
                        </AppText>
                    </View>
                ) : null}
            </View>
            {children ? <View style={{ alignItems: 'center', flexDirection: 'row', flexShrink: 0, gap: spacing.xs }}>{children}</View> : null}
        </View>
    );
}
