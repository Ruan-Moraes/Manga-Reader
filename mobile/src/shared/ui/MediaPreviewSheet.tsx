import { type ReactNode, useEffect, useState } from 'react';
import { Modal, View } from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/src/shared/theme';

import { AppText } from './AppText';
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
    const { colorScheme, radii, spacing, tokens } = useTheme();
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        setImageFailed(false);
    }, [uri, visible]);

    return (
        <Modal testID={testID} visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={{ backgroundColor: tokens.bg, flex: 1 }}>
                <StatusBar animated backgroundColor={tokens.bg} hidden={false} style={colorScheme === 'dark' ? 'light' : 'dark'} translucent={false} />
                <View style={{ flex: 1, gap: spacing.md, padding: spacing.lg }}>
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
                    <Button variant="ghost" onPress={onClose} accessibilityLabel={closeAccessibilityLabel}>
                        {closeLabel}
                    </Button>
                </View>
            </SafeAreaView>
        </Modal>
    );
}
