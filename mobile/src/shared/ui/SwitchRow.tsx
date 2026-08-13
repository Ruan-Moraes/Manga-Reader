import { Switch, View } from 'react-native';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';

interface SwitchRowProps {
    label: string;
    description?: string;
    value: boolean;
    onChange: (value: boolean) => void;
    accessibilityHint?: string;
    disabled?: boolean;
}

export function SwitchRow({ label, description, value, onChange, accessibilityHint, disabled = false }: SwitchRowProps) {
    const { minimumTouchTarget, spacing, tokens } = useTheme();

    return (
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: minimumTouchTarget }}>
            <View style={{ flex: 1, gap: spacing.xs }}>
                <AppText variant="label" tone={disabled ? 'subtle' : 'default'}>
                    {label}
                </AppText>
                {description ? (
                    <AppText variant="caption" tone="subtle">
                        {description}
                    </AppText>
                ) : null}
            </View>
            <Switch
                accessibilityLabel={label}
                accessibilityHint={accessibilityHint}
                accessibilityState={{ checked: value, disabled }}
                disabled={disabled}
                onValueChange={onChange}
                thumbColor={value ? tokens.onAccent : tokens.surface}
                trackColor={{ false: tokens.inputBorder, true: tokens.accent }}
                value={value}
                style={{ minHeight: minimumTouchTarget, minWidth: minimumTouchTarget }}
            />
        </View>
    );
}
