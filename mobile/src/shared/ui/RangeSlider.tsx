import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/shared/theme';

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

export function normalizeRangeSliderValue(value: number, minimum: number, maximum: number, step: number): number {
    'worklet';
    if (maximum <= minimum) return minimum;

    const safeStep = step > 0 ? step : 1;
    const boundedValue = Math.min(maximum, Math.max(minimum, value));
    const steppedValue = minimum + Math.round((boundedValue - minimum) / safeStep) * safeStep;
    return Math.min(maximum, Math.max(minimum, steppedValue));
}

export function resolveRangeSliderValue(positionX: number, trackWidth: number, minimum: number, maximum: number, step: number, thumbRadius = 0): number {
    'worklet';
    const usableTrackWidth = trackWidth - thumbRadius * 2;
    if (usableTrackWidth <= 0 || maximum <= minimum) return minimum;

    const boundedPosition = Math.min(trackWidth - thumbRadius, Math.max(thumbRadius, positionX));
    const rawValue = minimum + ((boundedPosition - thumbRadius) / usableTrackWidth) * (maximum - minimum);
    return normalizeRangeSliderValue(rawValue, minimum, maximum, step);
}

export function resolveRangeSliderThumbPosition(value: number, trackWidth: number, minimum: number, maximum: number, thumbRadius = 0): number {
    'worklet';
    const usableTrackWidth = trackWidth - thumbRadius * 2;
    if (usableTrackWidth <= 0 || maximum <= minimum) return thumbRadius;

    const boundedValue = Math.min(maximum, Math.max(minimum, value));
    return thumbRadius + ((boundedValue - minimum) / (maximum - minimum)) * usableTrackWidth;
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
    const normalizedValue = normalizeRangeSliderValue(value, minimum, maximum, step);
    const [focused, setFocused] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [draftValue, setDraftValue] = useState<number | null>(null);
    const controlledValueRef = useRef(normalizedValue);
    const interactionValueRef = useRef(normalizedValue);
    const pendingValueRef = useRef<number | null>(null);
    const activeGestureIdRef = useRef<number | null>(null);
    const settledGestureIdRef = useRef(0);
    const configurationRef = useRef({ disabled, maximum, minimum, onChange, step });
    const trackWidth = useSharedValue(0);
    const thumbX = useSharedValue(RANGE_SLIDER_THUMB_RADIUS);
    const interactionValue = useSharedValue(normalizedValue);
    const controlledValue = useSharedValue(normalizedValue);
    const gestureActive = useSharedValue(false);
    const awaitingConfirmation = useSharedValue(false);
    const panStartedOnThumb = useSharedValue(false);
    const panThumbStartX = useSharedValue(RANGE_SLIDER_THUMB_RADIUS);
    const panTouchStartX = useSharedValue(0);
    const panWasActive = useSharedValue(false);
    const gestureSequence = useSharedValue(0);

    controlledValueRef.current = normalizedValue;
    configurationRef.current = { disabled, maximum, minimum, onChange, step };

    const applyVisualValue = useCallback(
        (next: number) => {
            const configuration = configurationRef.current;
            const normalized = normalizeRangeSliderValue(next, configuration.minimum, configuration.maximum, configuration.step);
            interactionValueRef.current = normalized;
            interactionValue.value = normalized;
            thumbX.value = resolveRangeSliderThumbPosition(
                normalized,
                trackWidth.value,
                configuration.minimum,
                configuration.maximum,
                RANGE_SLIDER_THUMB_RADIUS,
            );
            setDraftValue(current => (current === normalized ? current : normalized));
            return normalized;
        },
        [interactionValue, thumbX, trackWidth],
    );

    const startGesture = useCallback((gestureId: number, next: number) => {
        if (gestureId <= settledGestureIdRef.current) return;

        activeGestureIdRef.current = gestureId;
        pendingValueRef.current = null;
        interactionValueRef.current = next;
        setDragging(true);
        setDraftValue(current => (current === next ? current : next));
    }, []);

    const updateGestureValue = useCallback((gestureId: number, next: number) => {
        if (activeGestureIdRef.current !== gestureId || gestureId <= settledGestureIdRef.current) return;

        interactionValueRef.current = next;
        setDraftValue(current => (current === next ? current : next));
    }, []);

    const commitGesture = useCallback(
        (gestureId: number, next: number) => {
            if (gestureId <= settledGestureIdRef.current) return;

            const configuration = configurationRef.current;
            const normalized = normalizeRangeSliderValue(next, configuration.minimum, configuration.maximum, configuration.step);
            settledGestureIdRef.current = gestureId;
            activeGestureIdRef.current = null;
            interactionValueRef.current = normalized;
            pendingValueRef.current = normalized;
            setDragging(false);
            setDraftValue(current => (current === normalized ? current : normalized));

            if (normalized === controlledValueRef.current) {
                pendingValueRef.current = null;
                awaitingConfirmation.value = false;
                return;
            }

            configuration.onChange(normalized);
        },
        [awaitingConfirmation],
    );

    const cancelGesture = useCallback(
        (gestureId: number) => {
            if (gestureId <= settledGestureIdRef.current) return;

            settledGestureIdRef.current = gestureId;
            activeGestureIdRef.current = null;
            pendingValueRef.current = null;
            setDragging(false);
            setDraftValue(null);
            applyVisualValue(controlledValueRef.current);
            setDraftValue(null);
            awaitingConfirmation.value = false;
        },
        [applyVisualValue, awaitingConfirmation],
    );

    const commitAccessibilityValue = useCallback(
        (next: number) => {
            if (configurationRef.current.disabled) return;

            const normalized = applyVisualValue(next);
            pendingValueRef.current = normalized;
            awaitingConfirmation.value = true;
            if (normalized === controlledValueRef.current) {
                pendingValueRef.current = null;
                awaitingConfirmation.value = false;
                return;
            }

            configurationRef.current.onChange(normalized);
        },
        [applyVisualValue, awaitingConfirmation],
    );

    useEffect(() => {
        controlledValue.value = normalizedValue;

        if (gestureActive.value || awaitingConfirmation.value || activeGestureIdRef.current !== null || pendingValueRef.current !== null) {
            if (pendingValueRef.current === normalizedValue) {
                pendingValueRef.current = null;
                awaitingConfirmation.value = false;
                interactionValueRef.current = normalizedValue;
                setDraftValue(null);
            }
            return;
        }

        interactionValueRef.current = normalizedValue;
        interactionValue.value = normalizedValue;
        thumbX.value = resolveRangeSliderThumbPosition(normalizedValue, trackWidth.value, minimum, maximum, RANGE_SLIDER_THUMB_RADIUS);
        if (draftValue !== null) setDraftValue(null);
    }, [awaitingConfirmation, controlledValue, draftValue, gestureActive, interactionValue, maximum, minimum, normalizedValue, thumbX, trackWidth]);

    const handleLayout = useCallback(
        (event: LayoutChangeEvent) => {
            const width = event.nativeEvent.layout.width;
            if (width <= 0) return;

            trackWidth.value = width;
            thumbX.value = resolveRangeSliderThumbPosition(
                interactionValue.value,
                width,
                configurationRef.current.minimum,
                configurationRef.current.maximum,
                RANGE_SLIDER_THUMB_RADIUS,
            );
        },
        [interactionValue, thumbX, trackWidth],
    );

    const panGesture = useMemo(
        () =>
            Gesture.Pan()
                .enabled(!disabled)
                .maxPointers(1)
                .averageTouches(true)
                .activeOffsetX([-4, 4])
                .failOffsetY([-12, 12])
                .shouldCancelWhenOutside(false)
                .withTestId('range-slider-pan')
                .onBegin(event => {
                    panTouchStartX.value = event.x;
                    panThumbStartX.value = thumbX.value;
                    panStartedOnThumb.value = Math.abs(event.x - thumbX.value) <= RANGE_SLIDER_THUMB_RADIUS;
                })
                .onStart(event => {
                    const width = trackWidth.value;
                    if (width <= RANGE_SLIDER_THUMB_SIZE) return;

                    const positionX = panStartedOnThumb.value ? panThumbStartX.value + event.x - panTouchStartX.value : event.x;
                    const next = resolveRangeSliderValue(positionX, width, minimum, maximum, step, RANGE_SLIDER_THUMB_RADIUS);
                    const nextX = resolveRangeSliderThumbPosition(next, width, minimum, maximum, RANGE_SLIDER_THUMB_RADIUS);
                    const gestureId = gestureSequence.value + 1;
                    gestureSequence.value = gestureId;
                    gestureActive.value = true;
                    awaitingConfirmation.value = false;
                    panWasActive.value = true;
                    interactionValue.value = next;
                    thumbX.value = nextX;
                    scheduleOnRN(startGesture, gestureId, next);
                })
                .onUpdate(event => {
                    if (!panWasActive.value) return;

                    const width = trackWidth.value;
                    const positionX = panStartedOnThumb.value ? panThumbStartX.value + event.x - panTouchStartX.value : event.x;
                    const next = resolveRangeSliderValue(positionX, width, minimum, maximum, step, RANGE_SLIDER_THUMB_RADIUS);
                    if (next === interactionValue.value) return;

                    interactionValue.value = next;
                    thumbX.value = resolveRangeSliderThumbPosition(next, width, minimum, maximum, RANGE_SLIDER_THUMB_RADIUS);
                    scheduleOnRN(updateGestureValue, gestureSequence.value, next);
                })
                .onEnd((event, success) => {
                    if (!success || !panWasActive.value) return;

                    const width = trackWidth.value;
                    const positionX = panStartedOnThumb.value ? panThumbStartX.value + event.x - panTouchStartX.value : event.x;
                    const next = resolveRangeSliderValue(positionX, width, minimum, maximum, step, RANGE_SLIDER_THUMB_RADIUS);
                    panWasActive.value = false;
                    gestureActive.value = false;
                    awaitingConfirmation.value = true;
                    interactionValue.value = next;
                    thumbX.value = resolveRangeSliderThumbPosition(next, width, minimum, maximum, RANGE_SLIDER_THUMB_RADIUS);
                    scheduleOnRN(commitGesture, gestureSequence.value, next);
                })
                .onFinalize((_event, success) => {
                    if (success || !panWasActive.value) return;

                    const width = trackWidth.value;
                    const gestureId = gestureSequence.value;
                    panWasActive.value = false;
                    gestureActive.value = false;
                    awaitingConfirmation.value = false;
                    interactionValue.value = controlledValue.value;
                    thumbX.value = resolveRangeSliderThumbPosition(controlledValue.value, width, minimum, maximum, RANGE_SLIDER_THUMB_RADIUS);
                    scheduleOnRN(cancelGesture, gestureId);
                }),
        [
            awaitingConfirmation,
            cancelGesture,
            commitGesture,
            controlledValue,
            disabled,
            gestureActive,
            gestureSequence,
            interactionValue,
            maximum,
            minimum,
            panWasActive,
            panStartedOnThumb,
            panThumbStartX,
            panTouchStartX,
            startGesture,
            step,
            thumbX,
            trackWidth,
            updateGestureValue,
        ],
    );

    const tapGesture = useMemo(
        () =>
            Gesture.Tap()
                .enabled(!disabled)
                .maxDistance(10)
                .withTestId('range-slider-tap')
                .onEnd((event, success) => {
                    if (!success) return;

                    const width = trackWidth.value;
                    if (width <= RANGE_SLIDER_THUMB_SIZE) return;

                    const next = resolveRangeSliderValue(event.x, width, minimum, maximum, step, RANGE_SLIDER_THUMB_RADIUS);
                    const gestureId = gestureSequence.value + 1;
                    gestureSequence.value = gestureId;
                    gestureActive.value = false;
                    awaitingConfirmation.value = true;
                    interactionValue.value = next;
                    thumbX.value = resolveRangeSliderThumbPosition(next, width, minimum, maximum, RANGE_SLIDER_THUMB_RADIUS);
                    scheduleOnRN(commitGesture, gestureId, next);
                }),
        [awaitingConfirmation, commitGesture, disabled, gestureActive, gestureSequence, interactionValue, maximum, minimum, step, thumbX, trackWidth],
    );

    const gesture = useMemo(() => Gesture.Race(panGesture, tapGesture), [panGesture, tapGesture]);
    const displayedValue = draftValue ?? normalizedValue;
    const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: thumbX.value - RANGE_SLIDER_THUMB_RADIUS }] }));
    const filledRailStyle = useAnimatedStyle(() => ({ width: Math.max(0, thumbX.value - RANGE_SLIDER_THUMB_RADIUS) }));

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
            <GestureDetector gesture={gesture}>
                <Animated.View
                    accessible
                    accessibilityActions={[
                        { name: 'decrement', label: decrementLabel },
                        { name: 'increment', label: incrementLabel },
                    ]}
                    accessibilityLabel={label}
                    accessibilityRole="adjustable"
                    accessibilityState={{ disabled }}
                    accessibilityValue={{ max: maximum, min: minimum, now: displayedValue, text: valueLabel(displayedValue) }}
                    collapsable={false}
                    onAccessibilityAction={event => {
                        if (event.nativeEvent.actionName === 'increment') commitAccessibilityValue(interactionValueRef.current + step);
                        if (event.nativeEvent.actionName === 'decrement') commitAccessibilityValue(interactionValueRef.current - step);
                    }}
                    onBlur={() => setFocused(false)}
                    onFocus={() => setFocused(true)}
                    onLayout={handleLayout}
                    style={{ justifyContent: 'center', minHeight: minimumTouchTarget }}
                    testID="range-slider-track"
                >
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
                        <Animated.View style={[{ backgroundColor: tokens.accent, height: 6 }, filledRailStyle]} testID="range-slider-fill" />
                    </View>
                    <Animated.View
                        accessibilityElementsHidden
                        pointerEvents="none"
                        style={[
                            {
                                backgroundColor: tokens.surface,
                                borderColor: focused || dragging ? tokens.focus : tokens.accentBorder,
                                borderRadius: radii.pill,
                                borderWidth: 3,
                                height: RANGE_SLIDER_THUMB_SIZE,
                                left: 0,
                                position: 'absolute',
                                width: RANGE_SLIDER_THUMB_SIZE,
                            },
                            thumbStyle,
                        ]}
                        testID="range-slider-thumb"
                    />
                </Animated.View>
            </GestureDetector>
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
