import { useCallback, useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';

interface RangeSliderProps {
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

export function RangeSlider({
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
}: RangeSliderProps) {
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const [trackWidth, setTrackWidth] = useState(0);
    const startValue = useRef(value);
    const currentValue = useRef(value);
    currentValue.current = value;
    const range = maximum - minimum;
    const clamp = useCallback((next: number) => Math.min(maximum, Math.max(minimum, Math.round(next / step) * step)), [maximum, minimum, step]);
    const change = useCallback(
        (next: number) => {
            if (!disabled) onChange(clamp(next));
        },
        [clamp, disabled, onChange],
    );
    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => !disabled,
                onMoveShouldSetPanResponder: (_, gesture) => !disabled && Math.abs(gesture.dx) > 2,
                onPanResponderGrant: event => {
                    startValue.current = currentValue.current;
                    if (trackWidth > 0) change(minimum + (event.nativeEvent.locationX / trackWidth) * range);
                },
                onPanResponderMove: (_, gesture) => {
                    if (trackWidth > 0) change(startValue.current + (gesture.dx / trackWidth) * range);
                },
            }),
        [change, disabled, minimum, range, trackWidth],
    );
    const percentage = range === 0 ? 0 : ((value - minimum) / range) * 100;

    return (
        <View style={{ gap: spacing.sm, opacity: disabled ? 0.5 : 1 }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}>
                <View style={{ flex: 1, gap: spacing.xs }}>
                    <AppText variant="label">{label}</AppText>
                    {description ? (
                        <AppText variant="caption" tone="muted">
                            {description}
                        </AppText>
                    ) : null}
                </View>
                <AppText accessibilityLiveRegion="polite" variant="label" tone="accent">
                    {valueLabel(value)}
                </AppText>
            </View>
            <View
                {...panResponder.panHandlers}
                accessible
                accessibilityActions={[
                    { name: 'decrement', label: decrementLabel },
                    { name: 'increment', label: incrementLabel },
                ]}
                accessibilityLabel={label}
                accessibilityRole="adjustable"
                accessibilityState={{ disabled }}
                accessibilityValue={{ min: minimum, max: maximum, now: value, text: valueLabel(value) }}
                onAccessibilityAction={event => change(value + (event.nativeEvent.actionName === 'increment' ? step : -step))}
                onLayout={event => setTrackWidth(event.nativeEvent.layout.width)}
                style={{ justifyContent: 'center', minHeight: minimumTouchTarget }}
            >
                <View style={{ backgroundColor: tokens.inputBorder, borderRadius: radii.pill, height: 6, overflow: 'hidden' }}>
                    <View style={{ backgroundColor: tokens.accent, height: 6, width: `${percentage}%` }} />
                </View>
                <View
                    accessibilityElementsHidden
                    style={{
                        backgroundColor: tokens.surface,
                        borderColor: tokens.focus,
                        borderRadius: radii.pill,
                        borderWidth: 3,
                        height: 24,
                        left: `${percentage}%`,
                        marginLeft: -12,
                        position: 'absolute',
                        width: 24,
                    }}
                />
            </View>
        </View>
    );
}
