import { Text, View } from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';

interface Props {
    src?: string | null;
    name?: string;
    size?: number;
}

export function Avatar({ src, name, size = 40 }: Props) {
    const { tokens } = useTheme();
    const initials = name?.trim().slice(0, 2).toUpperCase() ?? '?';

    if (src) {
        return (
            <Image source={{ uri: src }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tokens.surface }} contentFit="cover" />
        );
    }

    return (
        <View
            style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: tokens.accent,
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Text style={{ fontFamily: FONTS.bold, fontSize: size * 0.35, color: tokens.onAccent }}>{initials}</Text>
        </View>
    );
}
