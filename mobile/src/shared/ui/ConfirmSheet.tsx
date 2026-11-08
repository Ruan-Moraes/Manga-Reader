import { View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

interface ConfirmSheetProps {
    visible: boolean;
    /** Called by cancel, close, scrim and Android back; never confirms. */
    onClose: () => void;
    onConfirm: () => void;
    closeLabel: string;
    cancelLabel: string;
    confirmLabel: string;
    title: string;
    description?: string;
    /** Heading of the "what will be removed" list. */
    itemsTitle?: string;
    items?: readonly string[];
    icon?: IconName;
}

/** Destructive confirmation: cancel and confirm are separate buttons and only the confirm button confirms. */
export function ConfirmSheet({
    visible,
    onClose,
    onConfirm,
    closeLabel,
    cancelLabel,
    confirmLabel,
    title,
    description,
    itemsTitle,
    items,
    icon = 'trash-outline',
}: ConfirmSheetProps) {
    const { metrics, radii, spacing, tokens } = useTheme();

    const confirm = () => {
        onClose();
        onConfirm();
    };

    return (
        <BottomSheet
            visible={visible}
            onClose={onClose}
            closeLabel={closeLabel}
            testIDs={{ sheet: 'confirm-sheet', backdrop: 'confirm-sheet-backdrop', layer: 'confirm-sheet-layer' }}
        >
            <View style={{ alignItems: 'center', gap: spacing.sm }}>
                <View
                    testID="confirm-sheet-icon"
                    style={{
                        alignItems: 'center',
                        backgroundColor: tokens.dangerSoft,
                        borderRadius: radii.pill,
                        height: metrics.control.comfortable,
                        justifyContent: 'center',
                        width: metrics.control.comfortable,
                    }}
                >
                    <Icon name={icon} size={metrics.icon.lg} color={tokens.danger} decorative />
                </View>
                <AppText accessibilityRole="header" variant="section" style={{ textAlign: 'center' }}>
                    {title}
                </AppText>
                {description ? (
                    <AppText tone="muted" style={{ textAlign: 'center' }}>
                        {description}
                    </AppText>
                ) : null}
            </View>
            {items?.length ? (
                <View
                    testID="confirm-sheet-items"
                    style={{ backgroundColor: tokens.surfaceMuted, borderRadius: radii.card, gap: spacing.sm, padding: metrics.rhythm.cardPadding }}
                >
                    {itemsTitle ? (
                        <AppText variant="eyebrow" tone="subtle">
                            {itemsTitle}
                        </AppText>
                    ) : null}
                    {items.map(item => (
                        <View key={item} style={{ alignItems: 'center', flexDirection: 'row', gap: spacing.sm }}>
                            <Icon name="remove-circle-outline" size={metrics.icon.sm} color={tokens.danger} decorative />
                            <AppText variant="caption" style={{ flex: 1 }}>
                                {item}
                            </AppText>
                        </View>
                    ))}
                </View>
            ) : null}
            <View style={{ gap: spacing.md }}>
                <Button variant="outline" onPress={onClose} testID="confirm-sheet-cancel">
                    {cancelLabel}
                </Button>
                <Button tone="danger" onPress={confirm} testID="confirm-sheet-confirm">
                    {confirmLabel}
                </Button>
            </View>
        </BottomSheet>
    );
}
