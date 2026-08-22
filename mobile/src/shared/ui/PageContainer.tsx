import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/src/shared/theme';

interface Props {
    children: ReactNode;
    scroll?: boolean;
    padded?: boolean;
}

export function PageContainer({ children, scroll = false, padded = true }: Props) {
    const { layout, tokens } = useTheme();
    const insets = useSafeAreaInsets();

    const inner = (
        <View
            style={{
                flex: scroll ? undefined : 1,
                flexGrow: scroll ? 1 : undefined,
                backgroundColor: tokens.bg,
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                paddingHorizontal: padded ? layout.screenGutter : 0,
            }}
        >
            {children}
        </View>
    );

    if (scroll) {
        return (
            <KeyboardAvoidingView style={{ flex: 1, backgroundColor: tokens.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView
                    automaticallyAdjustKeyboardInsets
                    style={{ flex: 1 }}
                    contentContainerStyle={{ flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {inner}
                </ScrollView>
            </KeyboardAvoidingView>
        );
    }

    return inner;
}
