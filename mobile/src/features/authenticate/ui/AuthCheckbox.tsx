import { Text, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { FONTS } from '@/shared/theme';
import { PressableBox } from '@/shared/ui';

import { MRIcon } from './MRIcon';

/** Side of the check box; content that follows the label lines up after it plus the row gap. */
export const AUTH_CHECKBOX_SIZE = 20;

interface Props {
    checked: boolean;
    onChange: () => void;
    children: React.ReactNode;
    error?: string;
}

export function AuthCheckbox({ checked, onChange, children, error }: Props) {
    const { minimumTouchTarget, radii, spacing, tokens, typography } = useTheme();
    const borderColor = checked ? tokens.accentBorder : error ? tokens.danger : tokens.tertiary;

    // The box and the sentence toggle the acceptance; links nested in the sentence keep their own press, so tapping
    // a policy name opens it without ticking the box (revisão 2026-11-13).
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md, minHeight: minimumTouchTarget }}>
            <PressableBox
                accessible={false}
                hitSlop={spacing.sm}
                onPress={onChange}
                style={{
                    width: AUTH_CHECKBOX_SIZE,
                    height: AUTH_CHECKBOX_SIZE,
                    flexShrink: 0,
                    borderRadius: radii.sm,
                    borderWidth: 1.5,
                    borderColor,
                    backgroundColor: checked ? tokens.accent : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {checked && <MRIcon name="check" size={13} color={tokens.onAccent} strokeWidth={3} />}
            </PressableBox>
            <Text
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                onPress={onChange}
                style={{
                    flex: 1,
                    fontFamily: FONTS.regular,
                    fontSize: typography.body,
                    color: error ? tokens.danger : tokens.muted,
                    letterSpacing: 0,
                    lineHeight: typography.body * 1.45,
                }}
            >
                {children}
            </Text>
        </View>
    );
}
