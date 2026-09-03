import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

const SELECTION_BADGE_SIZE = 24;
const SWATCH_HEIGHT = 54;
const TRACK_BORDER_WIDTH = 1;

interface SwatchPickerProps<T extends string> {
    label: string;
    description?: string;
    value: T;
    options: readonly T[];
    optionLabel: (option: T) => string;
    optionColor: (option: T) => string;
    onChange: (option: T) => void;
    disabled?: boolean;
}

export function SwatchPicker<T extends string>({
    label,
    description,
    value,
    options,
    optionLabel,
    optionColor,
    onChange,
    disabled = false,
}: SwatchPickerProps<T>) {
    const { minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const [focusedOption, setFocusedOption] = useState<T | null>(null);
    const [optimisticOption, setOptimisticOption] = useState<T | null>(null);
    const [trackWidth, setTrackWidth] = useState(0);
    const pendingOptionRef = useRef<T | null>(null);
    const previousValueRef = useRef(value);
    const cancelPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const swatchSize = Math.max(SWATCH_HEIGHT, minimumTouchTarget);
    const optionWidth = options.length > 0 ? Math.max(0, (trackWidth - TRACK_BORDER_WIDTH * 2) / options.length) : 0;
    const displayedValue = optimisticOption ?? value;

    useEffect(() => {
        const previousValue = previousValueRef.current;
        previousValueRef.current = value;

        if (pendingOptionRef.current === value || (pendingOptionRef.current !== null && value !== previousValue)) {
            pendingOptionRef.current = null;
            setOptimisticOption(null);
            return;
        }

        if (pendingOptionRef.current === null && optimisticOption !== null && value !== previousValue) setOptimisticOption(null);
    }, [optimisticOption, value]);

    useEffect(
        () => () => {
            if (cancelPreviewTimerRef.current !== null) clearTimeout(cancelPreviewTimerRef.current);
        },
        [],
    );

    const previewOption = (option: T) => {
        if (disabled) return;
        if (cancelPreviewTimerRef.current !== null) clearTimeout(cancelPreviewTimerRef.current);
        setOptimisticOption(option);
    };

    const commitOption = (option: T) => {
        if (disabled) return;
        if (cancelPreviewTimerRef.current !== null) clearTimeout(cancelPreviewTimerRef.current);
        pendingOptionRef.current = option;
        setOptimisticOption(option);
        onChange(option);
    };

    const cancelPreview = (option: T) => {
        cancelPreviewTimerRef.current = setTimeout(() => {
            if (pendingOptionRef.current !== option) setOptimisticOption(null);
            cancelPreviewTimerRef.current = null;
        }, 0);
    };

    return (
        <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: spacing.sm }}>
            <View style={{ gap: spacing.xs }}>
                <AppText variant="label">{label}</AppText>
                {description ? (
                    <AppText variant="caption" tone="muted">
                        {description}
                    </AppText>
                ) : null}
            </View>
            <View testID="swatch-picker-group" style={{ alignSelf: 'stretch', gap: spacing.xs }}>
                <View
                    testID="swatch-picker-track"
                    onLayout={({ nativeEvent }) => {
                        const nextWidth = nativeEvent.layout.width;
                        setTrackWidth(currentWidth => (currentWidth === nextWidth ? currentWidth : nextWidth));
                    }}
                    style={{
                        alignSelf: 'stretch',
                        borderColor: tokens.borderStrong,
                        borderRadius: radii.control,
                        borderWidth: TRACK_BORDER_WIDTH,
                        flexDirection: 'row',
                        height: swatchSize,
                        overflow: 'hidden',
                    }}
                >
                    {options.map((option, index) => {
                        const selected = option === displayedValue;
                        const focused = option === focusedOption;
                        return (
                            <Pressable
                                key={option}
                                testID={`swatch-picker-surface-${option}`}
                                accessibilityLabel={optionLabel(option)}
                                accessibilityRole="radio"
                                accessibilityState={{ disabled, selected }}
                                disabled={disabled}
                                onBlur={() => setFocusedOption(current => (current === option ? null : current))}
                                onFocus={() => setFocusedOption(option)}
                                onPressIn={() => previewOption(option)}
                                onPress={() => commitOption(option)}
                                onPressOut={() => cancelPreview(option)}
                                style={{
                                    alignItems: 'center',
                                    backgroundColor: optionColor(option),
                                    borderLeftColor: tokens.borderStrong,
                                    borderLeftWidth: index === 0 ? 0 : 1,
                                    borderColor: focused ? tokens.focus : 'transparent',
                                    borderWidth: focused ? 2 : 0,
                                    height: swatchSize,
                                    justifyContent: 'center',
                                    opacity: disabled ? 0.5 : 1,
                                    width: optionWidth,
                                }}
                            >
                                {selected ? (
                                    <View
                                        accessibilityElementsHidden
                                        pointerEvents="none"
                                        testID={`swatch-picker-badge-${option}`}
                                        style={{
                                            alignItems: 'center',
                                            backgroundColor: tokens.accent,
                                            borderRadius: radii.pill,
                                            height: SELECTION_BADGE_SIZE,
                                            justifyContent: 'center',
                                            width: SELECTION_BADGE_SIZE,
                                        }}
                                    >
                                        <Icon name="checkmark" color={tokens.onAccent} size={16} decorative />
                                    </View>
                                ) : null}
                            </Pressable>
                        );
                    })}
                </View>
                <View accessibilityElementsHidden style={{ flexDirection: 'row', paddingHorizontal: TRACK_BORDER_WIDTH }}>
                    {options.map(option => (
                        <View key={option} style={{ alignItems: 'center', paddingHorizontal: 2, width: optionWidth }}>
                            <AppText numberOfLines={2} variant="caption" tone={option === displayedValue ? 'accent' : 'muted'} style={{ textAlign: 'center' }}>
                                {optionLabel(option)}
                            </AppText>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}
