import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';

interface Props {
    title: string;
    description?: string;
    action?: ReactNode;
    icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: Props) {
    const { tokens } = useTheme();
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
            {icon}
            <Text style={{ fontFamily: FONTS.bold, fontSize: 18, color: tokens.text, textAlign: 'center' }}>{title}</Text>
            {description && (
                <Text
                    style={{
                        fontFamily: FONTS.regular,
                        fontSize: 14,
                        color: tokens.subtle,
                        textAlign: 'center',
                        lineHeight: 20,
                    }}
                >
                    {description}
                </Text>
            )}
            {action}
        </View>
    );
}
