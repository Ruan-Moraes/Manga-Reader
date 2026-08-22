import { View } from 'react-native';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';
import { IconButton } from './IconButton';

interface StepperControlProps {
    label: string;
    description?: string;
    value: number;
    minimum: number;
    maximum: number;
    step?: number;
    valueLabel?: (value: number) => string;
    decrementLabel: string;
    incrementLabel: string;
    onChange: (value: number) => void;
    disabled?: boolean;
}

export function StepperControl({
    label,
    description,
    value,
    minimum,
    maximum,
    step = 1,
    valueLabel = String,
    decrementLabel,
    incrementLabel,
    onChange,
    disabled = false,
}: StepperControlProps) {
    const { radii, spacing, tokens } = useTheme();

    return (
        <View style={{ gap: spacing.sm, opacity: disabled ? 0.5 : 1 }}>
            <View style={{ flex: 1, gap: spacing.xs }}>
                <AppText variant="label">{label}</AppText>
                {description ? (
                    <AppText variant="caption" tone="muted">
                        {description}
                    </AppText>
                ) : null}
            </View>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                <IconButton
                    accessibilityLabel={decrementLabel}
                    disabled={disabled || value <= minimum}
                    icon="remove"
                    onPress={() => onChange(Math.max(minimum, value - step))}
                    surface="surface"
                />
                <View style={{ alignItems: 'center', backgroundColor: tokens.surfaceMuted, borderRadius: radii.control, flex: 1, padding: spacing.sm }}>
                    <AppText accessibilityLiveRegion="polite" variant="label" tone="accent">
                        {valueLabel(value)}
                    </AppText>
                </View>
                <IconButton
                    accessibilityLabel={incrementLabel}
                    disabled={disabled || value >= maximum}
                    icon="add"
                    onPress={() => onChange(Math.min(maximum, value + step))}
                    surface="surface"
                />
            </View>
        </View>
    );
}
