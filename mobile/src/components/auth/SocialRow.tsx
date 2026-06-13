import { Text, TouchableOpacity, View } from 'react-native';
import { FONTS, MR } from '@/src/constants/theme';
import { MRIcon } from './MRIcon';

function SocialButton({ icon, label }: { icon: 'google' | 'apple'; label: string }) {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            style={{
                flex: 1,
                height: MR.controlHeight,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
                backgroundColor: MR.surface,
                borderWidth: 1,
                borderColor: MR.tertiary,
                borderRadius: MR.radius,
            }}
        >
            <MRIcon name={icon} size={20} color={MR.text} />
            <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: MR.text, letterSpacing: MR.ls }}>{label}</Text>
        </TouchableOpacity>
    );
}

export function SocialRow({ caption = 'ou continue com' }: { caption?: string }) {
    return (
        <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: MR.inputBorder }} />
                <Text
                    style={{
                        fontSize: 11,
                        color: MR.tertiary,
                        letterSpacing: 0.8,
                        textTransform: 'uppercase',
                        fontFamily: FONTS.regular,
                    }}
                >
                    {caption}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: MR.inputBorder }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <SocialButton icon="google" label="Google" />
                <SocialButton icon="apple" label="Apple" />
            </View>
        </>
    );
}
