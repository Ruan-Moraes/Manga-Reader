import { useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform, useWindowDimensions, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { BottomSheet, type BottomSheetTestIDs } from './BottomSheet';
import { Icon } from './Icon';
import { PressableBox as Pressable } from './PressableBox';

const SELECT_SHEET_MINIMUM_RATIO = 0.44;
const SELECT_SHEET_MAXIMUM_RATIO = 0.82;
const SELECT_SHEET_MINIMUM_HEIGHT = 320;
const SELECT_SHEET_HEADER_HEIGHT = 112;
const SELECT_SHEET_VERTICAL_PADDING = 32;
const SELECT_OPTION_MINIMUM_HEIGHT = 88;
const SELECT_OPTION_DESCRIPTION_HEIGHT = 112;
const SELECT_SHEET_TEST_IDS: Partial<BottomSheetTestIDs> = {
    layer: 'select-field-sheet-layer',
    backdrop: 'select-field-backdrop',
    sheet: 'select-field-sheet',
    handle: 'select-field-sheet-handle',
    header: 'select-field-sheet-header',
    scroll: 'select-field-options-scroll',
};

interface SelectViewport {
    height: number;
}

interface SelectInsets {
    top: number;
    bottom: number;
}

function finite(value: number): number {
    return Number.isFinite(value) ? value : 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
    return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export function resolveSelectSheetHeight(viewport: SelectViewport, insets: SelectInsets, optionCount: number, hasDescriptions = false): number {
    const viewportHeight = Math.max(0, finite(viewport.height));
    const safeTop = Math.max(0, finite(insets.top));
    const safeBottom = Math.max(0, finite(insets.bottom));
    const availableHeight = Math.max(0, viewportHeight - safeTop);
    const maximumHeight = availableHeight * SELECT_SHEET_MAXIMUM_RATIO;
    const minimumHeight = Math.min(maximumHeight, Math.max(SELECT_SHEET_MINIMUM_HEIGHT, availableHeight * SELECT_SHEET_MINIMUM_RATIO));
    const rowHeight = hasDescriptions ? SELECT_OPTION_DESCRIPTION_HEIGHT : SELECT_OPTION_MINIMUM_HEIGHT;
    const naturalHeight = SELECT_SHEET_HEADER_HEIGHT + SELECT_SHEET_VERTICAL_PADDING + safeBottom + Math.max(0, finite(optionCount)) * rowHeight;

    return clamp(naturalHeight, minimumHeight, maximumHeight);
}

interface SelectFieldProps<T extends string> {
    label: string;
    description?: string;
    value: T;
    options: readonly T[];
    optionLabel: (option: T) => string;
    optionDescription?: (option: T) => string | undefined;
    /** Options shown but not selectable, e.g. the language already used on the other side. */
    optionDisabled?: (option: T) => boolean;
    onChange: (option: T) => void;
    closeLabel: string;
    disabled?: boolean;
    /** card: compact trigger for side-by-side pairs; the full label stays the accessible name. */
    variant?: 'default' | 'input' | 'card';
    /** Short visible label of the card variant. */
    shortLabel?: string;
    /** Text shown in the trigger instead of `optionLabel(value)`, e.g. a shorter name. */
    valueLabel?: (option: T) => string;
}

export function SelectField<T extends string>({
    label,
    description,
    value,
    options,
    optionLabel,
    optionDescription,
    optionDisabled,
    onChange,
    closeLabel,
    disabled = false,
    variant = 'default',
    shortLabel,
    valueLabel,
}: SelectFieldProps<T>) {
    const { height } = useWindowDimensions();

    const insets = useContext(SafeAreaInsetsContext) ?? { bottom: 0, left: 0, right: 0, top: 0 };

    const { layout, minimumTouchTarget, radii, spacing, tokens } = useTheme();

    const cardVariant = variant === 'card';
    const inputVariant = variant === 'input' || cardVariant;
    const triggerRef = useRef<View>(null);
    const selectedOptionRef = useRef<View>(null);
    const wasOpen = useRef(false);
    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    const [focusedOption, setFocusedOption] = useState<T | null>(null);

    const hasDescriptions = Boolean(optionDescription && options.some(option => optionDescription(option)));

    const sheetHeight = resolveSelectSheetHeight({ height }, insets, options.length, hasDescriptions);

    const restoreFocus = () => {
        if (inputVariant && triggerRef.current) {
            if (Platform.OS === 'web') triggerRef.current.focus();
            else AccessibilityInfo.sendAccessibilityEvent(triggerRef.current, 'focus');
        }
    };

    useEffect(() => {
        const closing = wasOpen.current && !open;
        wasOpen.current = open;
        if (!closing || !inputVariant || Platform.OS === 'ios') return;
        const frame = requestAnimationFrame(() => {
            if (triggerRef.current) {
                if (Platform.OS === 'web') triggerRef.current.focus();
                else AccessibilityInfo.sendAccessibilityEvent(triggerRef.current, 'focus');
            }
        });
        return () => cancelAnimationFrame(frame);
    }, [inputVariant, open]);

    const choose = (option: T) => {
        onChange(option);

        setOpen(false);
    };

    return (
        <View style={{ alignSelf: 'stretch', gap: spacing.sm, width: '100%' }}>
            <View style={{ display: cardVariant ? 'none' : 'flex', gap: spacing.xs }}>
                <AppText variant="label">{label}</AppText>
                {description ? (
                    <AppText variant="caption" tone="muted">
                        {description}
                    </AppText>
                ) : null}
            </View>
            <Pressable
                ref={triggerRef}
                testID="select-field-trigger"
                accessibilityLabel={`${label}: ${optionLabel(value)}`}
                accessibilityRole="button"
                accessibilityState={{ disabled, expanded: open }}
                disabled={disabled}
                onBlur={() => setFocused(false)}
                onFocus={() => setFocused(true)}
                onPress={() => setOpen(true)}
                style={
                    inputVariant
                        ? undefined
                        : ({ pressed }) => ({
                              alignItems: 'center',
                              backgroundColor: disabled
                                  ? tokens.disabledSurface
                                  : pressed
                                    ? tokens.surfacePressed
                                    : open
                                      ? tokens.surfaceSelected
                                      : tokens.inputBg,
                              borderColor: open || focused ? tokens.focus : tokens.inputBorder,
                              // Padrão de campo das folhas: raio de controle e 16 de respiro vertical (~72 pt com o tile de 40).
                              borderRadius: radii.control,
                              borderWidth: 2,
                              justifyContent: 'center',
                              minHeight: Math.max(minimumTouchTarget, 64),
                              opacity: disabled ? 0.56 : 1,
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.md,
                              width: '100%',
                          })
                }
            >
                {({ pressed }) => (
                    <View
                        pointerEvents="none"
                        testID="select-field-trigger-content"
                        style={{
                            alignItems: 'center',
                            flexDirection: 'row',
                            gap: spacing.md,
                            minWidth: 0,
                            width: '100%',
                            ...(inputVariant
                                ? {
                                      backgroundColor: disabled ? tokens.disabledSurface : pressed ? tokens.surfacePressed : tokens.inputBg,
                                      borderColor: open || focused ? tokens.focus : tokens.inputBorder,
                                      borderRadius: cardVariant ? radii.card : radii.control,
                                      borderWidth: open || focused ? 2 : 1,
                                      gap: cardVariant ? spacing.xs : spacing.md,
                                      minHeight: Math.max(minimumTouchTarget, cardVariant ? 56 : layout.controlHeight),
                                      opacity: disabled ? 0.56 : 1,
                                      paddingHorizontal: cardVariant ? spacing.sm + 4 : spacing.md,
                                      paddingVertical: cardVariant ? spacing.sm : spacing.md,
                                  }
                                : {}),
                        }}
                    >
                        <View style={{ flex: 1, minWidth: 0 }}>
                            {cardVariant && shortLabel ? (
                                <AppText variant="eyebrow" tone="subtle" numberOfLines={1}>
                                    {shortLabel}
                                </AppText>
                            ) : null}
                            <AppText variant="label" numberOfLines={cardVariant ? 1 : inputVariant ? undefined : 2}>
                                {(valueLabel ?? optionLabel)(value)}
                            </AppText>
                        </View>
                        {inputVariant ? (
                            <Icon name={open ? 'chevron-up' : 'chevron-down'} color={tokens.muted} decorative size={20} />
                        ) : (
                            // Campo limpo (pedido de 2026-11-09): só o valor e a seta, sem tile nem caixa.
                            <View
                                testID="select-field-expand-affordance"
                                style={{ alignItems: 'center', flexShrink: 0, height: 24, justifyContent: 'center', width: 24 }}
                            >
                                <Icon name={open ? 'chevron-up' : 'chevron-down'} color={open ? tokens.accentText : tokens.muted} decorative size={20} />
                            </View>
                        )}
                    </View>
                )}
            </Pressable>
            <BottomSheet
                visible={open}
                onClose={() => setOpen(false)}
                closeLabel={closeLabel}
                title={label}
                description={optionLabel(value)}
                headerDivider
                height={sheetHeight}
                maxHeightRatio={SELECT_SHEET_MAXIMUM_RATIO}
                onDismiss={inputVariant ? restoreFocus : undefined}
                onShow={
                    inputVariant
                        ? () => {
                              if (selectedOptionRef.current) {
                                  if (Platform.OS === 'web') selectedOptionRef.current.focus();
                                  else AccessibilityInfo.sendAccessibilityEvent(selectedOptionRef.current, 'focus');
                              }
                          }
                        : undefined
                }
                testIDs={SELECT_SHEET_TEST_IDS}
            >
                <View
                    accessibilityLabel={label}
                    accessibilityRole="radiogroup"
                    testID="select-field-options-group"
                    style={{
                        backgroundColor: tokens.surfaceElevated,
                        borderColor: tokens.separator,
                        borderRadius: radii.card,
                        borderWidth: 1,
                        gap: spacing.sm,
                        padding: spacing.xs,
                    }}
                >
                    {options.map(option => {
                        const selected = option === value;

                        const optionFocused = option === focusedOption;

                        const currentDescription = optionDescription?.(option);

                        const unavailable = !selected && !!optionDisabled?.(option);

                        return (
                            <Pressable
                                key={option}
                                ref={selected && inputVariant ? selectedOptionRef : undefined}
                                accessibilityLabel={optionLabel(option)}
                                accessibilityHint={inputVariant ? currentDescription : undefined}
                                accessibilityRole="radio"
                                accessibilityState={{ selected, disabled: unavailable }}
                                disabled={unavailable}
                                onBlur={() => setFocusedOption(current => (current === option ? null : current))}
                                onFocus={() => setFocusedOption(option)}
                                onPress={() => choose(option)}
                                testID={`select-field-option-${option}`}
                                style={{ borderRadius: radii.control, opacity: unavailable ? 0.56 : 1 }}
                            >
                                {({ pressed }) => (
                                    <View
                                        testID={`select-field-option-surface-${option}`}
                                        style={{
                                            backgroundColor: pressed ? tokens.surfacePressed : selected ? tokens.surfaceSelected : 'transparent',
                                            borderColor: optionFocused ? tokens.focus : selected ? tokens.accentBorder : 'transparent',
                                            borderRadius: radii.control,
                                            borderWidth: 2,
                                            justifyContent: 'center',
                                            paddingHorizontal: spacing.md,
                                            paddingVertical: spacing.md,
                                        }}
                                    >
                                        <View
                                            testID={`select-field-option-row-${option}`}
                                            style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md }}
                                        >
                                            <View testID={`select-field-option-copy-${option}`} style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                                                <AppText variant="label" tone={selected ? 'accent' : 'default'}>
                                                    {optionLabel(option)}
                                                </AppText>
                                                {currentDescription ? (
                                                    <AppText variant="caption" tone="muted">
                                                        {currentDescription}
                                                    </AppText>
                                                ) : null}
                                            </View>
                                            <View
                                                testID={`select-field-option-indicator-${option}`}
                                                style={{
                                                    alignItems: 'center',
                                                    backgroundColor: selected ? tokens.accent : tokens.surfaceMuted,
                                                    borderColor: selected ? tokens.accent : tokens.borderStrong,
                                                    borderRadius: radii.pill,
                                                    borderWidth: 2,
                                                    flexShrink: 0,
                                                    height: 28,
                                                    justifyContent: 'center',
                                                    width: 28,
                                                }}
                                            >
                                                {selected ? <Icon name="checkmark" color={tokens.onAccent} decorative size={18} /> : null}
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </Pressable>
                        );
                    })}
                </View>
            </BottomSheet>
        </View>
    );
}
