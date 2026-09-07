import { ActivityIndicator, Text, View } from 'react-native';

import { FONTS, useTheme } from '@/shared/theme';

export function StartupFeedback({ label }: { label: string }) {
    const { spacing, tokens, typography } = useTheme();
    return (
        <View
            accessible
            accessibilityLabel={label}
            accessibilityLiveRegion="polite"
            accessibilityRole="progressbar"
            style={{ alignItems: 'center', backgroundColor: tokens.bg, flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.xl }}
        >
            <ActivityIndicator color={tokens.accent} />
            <Text style={{ color: tokens.muted, fontFamily: FONTS.regular, fontSize: typography.body, textAlign: 'center' }}>{label}</Text>
        </View>
    );
}
