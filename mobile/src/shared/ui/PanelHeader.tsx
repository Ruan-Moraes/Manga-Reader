import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { IconButton } from './IconButton';

interface Props {
    title?: string;
    description?: string;
    descriptionTestID?: string;
    eyebrow?: ReactNode;
    metadata?: ReactNode;
    actions?: ReactNode;
    closeLabel: string;
    onClose: () => void;
    gutter?: number;
    testID?: string;
}

export function PanelHeader({ title, description, descriptionTestID, eyebrow, metadata, actions, closeLabel, onClose, gutter, testID }: Props) {
    const { layout, spacing, tokens } = useTheme();

    return (
        <View
            testID={testID}
            style={{
                alignItems: 'center',
                borderBottomColor: tokens.separator,
                borderBottomWidth: 1,
                flexDirection: 'row',
                gap: spacing.md,
                paddingHorizontal: gutter ?? layout.screenGutter,
                paddingVertical: spacing.sm,
            }}
        >
            <View style={{ flex: 1, gap: spacing.xs, minWidth: 0 }}>
                {eyebrow}
                {title ? (
                    <AppText accessibilityRole="header" variant="section">
                        {title}
                    </AppText>
                ) : null}
                {description ? (
                    <AppText testID={descriptionTestID} variant="caption" tone="muted">
                        {description}
                    </AppText>
                ) : null}
                {metadata}
            </View>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                {actions}
                <IconButton icon="close" accessibilityLabel={closeLabel} onPress={onClose} surface="surface" />
            </View>
        </View>
    );
}
