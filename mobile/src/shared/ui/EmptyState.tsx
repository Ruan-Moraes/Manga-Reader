import { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';

interface Props {
    title: string;
    description?: string;
    action?: ReactNode;
    icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: Props) {
    const { spacing } = useTheme();
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
            {icon}
            <AppText variant="section" style={{ textAlign: 'center' }}>
                {title}
            </AppText>
            {description && (
                <AppText variant="body" tone="subtle" style={{ textAlign: 'center' }}>
                    {description}
                </AppText>
            )}
            {action}
        </View>
    );
}
