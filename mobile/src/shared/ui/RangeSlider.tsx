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

export function resolveRangeSliderValue(positionX: number, trackWidth: number, minimum: number, maximum: number, step: number): number {
    if (trackWidth <= 0 || maximum <= minimum) return minimum;
    const rawValue = minimum + (positionX / trackWidth) * (maximum - minimum);
    const steppedValue = minimum + Math.round((rawValue - minimum) / step) * step;
    return Math.min(maximum, Math.max(minimum, steppedValue));
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
    const [focused, setFocused] = useState(false);
    const gestureStartX = useRef(0);
    const currentValue = useRef(value);
    currentValue.current = value;
    const range = maximum - minimum;
    const clamp = useCallback(
        (next: number) => Math.min(maximum, Math.max(minimum, minimum + Math.round((next - minimum) / step) * step)),
        [maximum, minimum, step],
    );
    const change = useCallback(
        (next: number) => {
            if (!disabled) onChange(clamp(next));
        },
        [clamp, disabled, onChange],
    );
    const valueFromPosition = useCallback(
        (positionX: number) => (trackWidth > 0 ? resolveRangeSliderValue(positionX, trackWidth, minimum, maximum, step) : currentValue.current),
        [maximum, minimum, step, trackWidth],
    );
    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponderCapture: () => !disabled,
                onStartShouldSetPanResponder: () => !disabled,
                onMoveShouldSetPanResponder: (_, gesture) => !disabled && Math.abs(gesture.dx) > 2,
                onPanResponderGrant: event => {
                    gestureStartX.current = event.nativeEvent.locationX;
                    change(valueFromPosition(gestureStartX.current));
                },
                onPanResponderMove: (_, gesture) => {
                    change(valueFromPosition(gestureStartX.current + gesture.dx));
                },
            }),
        [change, disabled, valueFromPosition],
    );
    const percentage = range === 0 ? 0 : ((value - minimum) / range) * 100;

    return (
        <View style={{ gap: spacing.sm, opacity: disabled ? 0.5 : 1 }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
                <View style={{ flex: 1, gap: spacing.xs }}>
                    <AppText variant="label">{label}</AppText>
                    {description ? (
                        <AppText variant="caption" tone="muted">
                            {description}
                        </AppText>
                    ) : null}
                </View>
                <View style={{ backgroundColor: tokens.accentSoft, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}>
                    <AppText accessibilityLiveRegion="polite" variant="label" tone="accent">
                        {valueLabel(value)}
                    </AppText>
                </View>
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
                onBlur={() => setFocused(false)}
                onFocus={() => setFocused(true)}
                onAccessibilityAction={event => change(value + (event.nativeEvent.actionName === 'increment' ? step : -step))}
                onLayout={event => setTrackWidth(event.nativeEvent.layout.width)}
                style={{ justifyContent: 'center', minHeight: minimumTouchTarget }}
            >
                <View pointerEvents="none" style={{ backgroundColor: tokens.inputBorder, borderRadius: radii.pill, height: 6, overflow: 'hidden' }}>
                    <View style={{ backgroundColor: tokens.accent, height: 6, width: `${percentage}%` }} />
                </View>
                <View
                    accessibilityElementsHidden
                    pointerEvents="none"
                    style={{
                        backgroundColor: tokens.surface,
                        borderColor: focused ? tokens.focus : tokens.accentBorder,
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
