import { View } from 'react-native';

import { useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { PressableBox as Pressable } from './PressableBox';

export interface ActionSheetAction {
    key: string;
    label: string;
    onPress: () => void;
    icon?: IconName;
    destructive?: boolean;
    disabled?: boolean;
}

interface ActionSheetProps {
    visible: boolean;
    onClose: () => void;
    closeLabel: string;
    cancelLabel: string;
    actions: readonly ActionSheetAction[];
    title?: string;
    subtitle?: string;
}

/** Per-item actions in a sheet: the sheet closes first, then the chosen action runs. */
export function ActionSheet({ visible, onClose, closeLabel, cancelLabel, actions, title, subtitle }: ActionSheetProps) {
    const { metrics, minimumTouchTarget, radii, spacing, tokens } = useTheme();

    const regular = actions.filter(action => !action.destructive);
    const destructive = actions.filter(action => action.destructive);

    const run = (action: ActionSheetAction) => {
        onClose();
        action.onPress();
    };

    const renderGroup = (group: readonly ActionSheetAction[], testID: string) =>
        group.length ? (
            <View testID={testID} style={{ backgroundColor: tokens.surfaceMuted, borderRadius: radii.card, overflow: 'hidden' }}>
                {group.map((action, index) => {
                    const color = action.destructive ? tokens.danger : tokens.accentText;

                    return (
                        <Pressable
                            key={action.key}
                            testID={`action-sheet-action-${action.key}`}
                            accessibilityLabel={action.label}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: !!action.disabled }}
                            disabled={action.disabled}
                            onPress={() => run(action)}
                            style={({ pressed }) => ({
                                alignItems: 'center',
                                backgroundColor: pressed ? tokens.surfacePressed : 'transparent',
                                borderTopColor: tokens.separator,
                                borderTopWidth: index === 0 ? 0 : 1,
                                flexDirection: 'row',
                                gap: spacing.md,
                                minHeight: Math.max(minimumTouchTarget, metrics.control.comfortable),
                                opacity: action.disabled ? 0.56 : 1,
                                paddingHorizontal: spacing.md,
                            })}
                        >
                            {action.icon ? <Icon name={action.icon} size={metrics.icon.md} color={color} decorative /> : null}
                            <AppText variant="label" tone={action.destructive ? 'danger' : 'default'} style={{ flex: 1 }}>
                                {action.label}
                            </AppText>
                        </Pressable>
                    );
                })}
            </View>
        ) : null;

    return (
        <BottomSheet
            visible={visible}
            onClose={onClose}
            closeLabel={closeLabel}
            title={title}
            description={subtitle}
            testIDs={{ sheet: 'action-sheet', backdrop: 'action-sheet-backdrop', layer: 'action-sheet-layer' }}
        >
            {renderGroup(regular, 'action-sheet-group')}
            {renderGroup(destructive, 'action-sheet-destructive-group')}
            <Button variant="ghost" onPress={onClose}>
                {cancelLabel}
            </Button>
        </BottomSheet>
    );
}
