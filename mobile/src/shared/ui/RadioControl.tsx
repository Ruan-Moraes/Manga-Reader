import { type Ref, useState } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/shared/theme';

interface Props {
    label: string;
    hint?: string;
    selected: boolean;
    disabled?: boolean;
    onPress(): void;
    testID?: string;
    indicatorTestID?: string;
    ref?: Ref<View>;
}

/** A radio's hit target and focus indicator are independent of the visible label. */
export function RadioControl({ label, hint, selected, disabled = false, onPress, testID, indicatorTestID, ref }: Props) {
    const { minimumTouchTarget, radii, tokens } = useTheme();
    const [focused, setFocused] = useState(false);
    return (
        <Pressable
            ref={ref}
            testID={testID}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityHint={hint}
            accessibilityState={{ checked: selected, selected, disabled }}
            disabled={disabled}
            onPress={onPress}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={({ pressed }) => ({
                alignItems: 'center',
                justifyContent: 'center',
                width: minimumTouchTarget,
                minHeight: minimumTouchTarget,
                flexShrink: 0,
                borderRadius: radii.pill,
                borderWidth: 2,
                borderColor: focused ? tokens.focus : 'transparent',
                backgroundColor: pressed ? tokens.surfacePressed : 'transparent',
                opacity: disabled ? 0.48 : 1,
            })}
        >
            <View
                testID={indicatorTestID}
                pointerEvents="none"
                style={{
                    width: 22,
                    height: 22,
                    flexShrink: 0,
                    borderRadius: radii.pill,
                    borderWidth: 2,
                    borderColor: selected ? tokens.accentText : tokens.borderStrong,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {selected ? <View style={{ width: 10, height: 10, borderRadius: radii.pill, backgroundColor: tokens.accentText }} /> : null}
            </View>
        </Pressable>
    );
}
