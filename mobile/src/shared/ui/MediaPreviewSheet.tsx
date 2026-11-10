import { type ReactNode, useContext, useEffect, useState } from 'react';
import { Modal, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaInsetsContext, SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { resolveSheetFooterBottom } from './BottomSheet';
import { Button } from './Button';
import { IconButton } from './IconButton';

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

    useEffect(() => {
        setImageFailed(false);
    }, [uri, visible]);

    return (
        <Modal testID={testID} visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            {/* A borda de baixo fica com o rodapé fixo: "Fechar" sempre colado embaixo, não abaixo da imagem. */}
            <SafeAreaView edges={['top', 'left', 'right']} style={{ backgroundColor: tokens.bg, flex: 1 }}>
                <StatusBar animated hidden={false} style={colorScheme === 'dark' ? 'light' : 'dark'} />
                <View style={{ flex: 1, gap: spacing.md, paddingHorizontal: layout.screenGutter, paddingTop: spacing.lg, paddingBottom: spacing.md }}>
                    <View testID={headerTestID} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                        <View style={{ flex: 1 }}>
                            <AppText variant="eyebrow" tone={tone}>
                                {eyebrow}
                            </AppText>
                            <AppText accessibilityRole="header" variant="title">
                                {title}
                            </AppText>
                        </View>
                        <IconButton accessibilityLabel={closeAccessibilityLabel} icon="close" onPress={onClose} />
                    </View>
                    <View
                        style={{
                            alignItems: 'center',
                            backgroundColor: tokens.surfaceMuted,
                            borderRadius: radii.card,
                            flex: 1,
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
                                contentPosition="top"
                                cachePolicy="memory-disk"
                                onError={() => setImageFailed(true)}
                                style={{ height: '100%', width: '100%' }}
                                accessibilityLabel={imageAccessibilityLabel}
                            />
                        )}
                    </View>
                    {details}
                    {actions}
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
                    <Button size="compact" variant="ghost" onPress={onClose} accessibilityLabel={closeAccessibilityLabel}>
                        {closeLabel}
                    </Button>
                </View>
            </SafeAreaView>
        </Modal>
    );
}
