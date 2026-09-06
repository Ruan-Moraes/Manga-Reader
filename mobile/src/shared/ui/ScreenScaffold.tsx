import { View } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/shared/theme';
import { useResponsiveLayout } from '@/shared/theme';

import { AppText } from './AppText';
import { NavigationHeader } from './NavigationHeader';
import { PageContainer } from './PageContainer';

interface ScreenScaffoldProps {
    title: string;
    backLabel: string;
    children: ReactNode;
    onBack: () => void;
    scroll?: boolean;
    compact?: boolean;
    headerAction?: ReactNode;
    eyebrow?: string;
    description?: string;
    footer?: ReactNode;
    contentWidth?: 'form' | 'page';
}

export function ScreenScaffold({
    title,
    backLabel,
    children,
    onBack,
    scroll = true,
    compact = false,
    headerAction,
    eyebrow,
    description,
    footer,
    contentWidth = 'page',
}: ScreenScaffoldProps) {
    const { layout, spacing } = useTheme();

    const responsive = useResponsiveLayout();

    return (
        <PageContainer scroll={scroll}>
            <View
                testID="screen-scaffold-content"
                style={{
                    alignSelf: 'center',
                    flex: 1,
                    gap: compact ? spacing.md : layout.sectionGap,
                    maxWidth: contentWidth === 'form' ? responsive.formMaxWidth : responsive.contentMaxWidth,
                    paddingBottom: compact ? spacing.md : spacing.xl,
                    paddingTop: compact ? spacing.xs : spacing.md,
                    width: '100%',
                }}
            >
                <NavigationHeader backLabel={backLabel} onBack={onBack} title={compact ? title : undefined} action={headerAction} />
                <View style={{ display: compact ? 'none' : 'flex', gap: spacing.sm }}>
                    {eyebrow ? (
                        <AppText variant="eyebrow" tone="accent">
                            {eyebrow}
                        </AppText>
                    ) : null}
                    <AppText accessibilityRole="header" variant={compact ? 'title' : 'display'}>
                        {title}
                    </AppText>
                    {description ? <AppText tone="muted">{description}</AppText> : null}
                </View>
                {children}
                {footer}
            </View>
        </PageContainer>
    );
}
