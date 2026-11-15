import { View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export type StatusChipStatus = 'waiting' | 'processing' | 'saved' | 'failed' | 'uncertain';

interface StatusChipProps {
    status: StatusChipStatus;
    label: string;
    testID?: string;
}

const ICONS: Record<StatusChipStatus, IconName> = {
    waiting: 'time-outline',
    processing: 'sync-outline',
    saved: 'checkmark-circle-outline',
    failed: 'alert-circle-outline',
    uncertain: 'help-circle-outline',
};

/** Compact state badge: icon + label + semantic soft surface, never colour alone. */
export function StatusChip({ status, label, testID = 'status-chip' }: StatusChipProps) {
    const { metrics, radii, spacing, tokens } = useTheme();
    const palette = {
        waiting: { background: tokens.surfaceMuted, color: tokens.muted },
        processing: { background: tokens.accentSoft, color: tokens.accentText },
        saved: { background: tokens.successSoft, color: tokens.success },
        failed: { background: tokens.dangerSoft, color: tokens.danger },
        uncertain: { background: tokens.warnSoft, color: tokens.warn },
    }[status];

    return (
        <View
            testID={testID}
            accessible
            accessibilityLabel={label}
            style={{
                alignItems: 'center',
                alignSelf: 'flex-start',
                backgroundColor: palette.background,
                borderRadius: radii.pill,
                flexDirection: 'row',
                gap: spacing.xs,
                minHeight: metrics.chip.count,
                paddingHorizontal: spacing.sm,
            }}
        >
            <Icon testID={`${testID}-icon`} name={ICONS[status]} size={metrics.icon.sm} color={palette.color} decorative />
            <AppText variant="caption" style={{ color: palette.color }} numberOfLines={1}>
                {label}
            </AppText>
        </View>
    );
}
