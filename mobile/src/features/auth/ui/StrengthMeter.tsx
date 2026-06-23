import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';

function passwordStrength(pw: string, tokens: { danger: string; warn: string; success: string; tertiary: string }) {
    if (!pw) return { score: 0, label: '', tone: tokens.tertiary };
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (pw.length >= 12) s++;
    const score = Math.min(s, 4);
    const map: Record<number, { label: string; tone: string }> = {
        1: { label: 'weak', tone: tokens.danger },
        2: { label: 'medium', tone: tokens.warn },
        3: { label: 'strong', tone: '#8bc34a' },
        4: { label: 'great', tone: tokens.success },
    };
    return { score, ...(map[score] ?? { label: 'weak', tone: tokens.danger }) };
}

export function StrengthMeter({ value }: { value: string }) {
    const { tokens } = useTheme();
    const { t } = useTranslation('auth');
    const { score, label, tone } = passwordStrength(value, tokens);

    return (
        <View style={{ marginTop: -6, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 5 }}>
                {[1, 2, 3, 4].map(i => (
                    <View key={i} style={{ flex: 1, height: 4, borderRadius: 999, backgroundColor: i <= score ? tone : tokens.inputBorder }} />
                ))}
            </View>
            <Text
                style={{
                    marginTop: 6,
                    fontSize: 11,
                    letterSpacing: tokens.ls,
                    minHeight: 14,
                    color: score ? tone : tokens.tertiary,
                    fontFamily: FONTS.regular,
                }}
            >
                {score ? t(`passwordStrength.${label}`) : t('validation.passwordMin')}
            </Text>
        </View>
    );
}
