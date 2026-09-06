import { Modal, Pressable, View } from 'react-native';
import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Button } from './Button';

interface AppDialogProps {
    visible: boolean;
    title: string;
    description?: string;
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: () => void;
    onCancel: () => void;
    destructive?: boolean;
    children?: ReactNode;
}

export function AppDialog({ visible, title, description, confirmLabel, cancelLabel, onConfirm, onCancel, destructive, children }: AppDialogProps) {
    const { radii, spacing, tokens } = useTheme();
    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
            <SafeAreaView style={{ backgroundColor: tokens.scrim, flex: 1, justifyContent: 'flex-end', padding: spacing.md }}>
                <Pressable accessibilityLabel={cancelLabel} onPress={onCancel} style={{ flex: 1 }} />
                <View accessibilityViewIsModal style={{ backgroundColor: tokens.surface, borderRadius: radii.feature, gap: spacing.md, padding: spacing.lg }}>
                    <View style={{ gap: spacing.xs }}>
                        <AppText accessibilityRole="header" variant="title">
                            {title}
                        </AppText>
                        {description ? <AppText tone="muted">{description}</AppText> : null}
                    </View>
                    {children}
                    <View style={{ gap: spacing.sm }}>
                        <Button onPress={onConfirm} tone={destructive ? 'danger' : 'accent'}>
                            {confirmLabel}
                        </Button>
                        <Button onPress={onCancel} variant="ghost">
                            {cancelLabel}
                        </Button>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}
