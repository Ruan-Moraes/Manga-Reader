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
}

export function ScreenScaffold({ title, backLabel, children, onBack = () => router.back() }: ScreenScaffoldProps) {
    const { layout, minimumTouchTarget, radii, spacing } = useTheme();

    return (
        <PageContainer scroll>
            <View style={{ flex: 1, gap: layout.sectionGap, paddingBottom: spacing.xl, paddingTop: spacing.md }}>
                <Pressable
                    accessibilityLabel={backLabel}
                    accessibilityRole="button"
                    onPress={onBack}
                    style={{
                        alignItems: 'center',
                        alignSelf: 'flex-start',
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
                <AppText accessibilityRole="header" variant="display">
                    {title}
                </AppText>
                {children}
            </View>
        </PageContainer>
    );
}
