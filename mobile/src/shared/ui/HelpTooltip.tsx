import { useContext, useRef, useState } from 'react';
import { AccessibilityInfo, Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

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
    const { effectiveReduceMotion, metrics, radii, spacing, tokens } = useTheme();
    const insets = useContext(SafeAreaInsetsContext);
    const triggerRef = useRef<View>(null);
    const layerRef = useRef<View>(null);
    const [open, setOpen] = useState(false);
    const [anchor, setAnchor] = useState<Anchor | null>(null);
    const [layer, setLayer] = useState<Anchor | null>(null);
    const [bubbleHeight, setBubbleHeight] = useState(0);

    const show = () => {
        setAnchor(null);
        setLayer(null);
        setBubbleHeight(0);
        setOpen(true);
        AccessibilityInfo.announceForAccessibility(description);
    };

    const measure = () => {
        layerRef.current?.measureInWindow?.((x, y, width, height) => setLayer({ x, y, width, height }));
        triggerRef.current?.measureInWindow?.((x, y, width, height) => setAnchor({ x, y, width, height }));
    };

    const gutter = spacing.md;
    const minLeft = (insets?.left ?? 0) + gutter;
    const maxRight = (layer?.width ?? 0) - (insets?.right ?? 0) - gutter;
    const bubbleWidth = layer ? Math.min(TOOLTIP_MAX_WIDTH, Math.max(0, maxRight - minLeft)) : TOOLTIP_MAX_WIDTH;
    const left = anchor && layer ? Math.min(Math.max(minLeft, anchor.x - layer.x), maxRight - bubbleWidth) : minLeft;
    const minTop = (insets?.top ?? 0) + gutter;
    const maxBottom = (layer?.height ?? 0) - (insets?.bottom ?? 0) - gutter;
    const anchorTop = anchor && layer ? anchor.y - layer.y : minTop;
    const belowTop = anchorTop + (anchor?.height ?? 0) + spacing.xs;
    const spaceAbove = Math.max(0, anchorTop - spacing.xs - minTop);
    const spaceBelow = Math.max(0, maxBottom - belowTop);
    const above = bubbleHeight > spaceBelow && spaceAbove > spaceBelow;
    const top = above ? Math.max(minTop, anchorTop - spacing.xs - bubbleHeight) : Math.max(minTop, belowTop);

    return (
        <>
            <Pressable
                ref={triggerRef}
                collapsable={false}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ expanded: open }}
                hitSlop={(44 - ICON_BOX) / 2}
                onPress={() => (open ? setOpen(false) : show())}
                style={{ alignItems: 'center', height: ICON_BOX, justifyContent: 'center', width: ICON_BOX }}
            >
                <Icon name="help-circle-outline" size={metrics.icon.md} color={open ? tokens.accentText : tokens.muted} decorative />
            </Pressable>
            <Modal
                visible={open}
                transparent
                statusBarTranslucent
                navigationBarTranslucent
                animationType={effectiveReduceMotion ? 'none' : 'fade'}
                onRequestClose={() => setOpen(false)}
            >
                <View ref={layerRef} testID="help-tooltip-layer" collapsable={false} onLayout={measure} style={{ flex: 1 }}>
                    <Pressable
                        testID="help-tooltip-backdrop"
                        accessibilityElementsHidden
                        importantForAccessibility="no-hide-descendants"
                        onPress={() => setOpen(false)}
                        style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
                    />
                    <View
                        testID="help-tooltip"
                        onLayout={event => setBubbleHeight(event.nativeEvent.layout.height)}
                        style={{
                            backgroundColor: tokens.surfaceElevated,
                            borderColor: tokens.borderStrong,
                            borderRadius: radii.control,
                            borderWidth: 1,
                            left,
                            maxHeight: layer ? Math.max(spaceAbove, spaceBelow) : undefined,
                            opacity: anchor && layer && bubbleHeight > 0 ? 1 : 0,
                            position: 'absolute',
                            top,
                            width: bubbleWidth,
                            ...createShadowStyle('card', tokens.overlay),
                        }}
                    >
                        <ScrollView
                            bounces={false}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: spacing.sm + spacing.xs, paddingVertical: spacing.sm }}
                        >
                            <AppText variant="caption">{description}</AppText>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
}
