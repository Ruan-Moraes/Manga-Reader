import { type ReactNode, useState } from 'react';
import { Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';
import { AppText, IconButton } from '@/shared/ui';

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
}

export function ReaderPanel({ visible, title, onClose, sections, children }: Props) {
    const { tokens, spacing, radii, minimumTouchTarget, decorativeMotionEnabled, fontScale } = useTheme();
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
                        height: usableHeight * (fullHeight ? 1 : 0.7),
                        backgroundColor: tokens.surface,
                        borderTopLeftRadius: radii.card,
                        borderTopRightRadius: radii.card,
                        paddingBottom: insets.bottom,
                        paddingLeft: insets.left,
                        paddingRight: insets.right,
                        overflow: 'hidden',
                    }}
                >
                    <View className="flex-row items-center" style={{ gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
                        <AppText accessibilityRole="header" variant="label" className="flex-1">
                            {title}
                        </AppText>
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
                    <ScrollView key={active?.id ?? 'content'} contentContainerStyle={{ gap: spacing.md, padding: spacing.md }}>
                        {active ? active.content : children}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
