import { ActivityIndicator, View } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

type StatusTone = 'info' | 'loading' | 'warning' | 'danger' | 'success';

interface StatusMessageProps {
    title: string;
    description?: string;
    tone?: StatusTone;
    actionLabel?: string;
    onAction?: () => void;
    icon?: IconName;
    children?: ReactNode;
}

export function StatusMessage({ title, description, tone = 'info', actionLabel, onAction, icon, children }: StatusMessageProps) {
    const { radii, spacing, tokens } = useTheme();
    const color = tone === 'danger' ? tokens.danger : tone === 'warning' ? tokens.warn : tone === 'success' ? tokens.success : tokens.accentText;
    const defaultIcon: IconName =
        tone === 'danger' ? 'alert-circle' : tone === 'warning' ? 'warning' : tone === 'success' ? 'checkmark-circle' : 'information-circle';
    const live = tone === 'danger' ? 'assertive' : 'polite';

    return (
        <View
            accessible
            accessibilityLiveRegion={live}
            accessibilityRole={tone === 'danger' ? 'alert' : tone === 'loading' ? 'progressbar' : 'summary'}
            style={{
                backgroundColor: tokens.surfaceSelected,
                borderColor: color,
                borderRadius: radii.card,
                borderWidth: 1,
                gap: spacing.sm,
                padding: spacing.md,
            }}
        >
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                {tone === 'loading' ? <ActivityIndicator color={tokens.accent} /> : <Icon name={icon ?? defaultIcon} size={20} color={color} />}
                <AppText variant="label" style={{ color, flex: 1 }}>
                    {title}
                </AppText>
            </View>
            {description ? (
                <AppText variant="caption" tone="muted">
                    {description}
                </AppText>
            ) : null}
            {children}
            {actionLabel && onAction ? (
                <Button fullWidth={false} onPress={onAction} variant="outline" tone={tone === 'danger' ? 'danger' : 'accent'}>
                    {actionLabel}
                </Button>
            ) : null}
        </View>
    );
}
