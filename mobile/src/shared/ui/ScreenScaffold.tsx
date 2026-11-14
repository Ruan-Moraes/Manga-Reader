import { View } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/shared/theme';
import { useResponsiveLayout } from '@/shared/theme';

import { AppText } from './AppText';
import type { BackButtonShape } from './BackButton';
import { NavigationHeader } from './NavigationHeader';
import { PageContainer } from './PageContainer';

interface ScreenScaffoldProps {
    title: string;
    backLabel: string;
    backShape?: BackButtonShape;
    children: ReactNode;
    onBack: () => void;
    scroll?: boolean;
    compact?: boolean;
    headerAction?: ReactNode;
    belowHeader?: ReactNode;
    eyebrow?: string;
    description?: string;
    footer?: ReactNode;
    /** Fixed below the scroll area; use `StickyActionBar` for the single primary action. */
    stickyFooter?: ReactNode;
    contentWidth?: 'form' | 'page';
    contentBottomSpacing?: number;
}

export function ScreenScaffold({
    title,
    backLabel,
    backShape,
    children,
    onBack,
    scroll = true,
    compact = false,
    headerAction,
    belowHeader,
    eyebrow,
    description,
    footer,
    stickyFooter,
    contentWidth = 'page',
    contentBottomSpacing,
}: ScreenScaffoldProps) {
    const { layout, spacing } = useTheme();

    const responsive = useResponsiveLayout();

    return (
        <PageContainer scroll={scroll} stickyFooter={stickyFooter}>
            <View
                testID="screen-scaffold-content"
                style={{
                    alignSelf: 'center',
                    flex: 1,
                    maxWidth: contentWidth === 'form' ? responsive.formMaxWidth : responsive.contentMaxWidth,
                    paddingBottom: contentBottomSpacing ?? (compact ? spacing.md : spacing.xl),
                    width: '100%',
                }}
            >
                {/* The header sets its own spacing (revisão 2026-11-14); the section gap only applies below it. */}
                <View style={{ marginBottom: belowHeader ? spacing.md : 0 }}>
                    <NavigationHeader
                        backLabel={backLabel}
                        backShape={backShape}
                        onBack={onBack}
                        title={compact ? title : undefined}
                        action={headerAction}
                        bottomSpacing={belowHeader ? spacing.xs : undefined}
                    />
                    {belowHeader}
                </View>
                <View testID="screen-scaffold-body" style={{ flex: 1, gap: compact ? spacing.md : layout.sectionGap }}>
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
            </View>
        </PageContainer>
    );
}
