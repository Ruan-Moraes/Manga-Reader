import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

const SELECTION_BADGE_SIZE = 22;
const SWATCH_HEIGHT = 48;
const SWATCH_BORDER_WIDTH = 2;

/** Equal width for every swatch from the measured group width (MOB-FEAT-057/AC-010). */
export function resolveSwatchWidth(trackWidth: number, count: number, gap: number): number {
    if (!Number.isFinite(trackWidth) || count <= 0) return 0;

    return Math.max(0, (trackWidth - Math.max(0, gap) * (count - 1)) / count);
}

interface SwatchPickerProps<T extends string> {
    label: string;
    /** Kept for compatibility: every picker now renders separated swatches of equal width. */
    separated?: boolean;
    description?: string;
    value: T;
    options: readonly T[];
    optionLabel: (option: T) => string;
    optionColor: (option: T) => string;
    /** Two colors for a split swatch, e.g. "Seguir aplicativo" (claro | escuro). */
    optionSplit?: (option: T) => readonly [string, string] | undefined;
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
    optionSplit,
    onChange,
    disabled = false,
}: SwatchPickerProps<T>) {
    const { metrics, minimumTouchTarget, radii, spacing, tokens } = useTheme();
    const [focusedOption, setFocusedOption] = useState<T | null>(null);
    const [optimisticOption, setOptimisticOption] = useState<T | null>(null);
    const [trackWidth, setTrackWidth] = useState(0);
    const pendingOptionRef = useRef<T | null>(null);
    const previousValueRef = useRef(value);
    const cancelPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const swatchSize = Math.max(SWATCH_HEIGHT, minimumTouchTarget);
    const optionWidth = resolveSwatchWidth(trackWidth, options.length, spacing.sm);
    const displayedValue = optimisticOption ?? value;

    useEffect(() => {
        const previousValue = previousValueRef.current;
        previousValueRef.current = value;

        if (pendingOptionRef.current === value) {
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
                    style={{ alignSelf: 'stretch', flexDirection: 'row', gap: spacing.sm }}
                >
                    {options.map(option => {
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
                                    borderColor: focused ? tokens.focus : selected ? tokens.accent : tokens.borderStrong,
                                    borderRadius: radii.control,
                                    borderWidth: SWATCH_BORDER_WIDTH,
                                    height: swatchSize,
                                    justifyContent: 'center',
                                    opacity: disabled ? 0.5 : 1,
                                    outlineColor: tokens.accentSoft,
                                    outlineWidth: selected ? SWATCH_BORDER_WIDTH : 0,
                                    overflow: 'hidden',
                                    width: optionWidth,
                                }}
                            >
                                {optionSplit?.(option) ? (
                                    <View
                                        accessibilityElementsHidden
                                        pointerEvents="none"
                                        style={{ bottom: 0, flexDirection: 'row', left: 0, position: 'absolute', right: 0, top: 0 }}
                                    >
                                        <View style={{ backgroundColor: optionSplit(option)![0], flex: 1 }} />
                                        <View style={{ backgroundColor: optionSplit(option)![1], flex: 1 }} />
                                    </View>
                                ) : null}
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
                                        <Icon name="checkmark" color={tokens.onAccent} size={metrics.icon.sm} decorative />
                                    </View>
                                ) : null}
                            </Pressable>
                        );
                    })}
                </View>
                <View accessibilityElementsHidden style={{ flexDirection: 'row', gap: spacing.sm }}>
                    {options.map(option => (
                        <View key={option} style={{ alignItems: 'center', width: optionWidth }}>
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
