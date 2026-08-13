import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';

interface Props {
    prompt: string;
    action: string;
    onAction: () => void;
}

export function AuthFooter({ prompt, action, onAction }: Props) {
    const { minimumTouchTarget, spacing, tokens, typography } = useTheme();
    return (
        <View
            style={{
                marginTop: spacing.lg,
                paddingTop: spacing.lg,
                borderTopWidth: 1,
                borderTopColor: tokens.inputBorder,
                alignItems: 'center',
            }}
        >
            <View style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Text style={{ fontFamily: FONTS.regular, fontSize: typography.body, color: tokens.subtle }}>{prompt} </Text>
                <Pressable
                    accessibilityRole="button"
                    onPress={onAction}
                    style={{ justifyContent: 'center', minHeight: minimumTouchTarget, paddingHorizontal: spacing.xs }}
                >
                    <Text style={{ fontFamily: FONTS.bold, fontSize: typography.body, color: tokens.accentText }}>{action}</Text>
                </Pressable>
            </View>
        </View>
    );
}
