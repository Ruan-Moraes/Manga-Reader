import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DEMO_CREDS } from '@/src/shared/constant';
import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

interface Props {
    onFill: (email: string, password: string) => void;
}

/** Caixa de credenciais demo — renderizar apenas em __DEV__. */
export function DemoCredentials({ onFill }: Props) {
    const { tokens } = useTheme();
    const { t } = useTranslation('auth');

    return (
        <View
            style={{
                marginTop: 22,
                padding: 14,
                borderRadius: 6,
                backgroundColor: 'rgba(221,218,42,0.06)',
                borderWidth: 1,
                borderColor: 'rgba(221,218,42,0.35)',
                borderStyle: 'dashed',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
            }}
        >
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                    style={{
                        fontSize: 10,
                        fontFamily: FONTS.extrabold,
                        letterSpacing: 1.4,
                        textTransform: 'uppercase',
                        color: tokens.accent,
                        marginBottom: 7,
                    }}
                >
                    {t('login.demoTitle')}
                </Text>
                <Text style={{ fontFamily: MONO, fontSize: 12, color: tokens.muted, lineHeight: 20 }}>{DEMO_CREDS.email}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 12, color: tokens.muted, lineHeight: 20 }}>{DEMO_CREDS.password}</Text>
            </View>

            <TouchableOpacity
                onPress={() => onFill(DEMO_CREDS.email, DEMO_CREDS.password)}
                style={{ paddingHorizontal: 11, paddingVertical: 7, borderWidth: 1, borderColor: tokens.accent, borderRadius: tokens.radius }}
            >
                <Text style={{ fontSize: 10, fontFamily: FONTS.extrabold, letterSpacing: 1.2, textTransform: 'uppercase', color: tokens.accent }}>
                    {t('login.demoFill')}
                </Text>
            </TouchableOpacity>
        </View>
    );
}
