import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/src/shared/theme';
import { FONTS } from '@/src/shared/theme';

interface Props {
    children: React.ReactNode;
    onPress?: () => void;
    loading?: boolean;
    disabled?: boolean;
}

export function PrimaryButton({ children, onPress, loading, disabled }: Props) {
    const { tokens } = useTheme();
    const { t } = useTranslation('common');
    const off = loading || disabled;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={!!off}
            activeOpacity={0.85}
            style={{
                height: tokens.controlHeight,
                width: '100%',
                borderRadius: tokens.radius,
                backgroundColor: off ? tokens.inputBorder : tokens.accent,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 10,
            }}
        >
            {loading ? (
                <>
                    <ActivityIndicator size="small" color={tokens.tertiary} />
                    <Text style={{ fontFamily: FONTS.extrabold, fontSize: 14, color: tokens.tertiary, letterSpacing: 1.7, textTransform: 'uppercase' }}>
                        {t('label.loading')}
                    </Text>
                </>
            ) : (
                <Text style={{ fontFamily: FONTS.extrabold, fontSize: 14, color: tokens.bg, letterSpacing: 1.7, textTransform: 'uppercase' }}>{children}</Text>
            )}
        </TouchableOpacity>
    );
}
