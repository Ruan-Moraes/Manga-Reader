import { useRef, useState } from 'react';
import { AccessibilityInfo, Modal, Pressable, useWindowDimensions, View } from 'react-native';

import { createShadowStyle, useTheme } from '@/shared/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';

const TOOLTIP_MAX_WIDTH = 280;
const ICON_BOX = 24;

interface Anchor {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface HelpTooltipProps {
    /** Accessible name of the trigger, e.g. "Sobre Saturação". */
    label: string;
    description: string;
}

/**
 * "?" next to a control label (062): opens a small bubble anchored to the icon. Tapping outside or the "?" again
 * closes it; screen readers hear the text as soon as it opens.
 */
export function HelpTooltip({ label, description }: HelpTooltipProps) {
    const { metrics, radii, spacing, tokens } = useTheme();
    const { width: screenWidth } = useWindowDimensions();
    const triggerRef = useRef<View>(null);
    const [open, setOpen] = useState(false);
    const [anchor, setAnchor] = useState<Anchor | null>(null);

    const show = () => {
        setOpen(true);
        AccessibilityInfo.announceForAccessibility(description);
        triggerRef.current?.measureInWindow?.((x, y, width, height) => setAnchor({ x, y, width, height }));
    };

    const gutter = spacing.md;
    const bubbleWidth = Math.min(TOOLTIP_MAX_WIDTH, screenWidth - gutter * 2);
    const left = anchor ? Math.min(Math.max(gutter, anchor.x + anchor.width / 2 - bubbleWidth / 2), screenWidth - gutter - bubbleWidth) : gutter;
    const top = anchor ? anchor.y + anchor.height + spacing.sm : 0;

    return (
        <>
            <Pressable
                ref={triggerRef}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ expanded: open }}
                hitSlop={(44 - ICON_BOX) / 2}
                onPress={() => (open ? setOpen(false) : show())}
                style={{ alignItems: 'center', height: ICON_BOX, justifyContent: 'center', width: ICON_BOX }}
            >
                <Icon name="help-circle-outline" size={metrics.icon.md} color={open ? tokens.accentText : tokens.muted} decorative />
            </Pressable>
            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <Pressable
                    testID="help-tooltip-backdrop"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    onPress={() => setOpen(false)}
                    style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
                />
                <View
                    testID="help-tooltip"
                    accessibilityRole="text"
                    style={{
                        backgroundColor: tokens.surfaceElevated,
                        borderColor: tokens.borderStrong,
                        borderRadius: radii.control,
                        borderWidth: 1,
                        left,
                        opacity: anchor ? 1 : 0,
                        paddingHorizontal: spacing.sm + spacing.xs,
                        paddingVertical: spacing.sm,
                        position: 'absolute',
                        top,
                        width: bubbleWidth,
                        ...createShadowStyle('card', tokens.overlay),
                    }}
                >
                    <AppText variant="caption">{description}</AppText>
                </View>
            </Modal>
        </>
    );
}
