import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { DEMO_CREDS } from '@/src/constants/demo';
import { FONTS, MR } from '@/src/constants/theme';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

interface Props {
    onFill: (email: string, password: string) => void;
}

/** Caixa de credenciais demo — renderizar apenas em __DEV__. */
export function DemoCredentials({ onFill }: Props) {
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
                        color: MR.accent,
                        marginBottom: 7,
                    }}
                >
                    Credenciais de demonstração
                </Text>
                <Text style={{ fontFamily: MONO, fontSize: 12, color: MR.muted, lineHeight: 20 }}>{DEMO_CREDS.email}</Text>
                <Text style={{ fontFamily: MONO, fontSize: 12, color: MR.muted, lineHeight: 20 }}>{DEMO_CREDS.password}</Text>
            </View>

            <TouchableOpacity
                onPress={() => onFill(DEMO_CREDS.email, DEMO_CREDS.password)}
                style={{
                    paddingHorizontal: 11,
                    paddingVertical: 7,
                    borderWidth: 1,
                    borderColor: MR.accent,
                    borderRadius: MR.radius,
                }}
            >
                <Text
                    style={{
                        fontSize: 10,
                        fontFamily: FONTS.extrabold,
                        letterSpacing: 1.2,
                        textTransform: 'uppercase',
                        color: MR.accent,
                    }}
                >
                    Preencher
                </Text>
            </TouchableOpacity>
        </View>
    );
}
