import { type ReactNode, useState } from 'react';
import { Modal, ScrollView, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';
import { AppText, IconButton, PressableBox as Pressable, resolveSheetFooterBottom } from '@/shared/ui';

export interface ReaderControlSection {
    id: string;
    title: string;
    content: ReactNode;
}

interface Props {
    visible: boolean;
    title: string;
    onClose(): void;
    sections?: readonly ReaderControlSection[];
    children?: ReactNode;
    /** Single-sheet mode (063): supporting line under the title. */
    description?: string;
    /** Fixed below the scrollable content, e.g. "All reader settings". */
    footer?: ReactNode;
}

export function ReaderPanel({ visible, title, onClose, sections, children, description, footer }: Props) {
    const { tokens, spacing, radii, layout, minimumTouchTarget, decorativeMotionEnabled, fontScale } = useTheme();
    // Folha única do kit (063): alça, margem lateral da tela e 24 entre grupos; abas antigas mantêm o layout da 052.
    const kitSheet = !!description;
    const gutter = kitSheet ? layout.screenGutter : spacing.md;
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const { t } = useTranslation('reader');
    const [expanded, setExpanded] = useState(false);
    const [activeId, setActiveId] = useState('reading');
    const active = sections?.find(section => section.id === activeId) ?? sections?.[0];
    const usableHeight = height - insets.top;
    const forcedExpanded = fontScale >= 1.6 || usableHeight < 600;
    const fullHeight = forcedExpanded || expanded;

    return (
        <Modal testID="reader-panel" visible={visible} transparent animationType={decorativeMotionEnabled ? 'fade' : 'none'} onRequestClose={onClose}>
            <View className="flex-1 justify-end">
                <Pressable
                    testID="reader-panel-backdrop"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    onPress={onClose}
                    className="absolute inset-0"
                    style={{ backgroundColor: tokens.scrim }}
                />
                <View
                    testID="reader-panel-sheet"
                    accessibilityViewIsModal
                    style={{
                        height: usableHeight * (fullHeight ? 1 : kitSheet ? 0.88 : 0.7),
                        backgroundColor: tokens.surface,
                        borderTopLeftRadius: radii.card,
                        borderTopRightRadius: radii.card,
                        paddingBottom: footer ? 0 : insets.bottom,
                        paddingLeft: insets.left,
                        paddingRight: insets.right,
                        overflow: 'hidden',
                    }}
                >
                    {kitSheet ? (
                        <View style={{ alignItems: 'center', paddingTop: spacing.sm }}>
                            <View
                                testID="reader-panel-handle"
                                style={{ backgroundColor: tokens.borderStrong, borderRadius: radii.pill, height: 5, width: 44 }}
                            />
                        </View>
                    ) : null}
                    <View
                        className="flex-row"
                        style={{
                            alignItems: kitSheet ? 'flex-start' : 'center',
                            gap: spacing.xs,
                            paddingHorizontal: gutter,
                            paddingTop: spacing.sm,
                            // Como nas demais folhas: respiro e divisor sob o cabeçalho (as abas já têm a própria borda).
                            ...(sections?.length
                                ? { paddingBottom: spacing.sm }
                                : { borderBottomColor: tokens.separator, borderBottomWidth: 1, paddingBottom: spacing.md }),
                        }}
                    >
                        <View className="flex-1" style={{ gap: spacing.xs / 2, minWidth: 0 }}>
                            <AppText accessibilityRole="header" variant={description ? 'section' : 'label'}>
                                {title}
                            </AppText>
                            {description ? (
                                <AppText testID="reader-panel-description" variant="caption" tone="muted">
                                    {description}
                                </AppText>
                            ) : null}
                        </View>
                        {!forcedExpanded ? (
                            <IconButton
                                icon={expanded ? 'chevron-down' : 'chevron-up'}
                                accessibilityLabel={t(expanded ? 'panel.collapse' : 'panel.expand')}
                                onPress={() => setExpanded(value => !value)}
                            />
                        ) : null}
                        <IconButton icon="close" accessibilityLabel={t('settings.closeSelection')} onPress={onClose} />
                    </View>
                    {sections?.length ? (
                        <View
                            accessibilityRole="tablist"
                            className="flex-row"
                            style={{ borderBottomColor: tokens.separator, borderBottomWidth: 1, paddingHorizontal: spacing.sm }}
                        >
                            {sections.map(section => (
                                <Pressable
                                    key={section.id}
                                    accessibilityRole="tab"
                                    accessibilityState={{ selected: section.id === active?.id }}
                                    onPress={() => setActiveId(section.id)}
                                    className="flex-1 items-center justify-center"
                                    style={({ pressed }) => ({
                                        minHeight: minimumTouchTarget,
                                        padding: spacing.xs,
                                        backgroundColor: pressed ? tokens.surfacePressed : tokens.surface,
                                        borderBottomWidth: 2,
                                        borderBottomColor: section.id === active?.id ? tokens.accentText : tokens.surface,
                                    })}
                                >
                                    <AppText variant="label" tone={section.id === active?.id ? 'accent' : 'muted'}>
                                        {section.title}
                                    </AppText>
                                </Pressable>
                            ))}
                        </View>
                    ) : null}
                    <ScrollView key={active?.id ?? 'content'} contentContainerStyle={{ gap: kitSheet ? spacing.lg : spacing.md, padding: gutter }}>
                        {active ? active.content : children}
                    </ScrollView>
                    {footer ? (
                        <View
                            testID="reader-panel-footer"
                            style={{
                                borderTopColor: tokens.separator,
                                borderTopWidth: 1,
                                paddingBottom: resolveSheetFooterBottom(insets.bottom, spacing),
                                paddingHorizontal: gutter,
                                paddingTop: spacing.sm,
                            }}
                        >
                            {footer}
                        </View>
                    ) : null}
                </View>
            </View>
        </Modal>
    );
}
