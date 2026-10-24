import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

export function ControlHelp({ label, description }: { label: string; description: string }) {
    const [expanded, setExpanded] = useState(false);
    const { minimumTouchTarget, spacing, tokens } = useTheme();
    return (
        <View style={{ gap: spacing.xs }}>
            <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                onPress={() => setExpanded(value => !value)}
                className="flex-row items-center"
                style={{ minHeight: minimumTouchTarget, gap: spacing.xs }}
            >
                <Icon name={expanded ? 'chevron-up' : 'information-circle-outline'} color={tokens.muted} decorative />
                <AppText variant="caption" tone="muted">
                    {label}
                </AppText>
            </Pressable>
            {expanded ? (
                <AppText variant="caption" tone="muted">
                    {description}
                </AppText>
            ) : null}
        </View>
    );
}
