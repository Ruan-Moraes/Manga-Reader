import { useContext, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Modal, Platform, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

const SELECT_SHEET_MINIMUM_RATIO = 0.44;
const SELECT_SHEET_MAXIMUM_RATIO = 0.82;
const SELECT_SHEET_MINIMUM_HEIGHT = 320;
const SELECT_SHEET_HEADER_HEIGHT = 112;
const SELECT_SHEET_VERTICAL_PADDING = 32;
const SELECT_OPTION_MINIMUM_HEIGHT = 88;
const SELECT_OPTION_DESCRIPTION_HEIGHT = 112;

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
    onChange: (option: T) => void;
    closeLabel: string;
    disabled?: boolean;
    variant?: 'default' | 'input';
}

export function SelectField<T extends string>({
    label,
    description,
    value,
    options,
    optionLabel,
    optionDescription,
    onChange,
    closeLabel,
    disabled = false,
    variant = 'default',
}: SelectFieldProps<T>) {
    const { height } = useWindowDimensions();

    const insets = useContext(SafeAreaInsetsContext) ?? { bottom: 0, left: 0, right: 0, top: 0 };

    const { effectiveReduceMotion, layout, minimumTouchTarget, radii, spacing, tokens } = useTheme();

    const inputVariant = variant === 'input';
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
            <View style={{ gap: spacing.xs }}>
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
                              borderRadius: radii.card,
                              borderWidth: 2,
                              minHeight: Math.max(minimumTouchTarget, 64),
                              opacity: disabled ? 0.56 : 1,
                              paddingHorizontal: spacing.sm,
                              paddingVertical: spacing.sm,
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
                                      borderRadius: radii.control,
                                      borderWidth: open || focused ? 2 : 1,
                                      minHeight: Math.max(minimumTouchTarget, layout.controlHeight),
                                      opacity: disabled ? 0.56 : 1,
                                      paddingHorizontal: spacing.md,
                                      paddingVertical: spacing.md,
                                  }
                                : {}),
                        }}
                    >
                        {!inputVariant && (
                            <View
                                testID="select-field-leading-icon"
                                style={{
                                    alignItems: 'center',
                                    backgroundColor: open ? tokens.accentSoft : tokens.surfaceMuted,
                                    borderRadius: radii.control,
                                    flexShrink: 0,
                                    height: 40,
                                    justifyContent: 'center',
                                    width: 40,
                                }}
                            >
                                <Icon name="list-outline" color={open ? tokens.accentText : tokens.muted} decorative size={20} />
                            </View>
                        )}
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <AppText variant="label" numberOfLines={inputVariant ? undefined : 2}>
                                {optionLabel(value)}
                            </AppText>
                        </View>
                        {inputVariant ? (
                            <Icon name={open ? 'chevron-up' : 'chevron-down'} color={tokens.muted} decorative size={20} />
                        ) : (
                            <View
                                testID="select-field-expand-affordance"
                                style={{
                                    alignItems: 'center',
                                    backgroundColor: open ? tokens.accent : tokens.accentSoft,
                                    borderColor: tokens.accentBorder,
                                    borderRadius: radii.control,
                                    borderWidth: 1,
                                    flexShrink: 0,
                                    height: 40,
                                    justifyContent: 'center',
                                    width: 40,
                                }}
                            >
                                <Icon name={open ? 'chevron-down' : 'chevron-up'} color={open ? tokens.onAccent : tokens.accentText} decorative size={20} />
                            </View>
                        )}
                    </View>
                )}
            </Pressable>
            <Modal
                animationType={effectiveReduceMotion ? 'none' : 'slide'}
                navigationBarTranslucent
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
                onRequestClose={() => setOpen(false)}
                presentationStyle="overFullScreen"
                statusBarTranslucent
                transparent
                visible={open}
            >
                <View accessibilityViewIsModal onAccessibilityEscape={() => setOpen(false)} style={{ flex: 1 }} testID="select-field-sheet-layer">
                    <Pressable
                        testID="select-field-backdrop"
                        accessibilityLabel={closeLabel}
                        accessibilityRole="button"
                        onPress={() => setOpen(false)}
                        style={{ backgroundColor: tokens.scrim, bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
                    />
                    <View
                        testID="select-field-sheet"
                        style={{
                            backgroundColor: tokens.surface,
                            borderColor: tokens.separator,
                            borderTopLeftRadius: radii.feature,
                            borderTopRightRadius: radii.feature,
                            borderTopWidth: 1,
                            bottom: 0,
                            elevation: Platform.OS === 'android' ? 18 : undefined,
                            height: sheetHeight,
                            left: 0,
                            maxHeight: '82%',
                            position: 'absolute',
                            right: 0,
                            shadowColor: tokens.overlay,
                            shadowOffset: { height: -8, width: 0 },
                            shadowOpacity: 0.28,
                            shadowRadius: 22,
                        }}
                    >
                        <View style={{ alignItems: 'center', height: 24, justifyContent: 'center' }}>
                            <View
                                testID="select-field-sheet-handle"
                                style={{ backgroundColor: tokens.borderStrong, borderRadius: radii.pill, height: 5, width: 44 }}
                            />
                        </View>
                        <View
                            testID="select-field-sheet-header"
                            style={{
                                alignItems: 'center',
                                borderBottomColor: tokens.separator,
                                borderBottomWidth: 1,
                                flexDirection: 'row',
                                gap: spacing.md,
                                paddingBottom: spacing.md,
                                paddingHorizontal: layout.screenGutter,
                            }}
                        >
                            <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                                <AppText accessibilityRole="header" variant="section" numberOfLines={2}>
                                    {label}
                                </AppText>
                                <AppText variant="caption" tone="muted" numberOfLines={2}>
                                    {optionLabel(value)}
                                </AppText>
                            </View>
                            <IconButton icon="close" accessibilityLabel={closeLabel} onPress={() => setOpen(false)} surface="surface" />
                        </View>
                        <ScrollView
                            testID="select-field-options-scroll"
                            bounces={false}
                            contentContainerStyle={{
                                paddingBottom: Math.max(insets.bottom, spacing.lg),
                                paddingHorizontal: layout.screenGutter,
                                paddingTop: spacing.lg,
                            }}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
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

                                    return (
                                        <Pressable
                                            key={option}
                                            ref={selected && inputVariant ? selectedOptionRef : undefined}
                                            accessibilityLabel={optionLabel(option)}
                                            accessibilityHint={inputVariant ? currentDescription : undefined}
                                            accessibilityRole="radio"
                                            accessibilityState={{ selected }}
                                            onBlur={() => setFocusedOption(current => (current === option ? null : current))}
                                            onFocus={() => setFocusedOption(option)}
                                            onPress={() => choose(option)}
                                            testID={`select-field-option-${option}`}
                                            style={{ borderRadius: radii.control }}
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
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
