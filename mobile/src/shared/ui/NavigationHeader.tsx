import { View } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { BackButton, type BackButtonAppearance, type BackButtonShape, type BackButtonTone } from './BackButton';

interface NavigationHeaderProps {
    backLabel: string;
    onBack: () => void;
    title?: string;
    action?: ReactNode;
    backAppearance?: BackButtonAppearance;
    backShape?: BackButtonShape;
    tone?: BackButtonTone;
}

export function NavigationHeader({ backLabel, onBack, title, action, backAppearance, backShape, tone = 'default' }: NavigationHeaderProps) {
    const { minimumTouchTarget, spacing } = useTheme();

    return (
        <View
            testID="navigation-header"
            style={{
                justifyContent: 'center',
                // Respiro sob o voltar: nada encosta no botão (ex.: arte do Entrar/Cadastrar).
                marginBottom: spacing.md,
                minHeight: minimumTouchTarget,
                position: 'relative',
                width: '100%',
            }}
        >
            <View style={{ bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', top: 0, zIndex: 1 }}>
                <BackButton accessibilityLabel={backLabel} appearance={backAppearance} shape={backShape} tone={tone} onPress={onBack} />
            </View>
            {title ? (
                <AppText
                    accessibilityRole="header"
                    numberOfLines={3}
                    variant="heading"
                    tone={tone === 'inverse' ? 'inverse' : 'default'}
                    style={{ alignSelf: 'center', maxWidth: '68%', paddingHorizontal: spacing.xs, paddingVertical: spacing.sm, textAlign: 'center' }}
                >
                    {title}
                </AppText>
            ) : null}
            {action ? <View style={{ bottom: 0, justifyContent: 'center', position: 'absolute', right: 0, top: 0, zIndex: 1 }}>{action}</View> : null}
        </View>
    );
}
