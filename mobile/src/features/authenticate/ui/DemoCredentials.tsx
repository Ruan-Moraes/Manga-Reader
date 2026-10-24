import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/theme';
import { FONTS } from '@/shared/theme';

import { DEMO_CREDS } from '../config/demoCredentials';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

interface Props {
    onFill: (email: string, password: string) => void;
}

/** Caixa de credenciais demo — renderizar apenas em __DEV__. */
export function DemoCredentials({ onFill }: Props) {
    const { minimumTouchTarget, radii, spacing, tokens, typography } = useTheme();
    const { t } = useTranslation('auth');

    return (
        <View
            style={{
                marginTop: spacing.lg,
                padding: spacing.md,
                borderRadius: radii.card,
                backgroundColor: tokens.accentSoft,
                borderWidth: 1,
                borderColor: tokens.accentBorder,
                borderStyle: 'dashed',
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: spacing.md,
            }}
        >
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                    style={{
                        fontSize: typography.minimum,
                        fontFamily: FONTS.extrabold,
                        letterSpacing: 1.4,
                        textTransform: 'uppercase',
                        color: tokens.accentText,
                        marginBottom: spacing.sm,
                    }}
                >
                    {t('login.demoTitle')}
                </Text>
                <Text style={{ fontFamily: MONO, fontSize: typography.small, color: tokens.muted, lineHeight: typography.small * 1.45 }}>
                    {DEMO_CREDS.email}
                </Text>
                <Text style={{ fontFamily: MONO, fontSize: typography.small, color: tokens.muted, lineHeight: typography.small * 1.45 }}>
                    {DEMO_CREDS.password}
                </Text>
            </View>

            <TouchableOpacity
                onPress={() => onFill(DEMO_CREDS.email, DEMO_CREDS.password)}
                accessibilityRole="button"
                style={{
                    minHeight: minimumTouchTarget,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderWidth: 1,
                    borderColor: tokens.accentBorder,
                    borderRadius: radii.control,
                    justifyContent: 'center',
                }}
            >
                <Text
                    style={{
                        fontSize: typography.minimum,
                        fontFamily: FONTS.extrabold,
                        letterSpacing: 1.2,
                        textTransform: 'uppercase',
                        color: tokens.accentText,
                    }}
                >
                    {t('login.demoFill')}
                </Text>
            </TouchableOpacity>
        </View>
    );
}
