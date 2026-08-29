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
            testID={scroll ? 'page-container-scroll-content' : undefined}
            style={{
                flex: scroll ? undefined : 1,
                flexGrow: scroll ? 1 : undefined,
                backgroundColor: tokens.bg,
                paddingTop: scroll ? 0 : insets.top,
                paddingBottom: scroll ? 0 : insets.bottom,
                paddingHorizontal: padded ? layout.screenGutter : 0,
            }}
        >
            {children}
        </View>
    );

    if (scroll) {
        return (
            <View testID="page-container-safe-frame" style={{ flex: 1, backgroundColor: tokens.bg, paddingBottom: insets.bottom, paddingTop: insets.top }}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
            </View>
        );
    }

    return inner;
}
