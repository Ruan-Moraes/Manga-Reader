import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { ReactNode } from 'react';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';
import { PageContainer } from './PageContainer';

interface ScreenScaffoldProps {
    title: string;
    backLabel: string;
    children: ReactNode;
    onBack?: () => void;
    scroll?: boolean;
    compact?: boolean;
    headerAction?: ReactNode;
}

export function ScreenScaffold({
    title,
    backLabel,
    children,
    onBack = () => router.back(),
    scroll = true,
    compact = false,
    headerAction,
}: ScreenScaffoldProps) {
    const { layout, minimumTouchTarget, radii, spacing } = useTheme();

    return (
        <PageContainer scroll={scroll}>
            <View
                testID="screen-scaffold-content"
                style={{
                    flex: 1,
                    gap: compact ? spacing.md : layout.sectionGap,
                    paddingBottom: compact ? spacing.md : spacing.xl,
                    paddingTop: compact ? spacing.xs : spacing.md,
                }}
            >
                <View style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Pressable
                        accessibilityLabel={backLabel}
                        accessibilityRole="button"
                        onPress={onBack}
                        style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: minimumTouchTarget,
                            paddingHorizontal: spacing.sm,
                            borderRadius: radii.control,
                        }}
                    >
                        <AppText variant="label" tone="accent">
                            ‹ {backLabel}
                        </AppText>
                    </Pressable>
                    {headerAction}
                </View>
                <AppText accessibilityRole="header" variant={compact ? 'title' : 'display'}>
                    {title}
                </AppText>
                {children}
            </View>
        </PageContainer>
    );
}
