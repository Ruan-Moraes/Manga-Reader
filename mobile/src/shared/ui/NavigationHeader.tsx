import { type ReactNode, useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { BackButton, type BackButtonAppearance, type BackButtonShape, type BackButtonTone } from './BackButton';

interface NavigationHeaderProps {
    backLabel: string;
    onBack: () => void;
    title?: string;
    action?: ReactNode;
    bottomSpacing?: number;
    backAppearance?: BackButtonAppearance;
    backShape?: BackButtonShape;
    tone?: BackButtonTone;
}

export function NavigationHeader({ backLabel, onBack, title, action, bottomSpacing, backAppearance, backShape, tone = 'default' }: NavigationHeaderProps) {
    const { minimumTouchTarget, spacing } = useTheme();
    // The title stays centred but never runs under the side buttons: both sides reserve the wider one (revisão 2026-11-13).
    const [backWidth, setBackWidth] = useState(minimumTouchTarget);
    const [actionWidth, setActionWidth] = useState(action ? minimumTouchTarget : 0);
    const measure = (set: (width: number) => void) => (event: LayoutChangeEvent) => set(Math.ceil(event.nativeEvent.layout.width));
    const sideInset = Math.max(backWidth, action ? actionWidth : 0) + spacing.xs;

    return (
        <View
            testID="navigation-header"
            style={{
                justifyContent: 'center',
                // One header rhythm for every screen (revisão 2026-11-14): the header owns the space above it and the
                // space before the content, so pages and the scaffold add no top padding of their own.
                marginBottom: bottomSpacing ?? spacing.md,
                marginTop: spacing.sm,
                minHeight: minimumTouchTarget,
                position: 'relative',
                width: '100%',
            }}
        >
            <View
                testID="navigation-header-back"
                onLayout={measure(setBackWidth)}
                style={{ bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', top: 0, zIndex: 1 }}
            >
                <BackButton accessibilityLabel={backLabel} appearance={backAppearance} shape={backShape} tone={tone} onPress={onBack} />
            </View>
            {title ? (
                <AppText
                    accessibilityRole="header"
                    testID="navigation-header-title"
                    numberOfLines={2}
                    variant="heading"
                    tone={tone === 'inverse' ? 'inverse' : 'default'}
                    style={{ marginHorizontal: sideInset, paddingVertical: spacing.sm, textAlign: 'center' }}
                >
                    {title}
                </AppText>
            ) : null}
            {action ? (
                <View
                    testID="navigation-header-action"
                    onLayout={measure(setActionWidth)}
                    style={{ bottom: 0, justifyContent: 'center', position: 'absolute', right: 0, top: 0, zIndex: 1 }}
                >
                    {action}
                </View>
            ) : null}
        </View>
    );
}
