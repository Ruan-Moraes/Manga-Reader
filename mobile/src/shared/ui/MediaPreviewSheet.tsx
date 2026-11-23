import { type ReactNode, useContext, useEffect, useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaInsetsContext, SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { resolveSheetFooterBottom } from './BottomSheet';
import { Button } from './Button';
import { PanelHeader } from './PanelHeader';

export interface MediaPreviewSheetProps {
    visible: boolean;
    uri: string | null;
    eyebrow: string;
    title: string;
    imageAccessibilityLabel: string;
    unavailableAccessibilityLabel: string;
    closeAccessibilityLabel: string;
    closeLabel: string;
    onClose: () => void;
    tone?: 'accent' | 'danger';
    details?: ReactNode;
    actions?: ReactNode;
    testID?: string;
    headerTestID?: string;
    imageTestID?: string;
}

export function MediaPreviewSheet({
    visible,
    uri,
    eyebrow,
    title,
    imageAccessibilityLabel,
    unavailableAccessibilityLabel,
    closeAccessibilityLabel,
    closeLabel,
    onClose,
    tone = 'accent',
    details,
    actions,
    testID,
    headerTestID,
    imageTestID,
}: MediaPreviewSheetProps) {
    const { colorScheme, layout, radii, spacing, tokens } = useTheme();
    const insets = useContext(SafeAreaInsetsContext) ?? { bottom: 0, left: 0, right: 0, top: 0 };
    const [imageFailed, setImageFailed] = useState(false);
    const pageLabel = eyebrow ? (
        <AppText variant="eyebrow" tone={tone}>
            {eyebrow}
        </AppText>
    ) : null;

    useEffect(() => {
        setImageFailed(false);
    }, [uri, visible]);

    const preview = (
        <View
            style={{
                alignItems: 'center',
                backgroundColor: tokens.surfaceMuted,
                borderRadius: radii.card,
                ...(actions ? { aspectRatio: 16 / 9, maxHeight: 240 } : { flex: 1 }),
                justifyContent: 'center',
                overflow: 'hidden',
            }}
        >
            {!uri || imageFailed ? (
                <Ionicons accessibilityLabel={unavailableAccessibilityLabel} name="image-outline" size={48} color={tokens.muted} />
            ) : (
                <Image
                    testID={imageTestID}
                    source={{ uri }}
                    contentFit="contain"
                    contentPosition={actions ? 'center' : 'top'}
                    cachePolicy="memory-disk"
                    onError={() => setImageFailed(true)}
                    style={{ height: '100%', width: '100%' }}
                    accessibilityLabel={imageAccessibilityLabel}
                />
            )}
        </View>
    );

    return (
        <Modal testID={testID} visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: tokens.bg, flex: 1 }}>
                <StatusBar animated hidden={false} style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <View
                    style={{
                        flex: 1,
                        gap: spacing.md,
                        paddingHorizontal: layout.screenGutter,
                        paddingTop: actions ? spacing.sm : spacing.lg,
                        paddingBottom: spacing.md,
                    }}
                >
                    <PanelHeader
                        title={title}
                        eyebrow={actions ? pageLabel : undefined}
                        metadata={actions ? undefined : pageLabel}
                        gutter={0}
                        testID={headerTestID}
                        closeLabel={closeAccessibilityLabel}
                        onClose={onClose}
                    />
                    {actions ? (
                        <ScrollView
                            style={{ flex: 1 }}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ gap: spacing.md }}
                        >
                            {details}
                            {preview}
                        </ScrollView>
                    ) : (
                        <>
                            {preview}
                            {details}
                        </>
                    )}
                </View>
                <View
                    testID="media-preview-footer"
                    style={{
                        borderTopColor: tokens.separator,
                        borderTopWidth: 1,
                        paddingBottom: resolveSheetFooterBottom(insets.bottom, spacing),
                        paddingHorizontal: layout.screenGutter,
                        paddingTop: spacing.sm,
                    }}
                >
                    {actions ?? (
                        <Button size="compact" variant="ghost" onPress={onClose} accessibilityLabel={closeAccessibilityLabel}>
                            {closeLabel}
                        </Button>
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
}
