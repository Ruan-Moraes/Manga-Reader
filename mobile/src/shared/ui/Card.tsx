import { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';

import { useTheme } from '@/src/shared/theme';

interface Props {
    children: ReactNode;
    style?: ViewStyle;
    padded?: boolean;
}

export function Card({ children, style, padded = true }: Props) {
    const { tokens } = useTheme();
    return (
        <View
            style={[
                {
                    backgroundColor: tokens.surface,
                    borderRadius: tokens.radius,
                    padding: padded ? 16 : 0,
                    borderWidth: 1,
                    borderColor: tokens.separator,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
}
