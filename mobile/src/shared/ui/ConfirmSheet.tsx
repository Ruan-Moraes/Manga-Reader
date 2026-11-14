import { View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { CenterDialog, DialogAction } from './CenterDialog';
import { Icon, type IconName } from './Icon';

export interface ConfirmDialogProps {
    visible: boolean;
    /** Called by cancel, scrim, Android back and the escape gesture; never confirms. */
    onClose: () => void;
    onConfirm: () => void;
    /** Accessible label of the scrim. */
    closeLabel: string;
    cancelLabel: string;
    confirmLabel: string;
    title: string;
    description?: string;
    /** Heading of the "what will be removed" list. */
    itemsTitle?: string;
    items?: readonly string[];
    /** Heading of the "what stays" list, shown beside the removed items. */
    preservedTitle?: string;
    preservedItems?: readonly string[];
    icon?: IconName;
    /** `danger` for destructive actions (default); `accent` for confirmations that remove nothing. */
    tone?: 'danger' | 'accent';
}

function ItemList({ testID, title, items, icon, color }: { testID: string; title?: string; items: readonly string[]; icon: IconName; color: string }) {
    const { metrics, radii, spacing, tokens } = useTheme();
    return (
        <View
            testID={testID}
            style={{ backgroundColor: tokens.surfaceMuted, borderRadius: radii.control, flexBasis: 140, flexGrow: 1, gap: spacing.xs, padding: spacing.sm + 4 }}
        >
            {title ? (
                <AppText variant="eyebrow" tone="subtle" style={{ marginBottom: 2 }}>
                    {title}
                </AppText>
            ) : null}
            {items.map(item => (
                <View key={item} style={{ alignItems: 'flex-start', flexDirection: 'row', gap: spacing.xs + 2 }}>
                    <Icon name={icon} size={metrics.icon.sm} color={color} decorative style={{ marginTop: 1 }} />
                    <AppText variant="caption" style={{ flex: 1 }}>
                        {item}
                    </AppText>
                </View>
            ))}
        </View>
    );
}

/**
 * Confirmation in a centered dialog (2026-11-10): what is removed and what stays side by side when they fit, cancel and
 * confirm as separate buttons; only the confirm button confirms.
 */
export function ConfirmDialog({
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
    preservedTitle,
    preservedItems,
    icon,
    tone = 'danger',
}: ConfirmDialogProps) {
    const { spacing, tokens } = useTheme();

    const confirm = () => {
        onClose();
        onConfirm();
    };

    return (
        <CenterDialog
            visible={visible}
            onClose={onClose}
            closeLabel={closeLabel}
            title={title}
            description={description}
            icon={icon ?? (tone === 'danger' ? 'trash-outline' : 'help-circle-outline')}
            tone={tone}
            showHeaderDivider={false}
            testIDs={{ layer: 'confirm-sheet-layer', backdrop: 'confirm-sheet-backdrop', card: 'confirm-sheet', icon: 'confirm-sheet-icon' }}
            actions={
                <>
                    <DialogAction>
                        <Button variant="outline" tone="neutral" onPress={onClose} testID="confirm-sheet-cancel">
                            {cancelLabel}
                        </Button>
                    </DialogAction>
                    <DialogAction>
                        <Button tone={tone} onPress={confirm} testID="confirm-sheet-confirm">
                            {confirmLabel}
                        </Button>
                    </DialogAction>
                </>
            }
        >
            {items?.length || preservedItems?.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {items?.length ? (
                        <ItemList testID="confirm-sheet-items" title={itemsTitle} items={items} icon="remove-circle-outline" color={tokens.danger} />
                    ) : null}
                    {preservedItems?.length ? (
                        <ItemList
                            testID="confirm-sheet-preserved"
                            title={preservedTitle}
                            items={preservedItems}
                            icon="checkmark-circle-outline"
                            color={tokens.success}
                        />
                    ) : null}
                </View>
            ) : null}
        </CenterDialog>
    );
}

/** @deprecated Kept for existing call sites; renders the centered {@link ConfirmDialog}. */
export const ConfirmSheet = ConfirmDialog;
