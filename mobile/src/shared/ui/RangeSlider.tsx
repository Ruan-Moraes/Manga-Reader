import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import NativeSlider from '@react-native-community/slider';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';

export const RANGE_SLIDER_THUMB_SIZE = 24;
export const RANGE_SLIDER_THUMB_RADIUS = RANGE_SLIDER_THUMB_SIZE / 2;

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

export function resolveRangeSliderValue(positionX: number, trackWidth: number, minimum: number, maximum: number, step: number, thumbRadius = 0): number {
    const usableTrackWidth = trackWidth - thumbRadius * 2;
    if (usableTrackWidth <= 0 || maximum <= minimum) return minimum;
    const rawValue = minimum + ((positionX - thumbRadius) / usableTrackWidth) * (maximum - minimum);
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
    const [focused, setFocused] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [draftValue, setDraftValue] = useState<number | null>(null);
    const [trackWidth, setTrackWidth] = useState(0);
    const interactionValueRef = useRef(value);
    const pendingValueRef = useRef<number | null>(null);
    const valueRef = useRef(value);
    valueRef.current = value;
    const configurationRef = useRef({ disabled, maximum, minimum, onChange, step });
    configurationRef.current = { disabled, maximum, minimum, onChange, step };
    const range = maximum - minimum;
    const updateDraft = useCallback((next: number) => {
        const configuration = configurationRef.current;
        if (configuration.disabled) return interactionValueRef.current;
        const normalized = Math.min(
            configuration.maximum,
            Math.max(configuration.minimum, configuration.minimum + Math.round((next - configuration.minimum) / configuration.step) * configuration.step),
        );
        if (interactionValueRef.current !== normalized) {
            interactionValueRef.current = normalized;
            setDraftValue(normalized);
        }
        return normalized;
    }, []);
    const commit = useCallback(
        (next: number) => {
            const normalized = updateDraft(next);
            pendingValueRef.current = normalized;
            setDraftValue(normalized);
            if (!configurationRef.current.disabled && normalized !== valueRef.current) configurationRef.current.onChange(normalized);
        },
        [updateDraft],
    );
    const handleSlidingStart = useCallback(
        (next: number) => {
            if (configurationRef.current.disabled) return;
            pendingValueRef.current = null;
            interactionValueRef.current = valueRef.current;
            setDragging(true);
            updateDraft(next);
        },
        [updateDraft],
    );
    const handleValueChange = useCallback(
        (next: number) => {
            if (configurationRef.current.disabled) return;
            updateDraft(next);
        },
        [updateDraft],
    );
    const handleSlidingComplete = useCallback(
        (next: number) => {
            setDragging(false);
            commit(next);
        },
        [commit],
    );
    const displayedValue = draftValue ?? value;
    const percentage = range === 0 ? 0 : ((displayedValue - minimum) / range) * 100;
    const thumbLeft = (percentage / 100) * Math.max(0, trackWidth - RANGE_SLIDER_THUMB_SIZE);

    useEffect(() => {
        if (dragging) return;

        if (pendingValueRef.current !== null) {
            if (value !== pendingValueRef.current) return;
            pendingValueRef.current = null;
        }

        interactionValueRef.current = value;
        if (draftValue !== null) setDraftValue(null);
    }, [draftValue, dragging, value]);

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
                        {valueLabel(displayedValue)}
                    </AppText>
                </View>
            </View>
            <View style={{ justifyContent: 'center', minHeight: minimumTouchTarget }}>
                <View
                    pointerEvents="none"
                    style={{
                        backgroundColor: tokens.inputBorder,
                        borderRadius: radii.pill,
                        height: 6,
                        marginHorizontal: RANGE_SLIDER_THUMB_RADIUS,
                        overflow: 'hidden',
                    }}
                    testID="range-slider-rail"
                >
                    <View style={{ backgroundColor: tokens.accent, height: 6, width: `${percentage}%` }} />
                </View>
                <View
                    accessibilityElementsHidden
                    pointerEvents="none"
                    testID="range-slider-thumb"
                    style={{
                        backgroundColor: tokens.surface,
                        borderColor: focused ? tokens.focus : tokens.accentBorder,
                        borderRadius: radii.pill,
                        borderWidth: 3,
                        height: RANGE_SLIDER_THUMB_SIZE,
                        left: thumbLeft,
                        position: 'absolute',
                        width: RANGE_SLIDER_THUMB_SIZE,
                    }}
                />
                <NativeSlider
                    accessible
                    accessibilityActions={[
                        { name: 'decrement', label: decrementLabel },
                        { name: 'increment', label: incrementLabel },
                    ]}
                    accessibilityLabel={label}
                    accessibilityRole="adjustable"
                    accessibilityValue={{ max: maximum, min: minimum, now: displayedValue, text: valueLabel(displayedValue) }}
                    disabled={disabled}
                    maximumTrackTintColor="transparent"
                    maximumValue={maximum}
                    minimumTrackTintColor="transparent"
                    minimumValue={minimum}
                    onSlidingComplete={handleSlidingComplete}
                    onSlidingStart={handleSlidingStart}
                    onValueChange={handleValueChange}
                    onAccessibilityAction={event => {
                        if (event.nativeEvent.actionName === 'increment') commit(displayedValue + step);
                        if (event.nativeEvent.actionName === 'decrement') commit(displayedValue - step);
                    }}
                    onBlur={() => setFocused(false)}
                    onFocus={() => setFocused(true)}
                    onLayout={event => {
                        const width = event.nativeEvent.layout.width;
                        setTrackWidth(currentWidth => (currentWidth === width ? currentWidth : width));
                    }}
                    step={step}
                    style={{ height: minimumTouchTarget, left: 0, position: 'absolute', right: 0 }}
                    testID="range-slider-native"
                    thumbTintColor="transparent"
                    value={dragging ? undefined : (pendingValueRef.current ?? value)}
                />
            </View>
            <View accessibilityElementsHidden style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="caption" tone="muted">
                    {valueLabel(minimum)}
                </AppText>
                <AppText variant="caption" tone="muted">
                    {valueLabel(maximum)}
                </AppText>
            </View>
        </View>
    );
}
