import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';

interface LoadingBlockProps {
    label: string;
    inline?: boolean;
    testID?: string;
}

/** Loading state for content whose shape is unknown; announced as status. */
export function LoadingBlock({ label, inline = false, testID = 'loading-block' }: LoadingBlockProps) {
    const { layout, spacing, tokens } = useTheme();

    return (
        <View
            testID={testID}
            accessible
            accessibilityLabel={label}
            accessibilityLiveRegion="polite"
            role="status"
            style={{
                alignItems: 'center',
                gap: spacing.md,
                justifyContent: 'center',
                ...(inline
                    ? { paddingHorizontal: layout.screenGutter, paddingVertical: spacing.xl }
                    : { flex: 1, paddingHorizontal: spacing.xl, paddingVertical: spacing['2xl'] }),
            }}
        >
            <ActivityIndicator color={tokens.accent} size="large" />
            <AppText tone="muted" style={{ textAlign: 'center' }}>
                {label}
            </AppText>
        </View>
    );
}
