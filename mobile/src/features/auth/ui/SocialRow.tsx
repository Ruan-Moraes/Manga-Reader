import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';

import { MRIcon } from './MRIcon';

function SocialButton({ icon, label }: { icon: 'google' | 'apple'; label: string }) {
    const { tokens } = useTheme();
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            style={{
                flex: 1,
                height: tokens.controlHeight,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
                backgroundColor: tokens.surface,
                borderWidth: 1,
                borderColor: tokens.tertiary,
                borderRadius: tokens.radius,
            }}
        >
            <MRIcon name={icon} size={20} color={tokens.text} />
            <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: tokens.text, letterSpacing: tokens.ls }}>{label}</Text>
        </TouchableOpacity>
    );
}

export function SocialRow() {
    const { tokens } = useTheme();
    const { t } = useTranslation('auth');
    return (
        <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 22 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: tokens.inputBorder }} />
                <Text style={{ fontSize: 11, color: tokens.tertiary, letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONTS.regular }}>
                    {t('social.orContinueWith')}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: tokens.inputBorder }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <SocialButton icon="google" label="Google" />
                {Platform.OS === 'ios' && <SocialButton icon="apple" label="Apple" />}
            </View>
        </>
    );
}
