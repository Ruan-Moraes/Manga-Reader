import { Text, View } from 'react-native';

import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';

interface Props {
    prompt: string;
    action: string;
    onAction: () => void;
}

export function AuthFooter({ prompt, action, onAction }: Props) {
    const { tokens } = useTheme();
    return (
        <View
            style={{
                marginTop: 24,
                paddingTop: 20,
                borderTopWidth: 1,
                borderTopColor: tokens.inputBorder,
                alignItems: 'center',
            }}
        >
            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: tokens.subtle, letterSpacing: tokens.ls }}>
                {prompt}{' '}
                <Text onPress={onAction} style={{ fontFamily: FONTS.bold, color: tokens.accentText }}>
                    {action}
                </Text>
            </Text>
        </View>
    );
}
