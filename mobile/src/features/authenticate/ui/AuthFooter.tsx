import { Text } from 'react-native';

import { FONTS, useTheme } from '@/shared/theme';
import { AppText, PressableBox } from '@/shared/ui';

interface Props {
    prompt: string;
    action: string;
    onAction: () => void;
}

/**
 * "Já tem conta? Entrar" (2026-11-14): one sentence with the link nested in the same text, so Android measures it
 * once and never clips the end ("Já tem", or the "?"). The whole line is the touch target (44 min) and reads as the
 * action for screen readers.
 */
export function AuthFooter({ prompt, action, onAction }: Props) {
    const { minimumTouchTarget, spacing, tokens } = useTheme();

    return (
        <PressableBox
            testID="auth-footer"
            accessibilityRole="button"
            accessibilityLabel={action}
            accessibilityHint={prompt}
            onPress={onAction}
            style={({ pressed }) => ({
                alignItems: 'center',
                borderTopColor: tokens.separator,
                borderTopWidth: 1,
                justifyContent: 'center',
                // Espaço igual acima e abaixo da linha; a altura mínima de toque já soma respiro sob ela.
                marginTop: spacing.md,
                minHeight: minimumTouchTarget + spacing.xs,
                opacity: pressed ? 0.72 : 1,
                paddingTop: spacing.xs,
            })}
        >
            <AppText tone="muted" style={{ textAlign: 'center' }}>
                {prompt}{' '}
                <Text style={{ color: tokens.accentText, fontFamily: FONTS.bold }}>{action}</Text>
            </AppText>
        </PressableBox>
    );
}
