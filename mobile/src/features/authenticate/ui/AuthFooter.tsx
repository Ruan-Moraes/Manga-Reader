import { View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { AppText, TextAction } from '@/shared/ui';

interface Props {
    prompt: string;
    action: string;
    onAction: () => void;
}

export function AuthFooter({ prompt, action, onAction }: Props) {
    const { spacing, tokens } = useTheme();

    return (
        <View
            testID="auth-footer"
            style={{
                alignItems: 'center',
                borderTopColor: tokens.separator,
                borderTopWidth: 1,
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.xs,
                justifyContent: 'center',
                marginTop: spacing.lg,
                paddingTop: spacing.md,
            }}
        >
            <AppText tone="muted">{prompt}</AppText>
            <TextAction label={action} onPress={onAction} />
        </View>
    );
}
