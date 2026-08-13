import { ReactNode } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/src/shared/theme';

interface Props {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    padded?: boolean;
    variant?: 'default' | 'muted' | 'elevated';
}

export function Card({ children, style, padded = true, variant = 'default' }: Props) {
    const { radii, spacing, tokens } = useTheme();
    const elevated = variant === 'elevated';
    return (
        <View
            style={[
                {
                    backgroundColor: variant === 'muted' ? tokens.surfaceMuted : tokens.surface,
                    borderRadius: radii.card,
                    padding: padded ? spacing.lg : 0,
                    borderWidth: elevated ? 0 : 1,
                    borderColor: tokens.separator,
                    shadowColor: tokens.overlay,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: elevated ? 0.12 : 0,
                    shadowRadius: elevated ? 18 : 0,
                    elevation: elevated ? 3 : 0,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
}
